import React, { useState } from 'react';
import { AnalyticsData, QueueSummary } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { AnalyticsSkeleton } from './ui/Skeleton';
import {
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData | null;
  queues: QueueSummary[];
  loading: boolean;
  onRefresh: (queueId?: string) => void;
}

// Map theme chart colors to hex / oklch compatible shades
const THEME_COLORS = {
  chart1: '#10b981', // emerald (oklch 0.7624 0.1544 159.3551)
  chart2: '#06b6d4', // cyan/teal (oklch 0.6959 0.1491 162.4796)
  chart3: '#3b82f6', // blue (oklch 0.6231 0.1880 259.8145)
  chart4: '#f59e0b', // amber (oklch 0.7686 0.1647 70.0804)
  chart5: '#8b5cf6'  // violet (oklch 0.5854 0.2041 277.1173)
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  queues,
  loading,
  onRefresh
}) => {
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<string>('all');

  const handleFilterChange = (val: string) => {
    setSelectedQueueFilter(val);
    onRefresh(val === 'all' ? undefined : val);
  };

  if (loading || !analytics) {
    return <AnalyticsSkeleton />;
  }

  const { summary, hourlyTrends, statusDistribution, waitTimeBuckets, queueComparison } = analytics;

  // Adapt status distribution colors to match theme palette
  const themedStatusDistribution = statusDistribution.map((item) => {
    let color = THEME_COLORS.chart1;
    if (item.name === 'Waiting') color = THEME_COLORS.chart4;
    else if (item.name === 'In Service') color = THEME_COLORS.chart3;
    else if (item.name === 'Completed') color = THEME_COLORS.chart1;
    else if (item.name === 'Cancelled') color = '#ef4444';
    return { ...item, color };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Scope Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">Queue Performance Metrics</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Operational wait times, hourly check-in volume, and service throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Filter:</label>
          <select
            value={selectedQueueFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-border rounded-[var(--radius)] bg-card text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Queues Combined</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-sans">
              <span>Avg Wait Time</span>
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
              {summary.avgWaitTimeMinutes} <span className="text-xs font-normal text-muted-foreground font-sans">mins</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-muted-foreground">Creation to service counter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-sans">
              <span>Avg Service Time</span>
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
              {summary.avgServiceTimeMinutes} <span className="text-xs font-normal text-muted-foreground font-sans">mins</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-muted-foreground">Active time at station</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-sans">
              <span>Active in Line</span>
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
              {summary.waitingCount} <span className="text-xs font-normal text-muted-foreground font-sans">tickets</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-muted-foreground">{summary.inServiceCount} currently being served</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-sans">
              <span>Completion Rate</span>
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
              {summary.completionRate}%
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-muted-foreground">{summary.completedCount} tickets closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Hourly Trends & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Hourly Customer Flow (Arrivals vs Served)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrends} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--foreground)',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="arrivals"
                    name="Arrivals"
                    stroke={THEME_COLORS.chart3}
                    fill={THEME_COLORS.chart3}
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="served"
                    name="Served"
                    stroke={THEME_COLORS.chart1}
                    fill={THEME_COLORS.chart1}
                    fillOpacity={0.25}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-serif font-bold text-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themedStatusDistribution}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {themedStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--foreground)',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
              {themedStatusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-mono font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Wait Time Distribution & Queue Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Wait Time Buckets */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-serif font-bold text-foreground">
              Customer Wait Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waitTimeBuckets} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--foreground)',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="count" name="Customers" fill={THEME_COLORS.chart1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Queue Comparison Table */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Line-by-Line Throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 px-3 font-medium">Queue</th>
                    <th className="py-2 px-2 text-center font-medium">Waiting</th>
                    <th className="py-2 px-2 text-center font-medium">Serving</th>
                    <th className="py-2 px-2 text-center font-medium">Served</th>
                    <th className="py-2 px-3 text-right font-medium">Avg Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queueComparison.map((qc) => (
                    <tr key={qc.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <span className="font-mono text-[10px] bg-secondary border border-border px-1 py-0.5 rounded mr-1.5 font-bold">
                          {qc.prefix}
                        </span>
                        {qc.name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {qc.waiting}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-primary">
                        {qc.inService}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {qc.completed}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                        {qc.avgWaitMinutes}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
