export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface QueueCounts {
  waiting: number;
  inService: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface QueueSummary {
  id: string;
  name: string;
  description?: string;
  prefix: string;
  currentNumber: number;
  createdAt: string;
  updatedAt: string;
  counts: QueueCounts;
}

export interface Token {
  id: string;
  tokenNumber: string;
  sequence: number;
  customerName: string;
  customerPhone?: string | null;
  notes?: string | null;
  priority: 'NORMAL' | 'VIP';
  status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';
  position: number;
  cancellationReason?: string | null;
  servedBy?: string | null;
  createdAt: string;
  servedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  queueId: string;
}

export interface QueuePagination {
  page: number;
  limit: number;
  completedTotal: number;
  cancelledTotal: number;
}

export interface QueueDetails {
  id: string;
  name: string;
  description?: string;
  prefix: string;
  currentNumber: number;
  createdAt: string;
  updatedAt: string;
  waitingTokens: Token[];
  inServiceTokens: Token[];
  recentCompleted: Token[];
  recentCancelled: Token[];
  pagination?: QueuePagination;
  counts: QueueCounts;
}

export interface HourlyTrend {
  hour: string;
  arrivals: number;
  served: number;
  avgWaitTime: number;
}

export interface QueueComparisonMetric {
  id: string;
  name: string;
  prefix: string;
  waiting: number;
  inService: number;
  completed: number;
  cancelled: number;
  avgWaitMinutes: number;
}

export interface AnalyticsData {
  summary: {
    totalQueues: number;
    totalTokens: number;
    waitingCount: number;
    inServiceCount: number;
    completedCount: number;
    cancelledCount: number;
    avgWaitTimeMinutes: number;
    avgServiceTimeMinutes: number;
    completionRate: number;
  };
  queueComparison: QueueComparisonMetric[];
  hourlyTrends: HourlyTrend[];
  statusDistribution: { name: string; value: number; color: string }[];
  waitTimeBuckets: { range: string; count: number }[];
}

