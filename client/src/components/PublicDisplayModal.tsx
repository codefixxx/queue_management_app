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
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-mono font-bold text-sm">
            Q
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">{activeQueue?.name || 'Queue Display'}</h2>
            <p className="text-xs text-slate-400">Public Counter Monitor</p>
          </div>
        </div>

        {/* Queue Switcher */}
        <div className="flex items-center gap-2">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelectQueue(q.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                q.id === activeQueue?.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-sm text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
          </div>

          <Button variant="outline" size="sm" onClick={toggleFullscreen} className="bg-slate-800 border-slate-700 text-slate-200">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Exit Monitor
          </Button>
        </div>
      </div>

      {/* Main Grid: NOW SERVING (Dominant) vs NEXT IN LINE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-6 gap-6 overflow-hidden">
        {/* Left 2 Cols: Massive Now Serving Ticket */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800/80 p-8 text-center relative">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold mb-4">
            ● Now Serving Counter 1
          </span>

          <AnimatePresence mode="wait">
            {inServiceToken ? (
              <motion.div
                key={inServiceToken.id}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="space-y-4"
              >
                <div className="text-8xl sm:text-9xl font-mono font-extrabold tracking-tighter text-white drop-shadow-md">
                  {inServiceToken.tokenNumber}
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-slate-300">
                  {inServiceToken.customerName}
                </div>
                {inServiceToken.priority === 'VIP' && (
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs">
                    VIP Customer
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl font-mono font-bold text-slate-600">---</div>
                <p className="text-slate-500 text-sm">Station is currently idle</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Col: Up Next Ticket Strip */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Up Next in Line
            </span>
            <span className="text-xs font-mono text-slate-500">{waitingTokens.length} waiting</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {waitingTokens.slice(0, 6).map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-slate-850/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400">#{t.position}</span>
                  <span className="font-mono font-bold text-lg text-white">{t.tokenNumber}</span>
                </div>
                <span className="text-xs font-medium truncate max-w-[120px]">{t.customerName}</span>
              </motion.div>
            ))}

            {waitingTokens.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500">No customers waiting</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
