import React, { useState } from 'react';
import { QueueDetails, QueueSummary, Token } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import {
  ChevronUp,
  ChevronDown,
  XCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';

interface QueueBoardProps {
  queues: QueueSummary[];
  activeQueueId: string | null;
  onSelectQueue: (id: string) => void;
  queueDetails: QueueDetails | null;
  loading: boolean;
  onServeNext: (queueId: string) => Promise<void>;
  onMoveUp: (tokenId: string) => Promise<void>;
  onMoveDown: (tokenId: string) => Promise<void>;
  onOpenCancel: (token: Token) => void;
  onCompleteService: (tokenId: string) => Promise<void>;
  onOpenAddToken: () => void;
  onOpenCreateQueue: () => void;
  onDeleteQueue: (queueId: string) => Promise<void>;
}

export const QueueBoard: React.FC<QueueBoardProps> = ({
  queues,
  activeQueueId,
  onSelectQueue,
  queueDetails,
  loading,
  onServeNext,
  onMoveUp,
  onMoveDown,
  onOpenCancel,
  onCompleteService,
  onOpenAddToken,
  onOpenCreateQueue,
  onDeleteQueue
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'waiting' | 'inService' | 'history'>('waiting');

  const waitingTokens = queueDetails?.waitingTokens || [];
  const inServiceTokens = queueDetails?.inServiceTokens || [];
  const recentCompleted = queueDetails?.recentCompleted || [];
  const recentCancelled = queueDetails?.recentCancelled || [];

  const topToken = waitingTokens[0];

  const handleAction = async (actionKey: string, fn: () => Promise<any>) => {
    setActionLoading(actionKey);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const formatWaitTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  const formatDuration = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start) return '-';
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - new Date(start).getTime();
    const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  if (queues.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Queues Created Yet</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Create your first queue counter to start issuing tokens, assigning service, and tracking wait times.
        </p>
        <Button variant="primary" size="lg" onClick={onOpenCreateQueue}>
          <Plus className="w-5 h-5 mr-2" />
          Create Your First Queue
        </Button>
      </div>
    );
  }

  const activeQueue = queues.find((q) => q.id === activeQueueId) || queues[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Queue Selection Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {queues.map((q) => {
            const isSelected = q.id === activeQueue?.id;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQueue(q.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{q.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {q.counts.waiting}
                </span>
              </button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCreateQueue}
            className="rounded-xl border-dashed h-10 px-3 text-slate-600 hover:text-blue-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Queue
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Are you sure you want to delete queue "${activeQueue?.name}"?`)) {
                onDeleteQueue(activeQueue.id);
              }
            }}
            className="text-slate-400 hover:text-rose-600 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete Queue
          </Button>
        </div>
      </div>

      {/* Main Queue Actions Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg text-xs font-mono font-bold tracking-wider">
                Prefix: {activeQueue?.prefix}
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">{activeQueue?.name}</h2>
            </div>
            {activeQueue?.description && (
              <p className="text-xs text-slate-300 mt-1.5 max-w-xl">{activeQueue.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-amber-400 font-bold text-sm">{waitingTokens.length}</span>
                <span className="text-slate-400">Waiting in line</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-blue-400 font-bold text-sm">{inServiceTokens.length}</span>
                <span className="text-slate-400">Being served</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-emerald-400 font-bold text-sm">{queueDetails?.counts.completed || 0}</span>
                <span className="text-slate-400">Served today</span>
              </div>
            </div>
          </div>

          {/* Requirement 6: Assign token at top of queue for service with a simple button click */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onOpenAddToken}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Person
            </Button>

            <Button
              variant="success"
              size="lg"
              disabled={waitingTokens.length === 0}
              loading={actionLoading === 'serve-next'}
              onClick={() => handleAction('serve-next', () => onServeNext(activeQueue.id))}
              className="px-6 py-3.5 shadow-lg shadow-emerald-900/30 font-bold text-base"
            >
              <BellRing className="w-5 h-5 mr-2 animate-bounce" />
              {topToken ? (
                <span>
                  Serve Next: <strong className="font-mono underline">{topToken.tokenNumber}</strong>
                </span>
              ) : (
                <span>Queue is Empty</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Currently In Service Counter Section */}
      {inServiceTokens.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-xs">
          <CardHeader className="pb-3 border-b border-blue-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>
              <CardTitle className="text-base text-blue-950 font-bold">
                Currently In Service Counter ({inServiceTokens.length})
              </CardTitle>
            </div>
            <span className="text-xs text-blue-700 font-medium">Assigned Booth / Counter</span>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {inServiceTokens.map((token) => (
              <div
                key={token.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-blue-200 shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 bg-blue-600 text-white rounded-xl flex items-center justify-center font-mono font-extrabold text-lg shadow-sm">
                    {token.tokenNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{token.customerName}</h4>
                      {token.priority === 'VIP' && <Badge variant="vip">VIP</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      {token.customerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {token.customerPhone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <Clock className="w-3 h-3" />
                        In service for: {formatDuration(token.servedAt, null)}
                      </span>
                    </div>
                    {token.notes && (
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                        {token.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="success"
                    size="md"
                    loading={actionLoading === `complete-${token.id}`}
                    onClick={() => handleAction(`complete-${token.id}`, () => onCompleteService(token.id))}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Complete Service
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs for Waiting Queue vs Service History */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('waiting')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
            subTab === 'waiting'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Waiting in Queue ({waitingTokens.length})
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
            subTab === 'history'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Recent Activity & History ({recentCompleted.length + recentCancelled.length})
        </button>
      </div>

      {/* Requirement 4: List of people / tokens waiting in the queue */}
      {subTab === 'waiting' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Waiting Line List</CardTitle>
              <CardDescription>
                Tokens currently in line. Move tokens up or down to adjust priority.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenAddToken}>
              <Plus className="w-4 h-4 mr-1" />
              Add Customer
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {waitingTokens.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-800">The Queue is Currently Empty</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  All waiting customers have been assigned or served. Click below to add a new token.
                </p>
                <Button variant="primary" size="sm" onClick={onOpenAddToken}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Customer to Queue
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waitingTokens.map((token, index) => {
                  const isTop = index === 0;
                  const isBottom = index === waitingTokens.length - 1;

                  return (
                    <div
                      key={token.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 transition-colors ${
                        isTop ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Left: Position Rank + Token Ticket + Customer Details */}
                      <div className="flex items-center gap-4">
                        {/* Position Badge */}
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isTop
                              ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title={`Position #${token.position}`}
                        >
                          #{token.position}
                        </div>

                        {/* Token Monospace Badge */}
                        <div className="font-mono font-bold text-base bg-slate-900 text-white px-3 py-1.5 rounded-lg tracking-wider shrink-0 shadow-xs">
                          {token.tokenNumber}
                        </div>

                        {/* Customer Information */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {token.customerName}
                            </span>
                            {isTop && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded">
                                Next Up
                              </span>
                            )}
                            {token.priority === 'VIP' && <Badge variant="vip">VIP</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                            {token.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {token.customerPhone}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              Waited: {formatWaitTime(token.createdAt)}
                            </span>
                          </div>
                          {token.notes && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>{token.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Requirement 5 (Move Up / Down) & Requirement 7 (Cancel) */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {/* Move Up Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isTop}
                          loading={actionLoading === `up-${token.id}`}
                          onClick={() => handleAction(`up-${token.id}`, () => onMoveUp(token.id))}
                          title={isTop ? 'Already at top' : 'Move up in queue'}
                          className="h-8.5 px-2.5 text-xs text-slate-700"
                        >
                          <ChevronUp className="w-4 h-4 mr-1 text-blue-600" />
                          Up
                        </Button>

                        {/* Move Down Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBottom}
                          loading={actionLoading === `down-${token.id}`}
                          onClick={() => handleAction(`down-${token.id}`, () => onMoveDown(token.id))}
                          title={isBottom ? 'Already at bottom' : 'Move down in queue'}
                          className="h-8.5 px-2.5 text-xs text-slate-700"
                        >
                          <ChevronDown className="w-4 h-4 mr-1 text-blue-600" />
                          Down
                        </Button>

                        {/* Cancel Token Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenCancel(token)}
                          title="Cancel token from queue"
                          className="h-8.5 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Subtab: Completed & Cancelled */}
      {subTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Completed */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Recently Completed ({recentCompleted.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentCompleted.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No completed tokens recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentCompleted.map((t) => (
                    <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{t.tokenNumber}</span>
                          <span className="font-medium text-slate-700">{t.customerName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Served by {t.servedBy || 'Manager'} • Duration: {formatDuration(t.servedAt, t.completedAt)}
                        </span>
                      </div>
                      <Badge variant="success">Served</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Cancelled */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-rose-950 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                Recently Cancelled ({recentCancelled.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentCancelled.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No cancelled tokens recorded.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentCancelled.map((t) => (
                    <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{t.tokenNumber}</span>
                          <span className="font-medium text-slate-700">{t.customerName}</span>
                        </div>
                        <span className="text-[11px] text-rose-600 block mt-0.5">
                          Reason: {t.cancellationReason || 'Cancelled by manager'}
                        </span>
                      </div>
                      <Badge variant="destructive">Cancelled</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
