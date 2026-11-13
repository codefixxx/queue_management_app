import React, { useState } from 'react';
import { AnalyticsData, QueueSummary } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import {
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  Activity,
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

  if (!analytics && loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Computing queue analytics & trend models...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        No analytics data available.
      </div>
    );
  }

  const { summary, hourlyTrends, statusDistribution, waitTimeBuckets, queueComparison } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Queue Intelligence & Analytics</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of customer wait times, queue arrival patterns, and service speed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Queue Scope:</label>
          <select
            value={selectedQueueFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Avg Wait Time */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Average Wait Time
              </CardDescription>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.avgWaitTimeMinutes} <span className="text-sm font-medium text-slate-500">mins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">From token creation until service assignment</p>
          </CardContent>
        </Card>

        {/* Metric 2: Avg Service Duration */}
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Average Service Time
              </CardDescription>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.avgServiceTimeMinutes} <span className="text-sm font-medium text-slate-500">mins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">Duration customer spends at service counter</p>
          </CardContent>
        </Card>

        {/* Metric 3: Active Waiting */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Waiting In Line
              </CardDescription>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.waitingCount}{' '}
              <span className="text-sm font-medium text-slate-500">people</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">
              {summary.inServiceCount} currently being served at counters
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Total Completed & Rate */}
        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Service Completion Rate
              </CardDescription>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.completionRate}%{' '}
              <span className="text-sm font-medium text-slate-500">
                ({summary.completedCount} served)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">
              {summary.cancelledCount} tokens dropped / cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Queue Length Trends (Arrivals vs Served) & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Length Trends Hourly Flow */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Queue Flow & Arrival Trends by Hour
                </CardTitle>
                <CardDescription>
                  Customer check-ins (arrivals) vs. customers served across operational hours
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="arrivals"
                    name="Customer Arrivals"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorArrivals)"
                  />
                  <Area
                    type="monotone"
                    dataKey="served"
                    name="Customers Served"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorServed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Token Status Breakdown</CardTitle>
            <CardDescription>Overall state of all generated tokens</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}:</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Wait Time Distribution Histogram & Queue Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wait Time Buckets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Customer Wait Time Distribution</CardTitle>
            <CardDescription>Histogram of waiting intervals before receiving service</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waitTimeBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" name="Customers" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Queue Comparison Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Queue Performance Comparison
            </CardTitle>
            <CardDescription>Comparative metrics across each configured counter</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Queue Name</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Waiting</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Serving</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Served</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Avg Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueComparison.map((qc) => (
                    <tr key={qc.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            {qc.prefix}
                          </span>
                          <span>{qc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-amber-600">{qc.waiting}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-blue-600">{qc.inService}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-emerald-600">{qc.completed}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {qc.avgWaitMinutes} min
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

