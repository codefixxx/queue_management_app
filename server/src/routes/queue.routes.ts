import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { sanitizedString, optionalSanitizedString } from '../utils/sanitize';

const router = Router();

const createQueueSchema = z.object({
  name: sanitizedString(2, 100),
  description: optionalSanitizedString(500),
  prefix: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Prefix must be 1 to 4 alphanumeric characters')
    .transform((s) => s.toUpperCase())
    .default('Q')
});

const updateQueueSchema = z.object({
  name: sanitizedString(2, 100).optional(),
  description: optionalSanitizedString(500),
  prefix: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Prefix must be 1 to 4 alphanumeric characters')
    .transform((s) => s.toUpperCase())
    .optional()
});

function getCleanParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0]?.trim() || '';
  return typeof param === 'string' ? param.trim() : '';
}

// List all queues for the manager (Optimized: single groupBy for counts instead of full token scanning)
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [queues, tokenCounts] = await Promise.all([
      prisma.queue.findMany({
        where: { managerId: req.user!.id },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.token.groupBy({
        by: ['queueId', 'status'],
        where: { queue: { managerId: req.user!.id } },
        _count: { _all: true }
      })
    ]);

    const countMap: Record<string, Record<string, number>> = {};
    for (const item of tokenCounts) {
      if (!countMap[item.queueId]) {
        countMap[item.queueId] = {};
      }
      countMap[item.queueId][item.status] = item._count._all;
    }

    const enriched = queues.map((q) => {
      const qCounts = countMap[q.id] || {};
      const waiting = qCounts['WAITING'] || 0;
      const inService = qCounts['IN_SERVICE'] || 0;
      const completed = qCounts['COMPLETED'] || 0;
      const cancelled = qCounts['CANCELLED'] || 0;

      return {
        id: q.id,
        name: q.name,
        description: q.description,
        prefix: q.prefix,
        currentNumber: q.currentNumber,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        counts: {
          waiting,
          inService,
          completed,
          cancelled,
          total: waiting + inService + completed + cancelled
        }
      };
    });

    res.json({ queues: enriched });
  } catch (error) {
    console.error('Fetch queues error:', error);
    res.status(500).json({ error: 'Failed to fetch queues' });
  }
});

// Create a new queue
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createQueueSchema.parse(req.body);

    const queue = await prisma.queue.create({
      data: {
        name: validated.name,
        description: validated.description,
        prefix: validated.prefix,
        managerId: req.user!.id
      }
    });

    res.status(201).json({
      message: 'Queue created successfully',
      queue: {
        ...queue,
        counts: { waiting: 0, inService: 0, completed: 0, cancelled: 0, total: 0 }
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
      return;
    }
    console.error('Create queue error:', error);
    res.status(500).json({ error: 'Failed to create queue' });
  }
});

// Get single queue with waiting tokens & current in-service tokens
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queueId = getCleanParam(req.params.id);
    if (!queueId) {
      res.status(400).json({ error: 'Queue ID is required' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    // Consolidated concurrent execution: fetches queue with active tokens, paginated history, and status counts in 1 parallel batch
    const [queueWithActive, completedTokens, cancelledTokens, statusCounts] = await Promise.all([
      prisma.queue.findFirst({
        where: { id: queueId, managerId: req.user!.id },
        include: {
          tokens: {
            where: { status: { in: ['WAITING', 'IN_SERVICE'] } },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
          }
        }
      }),
      prisma.token.findMany({
        where: { queueId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.token.findMany({
        where: { queueId, status: 'CANCELLED' },
        orderBy: { cancelledAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.token.groupBy({
        by: ['status'],
        where: { queueId },
        _count: { _all: true }
      })
    ]);

    if (!queueWithActive) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const waitingTokens = queueWithActive.tokens.filter((t) => t.status === 'WAITING');
    const inServiceTokens = queueWithActive.tokens.filter((t) => t.status === 'IN_SERVICE');

    const completedCount = statusCounts.find((s) => s.status === 'COMPLETED')?._count._all ?? completedTokens.length;
    const cancelledCount = statusCounts.find((s) => s.status === 'CANCELLED')?._count._all ?? cancelledTokens.length;
    const totalCount = waitingTokens.length + inServiceTokens.length + completedCount + cancelledCount;

    res.json({
      queue: {
        id: queueWithActive.id,
        name: queueWithActive.name,
        description: queueWithActive.description,
        prefix: queueWithActive.prefix,
        currentNumber: queueWithActive.currentNumber,
        createdAt: queueWithActive.createdAt,
        updatedAt: queueWithActive.updatedAt,
        waitingTokens,
        inServiceTokens,
        recentCompleted: completedTokens,
        recentCancelled: cancelledTokens,
        pagination: {
          page,
          limit,
          completedTotal: completedCount,
          cancelledTotal: cancelledCount
        },
        counts: {
          waiting: waitingTokens.length,
          inService: inServiceTokens.length,
          completed: completedCount,
          cancelled: cancelledCount,
          total: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Failed to retrieve queue' });
  }
});

// Update queue
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queueId = getCleanParam(req.params.id);
    if (!queueId) {
      res.status(400).json({ error: 'Queue ID is required' });
      return;
    }
    const validated = updateQueueSchema.parse(req.body);

    const existing = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const updated = await prisma.queue.update({
      where: { id: queueId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.prefix && { prefix: validated.prefix })
      }
    });

    res.json({ message: 'Queue updated successfully', queue: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ error: 'Failed to update queue' });
  }
});

// Delete queue
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queueId = getCleanParam(req.params.id);
    if (!queueId) {
      res.status(400).json({ error: 'Queue ID is required' });
      return;
    }

    const existing = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    await prisma.queue.delete({
      where: { id: queueId }
    });

    res.json({ message: 'Queue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete queue' });
  }
});

// Requirement 6: Assign top token in the queue for service [With a simple button click]
router.post('/:id/serve-next', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queueId = getCleanParam(req.params.id);
    if (!queueId) {
      res.status(400).json({ error: 'Queue ID is required' });
      return;
    }

    // Verify ownership
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id }
    });

    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const servedTime = new Date();

    // Use an atomic transaction with concurrency safeguards
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the top waiting token INSIDE the transaction
      const topToken = await tx.token.findFirst({
        where: { queueId, status: 'WAITING' },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
      });

      if (!topToken) {
        return null;
      }

      // 2. Conditionally update status only if it is still WAITING (prevents TOCTOU race conditions)
      const updateCount = await tx.token.updateMany({
        where: { id: topToken.id, status: 'WAITING' },
        data: {
          status: 'IN_SERVICE',
          servedAt: servedTime,
          servedBy: req.user!.name,
          position: 0
        }
      });

      if (updateCount.count === 0) {
        throw new Error('CONCURRENT_UPDATE_CONFLICT');
      }

      const served = await tx.token.findUnique({
        where: { id: topToken.id }
      });

      // 3. Fetch remaining waiting tokens and re-normalize positions starting from 1
      const remainingTokens = await tx.token.findMany({
        where: { queueId, status: 'WAITING' },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
      });

      for (let i = 0; i < remainingTokens.length; i++) {
        const expectedPos = i + 1;
        if (remainingTokens[i].position !== expectedPos) {
          await tx.token.update({
            where: { id: remainingTokens[i].id },
            data: { position: expectedPos }
          });
        }
      }

      return served;
    });

    if (!result) {
      res.status(400).json({ error: 'No waiting tokens in the queue to serve' });
      return;
    }

    res.json({
      message: `Token ${result.tokenNumber} is now assigned for service`,
      token: result
    });
  } catch (error: any) {
    if (error?.message === 'CONCURRENT_UPDATE_CONFLICT') {
      res.status(409).json({ error: 'Queue state changed concurrently. Please try again.' });
      return;
    }
    console.error('Serve next token error:', error);
    res.status(500).json({ error: 'Failed to assign top token for service' });
  }
});

export default router;
