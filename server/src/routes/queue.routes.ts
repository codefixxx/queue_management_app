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

// List all queues for the manager
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queues = await prisma.queue.findMany({
      where: { managerId: req.user!.id },
      include: {
        tokens: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            servedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = queues.map((q) => {
      const waitingCount = q.tokens.filter((t) => t.status === 'WAITING').length;
      const inServiceCount = q.tokens.filter((t) => t.status === 'IN_SERVICE').length;
      const completedCount = q.tokens.filter((t) => t.status === 'COMPLETED').length;
      const cancelledCount = q.tokens.filter((t) => t.status === 'CANCELLED').length;

      return {
        id: q.id,
        name: q.name,
        description: q.description,
        prefix: q.prefix,
        currentNumber: q.currentNumber,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        counts: {
          waiting: waitingCount,
          inService: inServiceCount,
          completed: completedCount,
          cancelled: cancelledCount,
          total: q.tokens.length
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

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id }
    });

    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    // Bounded queries utilizing index [queueId, status] and [queueId, position]
    const [waitingTokens, inServiceTokens, completedTokens, cancelledTokens, completedCount, cancelledCount] =
      await Promise.all([
        prisma.token.findMany({
          where: { queueId, status: 'WAITING' },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
        }),
        prisma.token.findMany({
          where: { queueId, status: 'IN_SERVICE' },
          orderBy: { servedAt: 'desc' }
        }),
        prisma.token.findMany({
          where: { queueId, status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 10
        }),
        prisma.token.findMany({
          where: { queueId, status: 'CANCELLED' },
          orderBy: { cancelledAt: 'desc' },
          take: 10
        }),
        prisma.token.count({
          where: { queueId, status: 'COMPLETED' }
        }),
        prisma.token.count({
          where: { queueId, status: 'CANCELLED' }
        })
      ]);

    const totalCount = waitingTokens.length + inServiceTokens.length + completedCount + cancelledCount;

    res.json({
      queue: {
        id: queue.id,
        name: queue.name,
        description: queue.description,
        prefix: queue.prefix,
        currentNumber: queue.currentNumber,
        createdAt: queue.createdAt,
        updatedAt: queue.updatedAt,
        waitingTokens,
        inServiceTokens,
        recentCompleted: completedTokens,
        recentCancelled: cancelledTokens,
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
