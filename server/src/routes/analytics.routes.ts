import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user!.id;
    const { queueId } = req.query;

    const queueFilter = queueId && typeof queueId === 'string'
      ? { id: queueId, managerId }
      : { managerId };

    // Fetch user queues
    const queues = await prisma.queue.findMany({
      where: queueFilter,
      include: {
        tokens: true
      }
    });

    const allTokens = queues.flatMap((q) => q.tokens);

    // KPI Metrics
    const totalQueues = queues.length;
    const totalTokens = allTokens.length;
    const waitingTokens = allTokens.filter((t) => t.status === 'WAITING');
    const inServiceTokens = allTokens.filter((t) => t.status === 'IN_SERVICE');
    const completedTokens = allTokens.filter((t) => t.status === 'COMPLETED');
    const cancelledTokens = allTokens.filter((t) => t.status === 'CANCELLED');

    // Calculate wait times (createdAt -> servedAt) in minutes
    const servedOrCompleted = allTokens.filter((t) => t.servedAt && t.createdAt);
    const waitTimesMinutes = servedOrCompleted.map((t) => {
      const waitMs = new Date(t.servedAt!).getTime() - new Date(t.createdAt).getTime();
      return Math.max(0, Math.round((waitMs / (1000 * 60)) * 10) / 10);
    });

    const avgWaitTimeMinutes = waitTimesMinutes.length > 0
      ? Math.round((waitTimesMinutes.reduce((a, b) => a + b, 0) / waitTimesMinutes.length) * 10) / 10
      : 0;

    // Calculate service duration (servedAt -> completedAt) in minutes
    const completedWithServiceTime = completedTokens.filter((t) => t.servedAt && t.completedAt);
    const serviceDurations = completedWithServiceTime.map((t) => {
      const durationMs = new Date(t.completedAt!).getTime() - new Date(t.servedAt!).getTime();
      return Math.max(0, Math.round((durationMs / (1000 * 60)) * 10) / 10);
    });

    const avgServiceTimeMinutes = serviceDurations.length > 0
      ? Math.round((serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) * 10) / 10
      : 0;

    // Completion rate
    const closedCount = completedTokens.length + cancelledTokens.length;
    const completionRate = closedCount > 0
      ? Math.round((completedTokens.length / closedCount) * 100)
      : 100;

    // Queue Comparison
    const queueComparison = queues.map((q) => {
      const qTokens = q.tokens;
      const qServed = qTokens.filter((t) => t.servedAt && t.createdAt);
      const qWaitTimes = qServed.map((t) =>
        Math.max(0, (new Date(t.servedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60))
      );
      const qAvgWait = qWaitTimes.length > 0
        ? Math.round((qWaitTimes.reduce((a, b) => a + b, 0) / qWaitTimes.length) * 10) / 10
        : 0;

      return {
        id: q.id,
        name: q.name,
        prefix: q.prefix,
        waiting: qTokens.filter((t) => t.status === 'WAITING').length,
        inService: qTokens.filter((t) => t.status === 'IN_SERVICE').length,
        completed: qTokens.filter((t) => t.status === 'COMPLETED').length,
        cancelled: qTokens.filter((t) => t.status === 'CANCELLED').length,
        avgWaitMinutes: qAvgWait
      };
    });

    // Hourly trends (aggregated across standard working hours 08:00 to 18:00)
    const hourlyMap: { [hour: string]: { arrivals: number; served: number; totalWaitTime: number; waitCount: number } } = {};
    for (let h = 8; h <= 18; h++) {
      const key = `${String(h).padStart(2, '0')}:00`;
      hourlyMap[key] = { arrivals: 0, served: 0, totalWaitTime: 0, waitCount: 0 };
    }

    allTokens.forEach((t) => {
      const arrivalHour = new Date(t.createdAt).getHours();
      const arrivalKey = `${String(arrivalHour).padStart(2, '0')}:00`;
      if (hourlyMap[arrivalKey]) {
        hourlyMap[arrivalKey].arrivals += 1;
      }

      if (t.servedAt) {
        const servedHour = new Date(t.servedAt).getHours();
        const servedKey = `${String(servedHour).padStart(2, '0')}:00`;
        if (hourlyMap[servedKey]) {
          hourlyMap[servedKey].served += 1;
          const waitMins = (new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60);
          hourlyMap[servedKey].totalWaitTime += Math.max(0, waitMins);
          hourlyMap[servedKey].waitCount += 1;
        }
      }
    });

    const hourlyTrends = Object.entries(hourlyMap).map(([hour, data]) => ({
      hour,
      arrivals: data.arrivals,
      served: data.served,
      avgWaitTime: data.waitCount > 0 ? Math.round((data.totalWaitTime / data.waitCount) * 10) / 10 : 0
    }));

    // Status breakdown for Pie/Donut Chart
    const statusDistribution = [
      { name: 'Waiting', value: waitingTokens.length, color: '#f59e0b' },
      { name: 'In Service', value: inServiceTokens.length, color: '#3b82f6' },
      { name: 'Completed', value: completedTokens.length, color: '#10b981' },
      { name: 'Cancelled', value: cancelledTokens.length, color: '#ef4444' }
    ];

    // Wait time bucket histogram
    const waitTimeBuckets = [
      { range: '< 5 min', count: 0 },
      { range: '5-15 min', count: 0 },
      { range: '15-30 min', count: 0 },
      { range: '30-60 min', count: 0 },
      { range: '> 60 min', count: 0 }
    ];

    waitTimesMinutes.forEach((mins) => {
      if (mins < 5) waitTimeBuckets[0].count++;
      else if (mins <= 15) waitTimeBuckets[1].count++;
      else if (mins <= 30) waitTimeBuckets[2].count++;
      else if (mins <= 60) waitTimeBuckets[3].count++;
      else waitTimeBuckets[4].count++;
    });

    res.json({
      summary: {
        totalQueues,
        totalTokens,
        waitingCount: waitingTokens.length,
        inServiceCount: inServiceTokens.length,
        completedCount: completedTokens.length,
        cancelledCount: cancelledTokens.length,
        avgWaitTimeMinutes,
        avgServiceTimeMinutes,
        completionRate
      },
      queueComparison,
      hourlyTrends,
      statusDistribution,
      waitTimeBuckets
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

export default router;

