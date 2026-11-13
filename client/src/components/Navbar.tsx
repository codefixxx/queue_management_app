import React from 'react';
import { User, QueueSummary } from '../types';
import { Button } from './ui/Button';
import {
  Inbox,
  BarChart2,
  Tv,
  Plus,
  LogOut,
  Volume2,
  VolumeX,
  Keyboard
} from 'lucide-react';
import { sound } from '../utils/sound';

interface NavbarProps {
  user: User | null;
  activeTab: 'queue' | 'analytics' | 'display';
  setActiveTab: (tab: 'queue' | 'analytics' | 'display') => void;
  queues: QueueSummary[];
  onOpenCreateQueue: () => void;
  onOpenAddToken: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  queues,
  onOpenCreateQueue,
  onOpenAddToken,
  onLogout,
  onOpenAuth
}) => {
  const [soundOn, setSoundOn] = React.useState(sound.enabled);
  const totalWaiting = queues.reduce((sum, q) => sum + q.counts.waiting, 0);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundOn(sound.enabled);
    if (sound.enabled) sound.playTick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-slate-950 flex items-center justify-center text-white font-mono font-bold text-xs">
            Q
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 tracking-tight">QueueFlow</span>
            <span className="text-[10px] text-slate-400 font-mono">v1.2</span>
          </div>
        </div>

        {/* Operational Navigation Tabs */}
        {user && (
          <nav className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-white text-slate-950 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Dispatch</span>
              {totalWaiting > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-900 text-white rounded text-[10px] font-mono">
                  {totalWaiting}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-950 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'display'
                  ? 'bg-white text-slate-950 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Monitor</span>
            </button>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Keyboard shortcuts hint */}
              <div
                className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5"
                title="Keyboard: Space to serve next, N for new token"
              >
                <Keyboard className="w-3 h-3 text-slate-400" />
                <span className="font-mono">Space</span>
                <span>call</span>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title={soundOn ? 'Counter Chime On' : 'Counter Chime Muted'}
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-slate-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateQueue}
                className="hidden sm:inline-flex h-8 px-2.5 text-xs text-slate-700"
              >
                New Line
              </Button>

              {queues.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAddToken}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Issue Ticket
                </Button>
              )}

              {/* User Profile */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-800 hidden md:block">{user.name}</span>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onOpenAuth}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
