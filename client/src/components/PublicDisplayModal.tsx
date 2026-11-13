import React, { useEffect, useState } from 'react';
import { QueueDetails, QueueSummary } from '../types';
import { Button } from './ui/Button';
import { Maximize2, Minimize2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicDisplayProps {
  queues: QueueSummary[];
  activeQueueId: string | null;
  queueDetails: QueueDetails | null;
  onSelectQueue: (id: string) => void;
  onClose: () => void;
}

export const PublicDisplayModal: React.FC<PublicDisplayProps> = ({
  queues,
  activeQueueId,
  queueDetails,
  onSelectQueue,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeQueue = queues.find((q) => q.id === activeQueueId) || queues[0];
  const inServiceToken = queueDetails?.inServiceTokens[0];
  const waitingTokens = queueDetails?.waitingTokens || [];

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden transition-colors">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-[var(--radius)] bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm shadow-xs">
            Q
          </div>
          <div>
            <h2 className="text-base font-serif font-bold tracking-tight text-foreground">{activeQueue?.name || 'Queue Display'}</h2>
            <p className="text-xs text-muted-foreground">Public Counter Monitor</p>
          </div>
        </div>

        {/* Queue Switcher */}
        <div className="flex items-center gap-2">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelectQueue(q.id)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-semibold transition-colors cursor-pointer ${
                q.id === activeQueue?.id ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-sm text-foreground bg-secondary px-3 py-1 rounded-[var(--radius)] border border-border">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{currentTime}</span>
          </div>

          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Exit Monitor
          </Button>
        </div>
      </div>

      {/* Main Grid: NOW SERVING (Dominant) vs NEXT IN LINE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-6 gap-6 overflow-hidden bg-background">
        {/* Left 2 Cols: Massive Now Serving Ticket */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-card rounded-[var(--radius)] border border-border p-8 text-center relative shadow-sm">
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Now Serving Counter 1
          </span>

          <AnimatePresence mode="wait">
            {!queueDetails ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-24 sm:h-32 w-64 bg-muted rounded-2xl mx-auto" />
                <div className="h-6 w-48 bg-muted rounded mx-auto" />
              </div>
            ) : inServiceToken ? (
              <motion.div
                key={inServiceToken.id}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="space-y-4"
              >
                <div className="text-8xl sm:text-9xl font-mono font-extrabold tracking-tighter text-foreground drop-shadow-sm">
                  {inServiceToken.tokenNumber}
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-semibold text-muted-foreground">
                  {inServiceToken.customerName}
                </div>
                {inServiceToken.priority === 'VIP' && (
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs">
                    VIP Customer
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl font-mono font-bold text-muted-foreground">---</div>
                <p className="text-muted-foreground text-sm font-sans">Station is currently idle</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Col: Up Next Ticket Strip */}
        <div className="bg-card rounded-[var(--radius)] border border-border p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Up Next in Line
            </span>
            <span className="text-xs font-mono text-primary font-bold">{waitingTokens.length} waiting</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {!queueDetails ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-[var(--radius)] animate-pulse" />
              ))
            ) : waitingTokens.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">No customers waiting</div>
            ) : (
              waitingTokens.slice(0, 6).map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-[var(--radius)] border ${
                    idx === 0
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-secondary/40 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">#{t.position}</span>
                    <span className="font-mono font-bold text-lg text-foreground">{t.tokenNumber}</span>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[120px]">{t.customerName}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
