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
      where: { id: queueId, managerId: req.user!.id },
      include: {
        tokens: {
          orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const waitingTokens = queue.tokens
      .filter((t) => t.status === 'WAITING')
      .sort((a, b) => a.position - b.position);

    const inServiceTokens = queue.tokens
      .filter((t) => t.status === 'IN_SERVICE')
      .sort((a, b) => (b.servedAt ? new Date(b.servedAt).getTime() : 0) - (a.servedAt ? new Date(a.servedAt).getTime() : 0));

    const completedTokens = queue.tokens
      .filter((t) => t.status === 'COMPLETED')
      .sort((a, b) => (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0))
      .slice(0, 10);

    const cancelledTokens = queue.tokens
      .filter((t) => t.status === 'CANCELLED')
      .sort((a, b) => (b.cancelledAt ? new Date(b.cancelledAt).getTime() : 0) - (a.cancelledAt ? new Date(a.cancelledAt).getTime() : 0))
      .slice(0, 10);

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
          completed: queue.tokens.filter((t) => t.status === 'COMPLETED').length,
          cancelled: queue.tokens.filter((t) => t.status === 'CANCELLED').length,
          total: queue.tokens.length
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

    // Find the token at the top of the queue (lowest position among WAITING tokens)
    const topToken = await prisma.token.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' }
    });

    if (!topToken) {
      res.status(400).json({ error: 'No waiting tokens in the queue to serve' });
      return;
    }

    const servedTime = new Date();

    // Use a transaction to update topToken to IN_SERVICE and adjust positions of remaining waiting tokens
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update topToken to IN_SERVICE
      const served = await tx.token.update({
        where: { id: topToken.id },
        data: {
          status: 'IN_SERVICE',
          servedAt: servedTime,
          servedBy: req.user!.name,
          position: 0
        }
      });

      // 2. Fetch remaining waiting tokens and re-normalize positions starting from 1
      const remainingTokens = await tx.token.findMany({
        where: { queueId, status: 'WAITING' },
        orderBy: { position: 'asc' }
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

    res.json({
      message: `Token ${result.tokenNumber} is now assigned for service`,
      token: result
    });
  } catch (error) {
    console.error('Serve next token error:', error);
    res.status(500).json({ error: 'Failed to assign top token for service' });
  }
});

export default router;
