import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueueDetails, QueueSummary, Token } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import {
  ChevronUp,
  ChevronDown,
  X,
  Phone,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  CornerDownRight
} from 'lucide-react';
import { sound } from '../utils/sound';

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
  const [viewHistory, setViewHistory] = useState(false);

  const waitingTokens = queueDetails?.waitingTokens || [];
  const inServiceTokens = queueDetails?.inServiceTokens || [];
  const recentCompleted = queueDetails?.recentCompleted || [];
  const recentCancelled = queueDetails?.recentCancelled || [];

  const topToken = waitingTokens[0];
  const activeQueue = queues.find((q) => q.id === activeQueueId) || queues[0];

  const handleAction = async (actionKey: string, fn: () => Promise<any>) => {
    sound.playTick();
    setActionLoading(actionKey);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const handleServe = async () => {
    if (!activeQueue || !topToken) return;
    sound.playCallChime();
    setActionLoading('serve-next');
    try {
      await onServeNext(activeQueue.id);
    } finally {
      setActionLoading(null);
    }
  };

  const formatWaitTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just added';
    if (diffMins === 1) return '1m in line';
    if (diffMins < 60) return `${diffMins}m in line`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m in line`;
  };

  const formatDuration = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start) return '-';
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - new Date(start).getTime();
    const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    return `${mins}m`;
  };

  if (queues.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 font-mono font-bold">
          0
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">No queues configured</h2>
        <p className="text-xs text-slate-500 mb-5">Create a queue line to start issuing tickets and managing customer order.</p>
        <Button variant="primary" size="md" onClick={onOpenCreateQueue}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Queue Line
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Queue Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/90 pb-3 gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          {queues.map((q) => {
            const isSelected = q.id === activeQueue?.id;
            return (
              <button
                key={q.id}
                onClick={() => {
                  sound.playTick();
                  onSelectQueue(q.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{q.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-600'
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
            className="h-7.5 px-2 text-xs border-dashed text-slate-500 hover:text-slate-900"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewHistory(!viewHistory)}
            className="text-xs text-slate-600 h-7.5 px-2.5"
          >
            {viewHistory ? 'Hide history' : 'Recent activity'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Delete queue "${activeQueue?.name}" and all records?`)) {
                onDeleteQueue(activeQueue.id);
              }
            }}
            className="text-slate-400 hover:text-rose-600 h-7.5 px-2 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Control Station (Dispatch Banner) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                {activeQueue?.prefix}
              </span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{activeQueue?.name}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>{waitingTokens.length} waiting</span>
              <span>•</span>
              <span>{inServiceTokens.length} at counter</span>
              <span>•</span>
              <span>{queueDetails?.counts.completed || 0} served today</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="md" onClick={onOpenAddToken} className="h-9.5 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Add person
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={waitingTokens.length === 0}
              loading={actionLoading === 'serve-next'}
              onClick={handleServe}
              className="h-9.5 text-xs px-4 font-semibold bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
            >
              {topToken ? (
                <>
                  <CornerDownRight className="w-3.5 h-3.5 mr-1" />
                  <span>Call {topToken.tokenNumber}</span>
                  <span className="opacity-75 font-normal ml-1 hidden sm:inline">({topToken.customerName})</span>
                </>
              ) : (
                <span>Line is clear</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Service Counter */}
      {inServiceTokens.length > 0 && (
        <div className="bg-slate-950 text-white rounded-xl p-4 shadow-sm border border-slate-900">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px]">
                Active at Counter ({inServiceTokens.length})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Station 1</span>
          </div>

          <div className="space-y-2.5">
            {inServiceTokens.map((token) => (
              <div
                key={token.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-lg border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 px-2.5 bg-slate-800 rounded text-emerald-400 font-mono font-bold text-sm flex items-center justify-center border border-slate-700">
                    {token.tokenNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">{token.customerName}</span>
                      {token.priority === 'VIP' && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold border border-amber-500/30">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      {token.customerPhone && <span>{token.customerPhone}</span>}
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDuration(token.servedAt, null)}
                      </span>
                    </div>
                    {token.notes && <p className="text-xs text-slate-400 mt-1">{token.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionLoading === `complete-${token.id}`}
                    onClick={() => handleAction(`complete-${token.id}`, () => onCompleteService(token.id))}
                    className="h-8 text-xs bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 w-full sm:w-auto"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Complete Service
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Waiting Queue Line with Framer Motion Spring Layout */}
      <Card>
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Waiting Line</CardTitle>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {waitingTokens.length} customer{waitingTokens.length !== 1 ? 's' : ''} in queue
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {waitingTokens.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs text-slate-500 font-medium">No customers currently waiting in this line.</p>
              <Button variant="outline" size="sm" onClick={onOpenAddToken} className="mt-3 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add customer
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {waitingTokens.map((token, index) => {
                  const isTop = index === 0;
                  const isBottom = index === waitingTokens.length - 1;

                  return (
                    <motion.div
                      key={token.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 28, stiffness: 420 }}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 transition-colors ${
                        isTop ? 'bg-amber-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Ticket Info */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            isTop
                              ? 'bg-amber-200/70 text-amber-900 border border-amber-300/80 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{token.position}
                        </span>

                        <div className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-1 rounded tracking-tight">
                          {token.tokenNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{token.customerName}</span>
                            {isTop && (
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-1 rounded font-semibold">
                                Next
                              </span>
                            )}
                            {token.priority === 'VIP' && <Badge variant="vip">VIP</Badge>}
                          </div>
                          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-0.5">
                            {token.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                {token.customerPhone}
                              </span>
                            )}
                            <span className="text-slate-400">{formatWaitTime(token.createdAt)}</span>
                            {token.notes && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 truncate max-w-[200px]">{token.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls (Move Up, Move Down, Cancel) */}
                      <div className="flex items-center gap-1 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isTop}
                          loading={actionLoading === `up-${token.id}`}
                          onClick={() => handleAction(`up-${token.id}`, () => onMoveUp(token.id))}
                          title="Move up"
                          className="h-7.5 px-2 text-xs text-slate-700"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBottom}
                          loading={actionLoading === `down-${token.id}`}
                          onClick={() => handleAction(`down-${token.id}`, () => onMoveDown(token.id))}
                          title="Move down"
                          className="h-7.5 px-2 text-xs text-slate-700"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>

                        <button
                          onClick={() => onOpenCancel(token)}
                          title="Cancel token"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collapsible History Section */}
      {viewHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Card>
            <CardHeader className="py-2.5 px-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-700">
                Completed ({recentCompleted.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentCompleted.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">No completions recorded</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {recentCompleted.map((t) => (
                    <div key={t.id} className="p-2.5 px-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-semibold text-slate-900">{t.tokenNumber}</span>
                        <span className="text-slate-600 ml-2">{t.customerName}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatDuration(t.servedAt, t.completedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2.5 px-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-700">
                Cancelled ({recentCancelled.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentCancelled.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">No cancellations recorded</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {recentCancelled.map((t) => (
                    <div key={t.id} className="p-2.5 px-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-semibold text-slate-900">{t.tokenNumber}</span>
                        <span className="text-slate-600 ml-2">{t.customerName}</span>
                      </div>
                      <span className="text-[11px] text-rose-600 truncate max-w-[130px]">
                        {t.cancellationReason || 'Cancelled'}
                      </span>
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
