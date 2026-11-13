import React from 'react';
import { User, QueueSummary } from '../types';
import { Button } from './ui/Button';
import {
  Users,
  BarChart3,
  Plus,
  LogOut,
  Layers,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: 'queue' | 'analytics';
  setActiveTab: (tab: 'queue' | 'analytics') => void;
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
  const totalWaiting = queues.reduce((sum, q) => sum + q.counts.waiting, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">QueueFlow</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Smart Queue Management & Analytics</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Live Queues</span>
              {totalWaiting > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px]">
                  {totalWaiting}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateQueue}
                className="hidden md:flex"
              >
                <Plus className="w-4 h-4 mr-1 text-slate-500" />
                New Queue
              </Button>

              {queues.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAddToken}
                  className="shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Token
                </Button>
              )}

              {/* User Dropdown / Info */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-medium text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onOpenAuth}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Manager Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

