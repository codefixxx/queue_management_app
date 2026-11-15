import React, { useEffect, useState } from 'react';
import { QueueDetails, QueueSummary } from '../types';
import { Button } from './ui/Button';
import { Maximize2, Minimize2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PublicDisplayProps {
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
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

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
  const isCurrent = queueDetails?.id === activeQueue?.id;
  const inServiceToken = isCurrent ? queueDetails?.inServiceTokens[0] : undefined;
  const waitingTokens = isCurrent ? (queueDetails?.waitingTokens || []) : [];

  // Live kiosk polling: update every 5 seconds while counter monitor is open
  useEffect(() => {
    if (!activeQueue?.id) return;
    const interval = setInterval(() => {
      onSelectQueue(activeQueue.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeQueue?.id, onSelectQueue]);

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden transition-colors">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-border bg-card/90 backdrop-blur-md shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-[var(--radius)] bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-xs shrink-0">
            Q
          </div>
          <div className="truncate">
            <h2 className="text-sm sm:text-base font-serif font-bold tracking-tight text-foreground truncate max-w-[130px] sm:max-w-none">
              {activeQueue?.name || 'Queue Display'}
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Public Counter Monitor</p>
          </div>
        </div>

        {/* Queue Switcher - Scrollable horizontally on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar max-w-[40vw] sm:max-w-none min-w-0">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelectQueue(q.id)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-[var(--radius)] text-xs font-semibold transition-colors cursor-pointer shrink-0 truncate max-w-[100px] sm:max-w-none ${
                q.id === activeQueue?.id ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs sm:text-sm text-foreground bg-secondary px-2.5 sm:px-3 py-1 rounded-[var(--radius)] border border-border">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{currentTime}</span>
          </div>

          <Button variant="outline" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose} className="h-8 px-2.5 text-xs">
            Exit
          </Button>
        </div>
      </div>

      {/* Main Grid: NOW SERVING (Dominant) vs NEXT IN LINE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-3 sm:p-6 gap-3 sm:gap-6 overflow-y-auto lg:overflow-hidden bg-background">
        {/* Left 2 Cols: Massive Now Serving Ticket */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-card rounded-[var(--radius)] border border-border p-6 sm:p-10 text-center relative shadow-sm min-h-[260px] sm:min-h-[350px]">
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-primary font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Now Serving Counter 1
          </span>

          <AnimatePresence mode="wait">
            {!queueDetails || !isCurrent ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 sm:h-32 w-56 sm:w-64 bg-muted rounded-2xl mx-auto" />
                <div className="h-5 sm:h-6 w-40 sm:w-48 bg-muted rounded mx-auto" />
              </div>
            ) : inServiceToken ? (
              <motion.div
                key={inServiceToken.id}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="space-y-2 sm:space-y-4"
              >
                <div className="text-6xl sm:text-8xl md:text-9xl font-mono font-extrabold tracking-tight text-foreground drop-shadow-sm">
                  {inServiceToken.tokenNumber}
                </div>
                <div className="text-xl sm:text-3xl font-serif font-semibold text-muted-foreground truncate max-w-[280px] sm:max-w-md mx-auto">
                  {inServiceToken.customerName}
                </div>
                {inServiceToken.priority === 'VIP' && (
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs">
                    VIP Customer
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="text-4xl sm:text-5xl font-mono font-bold text-muted-foreground">---</div>
                <p className="text-muted-foreground text-xs sm:text-sm font-sans">Station is currently idle</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Col: Up Next Ticket Strip */}
        <div className="bg-card rounded-[var(--radius)] border border-border p-3.5 sm:p-5 flex flex-col shadow-sm max-h-[320px] lg:max-h-none">
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-border mb-2.5 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Up Next in Line
            </span>
            <span className="text-xs font-mono text-primary font-bold">{waitingTokens.length} waiting</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {!queueDetails || !isCurrent ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 sm:h-12 bg-muted rounded-[var(--radius)] animate-pulse" />
              ))
            ) : waitingTokens.length === 0 ? (
              <div className="py-8 sm:py-12 text-center text-xs text-muted-foreground">No customers waiting</div>
            ) : (
              waitingTokens.slice(0, 6).map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-[var(--radius)] border ${
                    idx === 0
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-secondary/40 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs text-muted-foreground">#{t.position}</span>
                    <span className="font-mono font-bold text-base sm:text-lg text-foreground">{t.tokenNumber}</span>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[100px] sm:max-w-[140px]">{t.customerName}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDisplayModal;
