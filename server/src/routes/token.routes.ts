import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { tokenCreationLimiter } from '../middleware/rateLimiter';
import { sanitizedString, optionalSanitizedString } from '../utils/sanitize';

const router = Router();

function getCleanParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0]?.trim() || '';
  return typeof param === 'string' ? param.trim() : '';
}

const createTokenSchema = z.object({
  customerName: sanitizedString(1, 100),
  customerPhone: z
    .string()
    .trim()
    .max(25, 'Phone number must be at most 25 characters')
    .regex(/^[+0-9\s\-()]*$/, 'Phone number contains invalid characters')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  notes: optionalSanitizedString(500),
  priority: z.enum(['NORMAL', 'VIP']).default('NORMAL')
});

const cancelTokenSchema = z.object({
  reason: optionalSanitizedString(300)
});

// Helper to normalize waiting token positions for a queue
async function normalizeWaitingPositions(tx: any, queueId: string) {
  const waitingTokens = await tx.token.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: { position: 'asc' }
  });

  for (let i = 0; i < waitingTokens.length; i++) {
    const targetPos = i + 1;
    if (waitingTokens[i].position !== targetPos) {
      await tx.token.update({
        where: { id: waitingTokens[i].id },
        data: { position: targetPos }
      });
    }
  }
}

// Requirement 3: Add new person / token into the queue
router.post('/queues/:queueId/tokens', requireAuth, tokenCreationLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queueId = getCleanParam(req.params.queueId);
    if (!queueId) {
      res.status(400).json({ error: 'Queue ID is required' });
      return;
    }
    const validated = createTokenSchema.parse(req.body);

    // Verify queue exists and belongs to manager
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id }
    });

    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const createdToken = await prisma.$transaction(async (tx) => {
      // 1. Increment queue counter
      const updatedQueue = await tx.queue.update({
        where: { id: queueId },
        data: { currentNumber: { increment: 1 } }
      });

      const nextNum = updatedQueue.currentNumber;
      const formattedSeq = String(nextNum).padStart(3, '0');
      const tokenNumber = `${queue.prefix}-${formattedSeq}`;

      // 2. Count existing waiting tokens to assign next position
      const waitingCount = await tx.token.count({
        where: { queueId, status: 'WAITING' }
      });

      const newPosition = waitingCount + 1;

      // 3. Create the token
      return await tx.token.create({
        data: {
          tokenNumber,
          sequence: nextNum,
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          notes: validated.notes,
          priority: validated.priority,
          status: 'WAITING',
          position: newPosition,
          queueId
        }
      });
    });

    res.status(201).json({
      message: `Token ${createdToken.tokenNumber} created successfully`,
      token: createdToken
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Invalid input data' });
      return;
    }
    console.error('Create token error:', error);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

// Requirement 5: Move token UP in the queue
router.post('/tokens/:id/move-up', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokenId = getCleanParam(req.params.id);
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    // Find token with queue verification
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: true }
    });

    if (!token || token.queue.managerId !== req.user!.id) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    if (token.status !== 'WAITING') {
      res.status(400).json({ error: 'Only tokens with WAITING status can be moved' });
      return;
    }

    if (token.position <= 1) {
      res.status(400).json({ error: 'Token is already at the top of the queue' });
      return;
    }

    const currentPos = token.position;
    const targetPos = currentPos - 1;

    // Find token currently occupying targetPos
    const adjacentToken = await prisma.token.findFirst({
      where: {
        queueId: token.queueId,
        status: 'WAITING',
        position: targetPos
      }
    });

    if (!adjacentToken) {
      // Normalize if positions got out of sync, then update
      await prisma.$transaction(async (tx) => {
        await tx.token.update({
          where: { id: token.id },
          data: { position: targetPos }
        });
        await normalizeWaitingPositions(tx, token.queueId);
      });
    } else {
      // Swap positions safely using temporary negative position
      await prisma.$transaction(async (tx) => {
        await tx.token.update({
          where: { id: token.id },
          data: { position: -1 }
        });
        await tx.token.update({
          where: { id: adjacentToken.id },
          data: { position: currentPos }
        });
        await tx.token.update({
          where: { id: token.id },
          data: { position: targetPos }
        });
      });
    }

    const updatedQueueTokens = await prisma.token.findMany({
      where: { queueId: token.queueId, status: 'WAITING' },
      orderBy: { position: 'asc' }
    });

    res.json({
      message: `Token ${token.tokenNumber} moved up to position ${targetPos}`,
      tokens: updatedQueueTokens
    });
  } catch (error) {
    console.error('Move up error:', error);
    res.status(500).json({ error: 'Failed to move token up' });
  }
});

// Requirement 5: Move token DOWN in the queue
router.post('/tokens/:id/move-down', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokenId = getCleanParam(req.params.id);
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: true }
    });

    if (!token || token.queue.managerId !== req.user!.id) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    if (token.status !== 'WAITING') {
      res.status(400).json({ error: 'Only tokens with WAITING status can be moved' });
      return;
    }

    const totalWaiting = await prisma.token.count({
      where: { queueId: token.queueId, status: 'WAITING' }
    });

    if (token.position >= totalWaiting) {
      res.status(400).json({ error: 'Token is already at the bottom of the queue' });
      return;
    }

    const currentPos = token.position;
    const targetPos = currentPos + 1;

    const adjacentToken = await prisma.token.findFirst({
      where: {
        queueId: token.queueId,
        status: 'WAITING',
        position: targetPos
      }
    });

    if (!adjacentToken) {
      await prisma.$transaction(async (tx) => {
        await tx.token.update({
          where: { id: token.id },
          data: { position: targetPos }
        });
        await normalizeWaitingPositions(tx, token.queueId);
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.token.update({
          where: { id: token.id },
          data: { position: -1 }
        });
        await tx.token.update({
          where: { id: adjacentToken.id },
          data: { position: currentPos }
        });
        await tx.token.update({
          where: { id: token.id },
          data: { position: targetPos }
        });
      });
    }

    const updatedQueueTokens = await prisma.token.findMany({
      where: { queueId: token.queueId, status: 'WAITING' },
      orderBy: { position: 'asc' }
    });

    res.json({
      message: `Token ${token.tokenNumber} moved down to position ${targetPos}`,
      tokens: updatedQueueTokens
    });
  } catch (error) {
    console.error('Move down error:', error);
    res.status(500).json({ error: 'Failed to move token down' });
  }
});

// Requirement 7: Cancel a token from the queue
router.post('/tokens/:id/cancel', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokenId = getCleanParam(req.params.id);
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }
    const validated = cancelTokenSchema.parse(req.body);

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: true }
    });

    if (!token || token.queue.managerId !== req.user!.id) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    if (token.status === 'COMPLETED' || token.status === 'CANCELLED') {
      res.status(400).json({ error: `Cannot cancel a token that is already ${token.status}` });
      return;
    }

    const cancelledToken = await prisma.$transaction(async (tx) => {
      const updated = await tx.token.update({
        where: { id: tokenId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          position: 0,
          cancellationReason: validated.reason || 'Cancelled by manager'
        }
      });

      // Normalize positions for remaining waiting tokens
      await normalizeWaitingPositions(tx, token.queueId);

      return updated;
    });

    res.json({
      message: `Token ${cancelledToken.tokenNumber} has been cancelled`,
      token: cancelledToken
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Invalid input data' });
      return;
    }
    console.error('Cancel token error:', error);
    res.status(500).json({ error: 'Failed to cancel token' });
  }
});

// Complete a token currently in service
router.post('/tokens/:id/complete', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokenId = getCleanParam(req.params.id);
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: true }
    });

    if (!token || token.queue.managerId !== req.user!.id) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    if (token.status !== 'IN_SERVICE') {
      res.status(400).json({ error: 'Only tokens currently in service can be marked completed' });
      return;
    }

    const completed = await prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        position: 0
      }
    });

    res.json({
      message: `Token ${completed.tokenNumber} marked as completed`,
      token: completed
    });
  } catch (error) {
    console.error('Complete token error:', error);
    res.status(500).json({ error: 'Failed to complete token service' });
  }
});

export default router;
