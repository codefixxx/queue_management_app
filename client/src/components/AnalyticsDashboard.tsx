import React, { useState } from 'react';
import { AnalyticsData, QueueSummary } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-mono">Aggregating wait-time telemetry...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500 font-mono">
        No metrics available.
      </div>
    );
  }

  const { summary, hourlyTrends, statusDistribution, waitTimeBuckets, queueComparison } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Scope Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Queue Performance Metrics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational wait times, hourly check-in volume, and service throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Filter:</label>
          <select
            value={selectedQueueFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-900"
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

      {/* KPI Cards (Un-slopped: clean borders, crisp numbers, calm text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Avg Wait Time</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1">
              {summary.avgWaitTimeMinutes} <span className="text-xs font-normal text-slate-500">mins</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-slate-400">Creation to service counter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Avg Service Time</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1">
              {summary.avgServiceTimeMinutes} <span className="text-xs font-normal text-slate-500">mins</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-slate-400">Active time at station</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active in Line</span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1">
              {summary.waitingCount} <span className="text-xs font-normal text-slate-500">tickets</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-slate-400">{summary.inServiceCount} currently being served</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Completion Rate</span>
              <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1">
              {summary.completionRate}%
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-[11px] text-slate-400">{summary.completedCount} tickets closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Hourly Trends & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              Hourly Customer Flow (Arrivals vs Served)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrends} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      border: 'none'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="arrivals"
                    name="Arrivals"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="served"
                    name="Served"
                    stroke="#059669"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold text-slate-800">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500">{item.name}:</span>
                  <span className="font-mono font-semibold text-slate-800">{item.value}</span>
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
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold text-slate-800">
              Customer Wait Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waitTimeBuckets} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="count" name="Customers" fill="#475569" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Queue Comparison Table */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Line-by-Line Throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3 font-medium">Queue</th>
                    <th className="py-2 px-2 text-center font-medium">Waiting</th>
                    <th className="py-2 px-2 text-center font-medium">Serving</th>
                    <th className="py-2 px-2 text-center font-medium">Served</th>
                    <th className="py-2 px-3 text-right font-medium">Avg Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueComparison.map((qc) => (
                    <tr key={qc.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded mr-1.5 font-bold">
                          {qc.prefix}
                        </span>
                        {qc.name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-700">
                        {qc.waiting}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-blue-700">
                        {qc.inService}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-emerald-700">
                        {qc.completed}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
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
