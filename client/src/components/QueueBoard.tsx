import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueueDetails, QueueSummary, Token } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { QueueBoardSkeleton } from './ui/Skeleton';
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

  if (loading && (queues.length === 0 || !queueDetails)) {
    return <QueueBoardSkeleton />;
  }

  if (queues.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 sm:py-20 px-4 text-center">
        <div className="w-12 h-12 bg-secondary border border-border text-foreground rounded-[var(--radius)] flex items-center justify-center mx-auto mb-4 font-mono font-bold shadow-xs">
          0
        </div>
        <h2 className="text-base font-serif font-bold text-foreground mb-1">No queues configured</h2>
        <p className="text-xs text-muted-foreground mb-5">Create a queue line to start issuing tickets and managing customer order.</p>
        <Button variant="primary" size="md" onClick={onOpenCreateQueue}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Queue Line
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 sm:space-y-5">
      {/* Queue Tabs Bar - Horizontally Scrollable on Mobile & Tablet */}
      <div className="flex items-center justify-between border-b border-border pb-2.5 sm:pb-3 gap-2 sm:gap-4 overflow-x-auto">
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
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'bg-card text-foreground border border-border hover:bg-muted'
                }`}
              >
                <span className="truncate max-w-[120px] sm:max-w-none">{q.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground font-bold' : 'bg-secondary text-muted-foreground'
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
            className="h-7.5 px-2 text-xs border-dashed text-muted-foreground hover:text-foreground shrink-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewHistory(!viewHistory)}
            className="text-xs text-muted-foreground h-7.5 px-2 sm:px-2.5 hover:text-foreground shrink-0"
          >
            {viewHistory ? 'Hide history' : 'History'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Delete queue "${activeQueue?.name}" and all records?`)) {
                onDeleteQueue(activeQueue.id);
              }
            }}
            className="text-muted-foreground hover:text-destructive h-7.5 px-2 text-xs shrink-0"
            title="Delete this queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Control Station (Dispatch Banner) */}
      <div className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-3.5 sm:p-5 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shrink-0">
                {activeQueue?.prefix}
              </span>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-foreground tracking-tight truncate">{activeQueue?.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-1">
              <span>{waitingTokens.length} waiting</span>
              <span>•</span>
              <span>{inServiceTokens.length} at counter</span>
              <span>•</span>
              <span>{queueDetails?.counts.completed || 0} served</span>
            </div>
          </div>

          {/* Action Row - Mobile friendly full width tap targets */}
          <div className="flex items-center gap-2 w-full md:w-auto pt-1 md:pt-0">
            <Button
              variant="outline"
              size="md"
              onClick={onOpenAddToken}
              className="h-9 sm:h-9.5 text-xs flex-1 md:flex-none justify-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              Add person
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={waitingTokens.length === 0}
              loading={actionLoading === 'serve-next'}
              onClick={handleServe}
              className="h-9 sm:h-9.5 text-xs px-3 sm:px-4 font-semibold shadow-sm flex-1 md:flex-none justify-center"
            >
              {topToken ? (
                <>
                  <CornerDownRight className="w-3.5 h-3.5 mr-1 shrink-0" />
                  <span>Call {topToken.tokenNumber}</span>
                  <span className="opacity-80 font-normal ml-1 hidden lg:inline truncate max-w-[100px]">
                    ({topToken.customerName})
                  </span>
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
        <div className="bg-card text-card-foreground rounded-[var(--radius)] p-3.5 sm:p-4 shadow-sm border-2 border-primary/40">
          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-bold text-foreground tracking-wide uppercase text-[11px]">
                Active at Counter ({inServiceTokens.length})
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">Station 1</span>
          </div>

          <div className="space-y-2.5">
            {inServiceTokens.map((token) => (
              <div
                key={token.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/60 p-3 sm:p-3.5 rounded-[var(--radius)] border border-border"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-9 px-3 bg-primary text-primary-foreground rounded-[var(--radius)] font-mono font-bold text-sm flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
                    {token.tokenNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{token.customerName}</span>
                      {token.priority === 'VIP' && (
                        <Badge variant="vip">VIP</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                      {token.customerPhone && <span>{token.customerPhone}</span>}
                      <span className="flex items-center gap-1 font-mono text-foreground font-medium">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatDuration(token.servedAt, null)}
                      </span>
                    </div>
                    {token.notes && <p className="text-xs text-muted-foreground mt-1 break-words">{token.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading === `complete-${token.id}`}
                    onClick={() => handleAction(`complete-${token.id}`, () => onCompleteService(token.id))}
                    className="h-8 text-xs w-full sm:w-auto justify-center shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
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
        <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-serif font-bold">Waiting Line</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {waitingTokens.length} in queue
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {waitingTokens.length === 0 ? (
            <div className="py-10 sm:py-14 text-center px-4">
              <p className="text-xs text-muted-foreground font-medium">No customers currently waiting in this line.</p>
              <Button variant="outline" size="sm" onClick={onOpenAddToken} className="mt-3 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add customer
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
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
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 transition-colors ${
                        isTop ? 'bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Ticket Info */}
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
                        <span
                          className={`font-mono text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-[var(--radius)] shrink-0 ${
                            isTop
                              ? 'bg-primary/15 text-primary border border-primary/30 font-bold'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          #{token.position}
                        </span>

                        <div className="font-mono font-bold text-xs sm:text-sm bg-foreground text-background px-2 sm:px-2.5 py-1 rounded-[var(--radius)] tracking-tight shrink-0">
                          {token.tokenNumber}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground truncate max-w-[140px] sm:max-w-[200px]">{token.customerName}</span>
                            {isTop && (
                              <span className="text-[10px] text-primary bg-primary/15 px-1.5 py-0.2 rounded font-semibold border border-primary/25 shrink-0">
                                Next
                              </span>
                            )}
                            {token.priority === 'VIP' && <Badge variant="vip" className="shrink-0">VIP</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                            {token.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-muted-foreground" />
                                {token.customerPhone}
                              </span>
                            )}
                            <span className="font-mono">{formatWaitTime(token.createdAt)}</span>
                            {token.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[130px] sm:max-w-[220px]">{token.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls (Move Up, Move Down, Cancel) - mobile generous tap targets */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isTop}
                          loading={actionLoading === `up-${token.id}`}
                          onClick={() => handleAction(`up-${token.id}`, () => onMoveUp(token.id))}
                          title="Move up in line"
                          className="h-8 px-2.5 text-xs flex-1 sm:flex-none justify-center"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="sm:hidden text-[10px] ml-1">Up</span>
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBottom}
                          loading={actionLoading === `down-${token.id}`}
                          onClick={() => handleAction(`down-${token.id}`, () => onMoveDown(token.id))}
                          title="Move down in line"
                          className="h-8 px-2.5 text-xs flex-1 sm:flex-none justify-center"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span className="sm:hidden text-[10px] ml-1">Down</span>
                        </Button>

                        <button
                          onClick={() => onOpenCancel(token)}
                          title="Cancel token"
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer shrink-0"
                          aria-label="Cancel token"
                        >
                          <X className="w-4 h-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
          <Card>
            <CardHeader className="py-2.5 px-3.5 sm:px-4 border-b border-border">
              <CardTitle className="text-xs font-semibold text-foreground">
                Completed ({recentCompleted.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentCompleted.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground text-center">No completions recorded</div>
              ) : (
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {recentCompleted.map((t) => (
                    <div key={t.id} className="p-2.5 px-3.5 sm:px-4 flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <span className="font-mono font-semibold text-foreground">{t.tokenNumber}</span>
                        <span className="text-muted-foreground ml-2">{t.customerName}</span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                        {formatDuration(t.servedAt, t.completedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2.5 px-3.5 sm:px-4 border-b border-border">
              <CardTitle className="text-xs font-semibold text-foreground">
                Cancelled ({recentCancelled.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentCancelled.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground text-center">No cancellations recorded</div>
              ) : (
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {recentCancelled.map((t) => (
                    <div key={t.id} className="p-2.5 px-3.5 sm:px-4 flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <span className="font-mono font-semibold text-foreground">{t.tokenNumber}</span>
                        <span className="text-muted-foreground ml-2">{t.customerName}</span>
                      </div>
                      <span className="text-[11px] text-destructive truncate max-w-[120px] shrink-0">
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
