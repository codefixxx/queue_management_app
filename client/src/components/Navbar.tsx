import React, { useState } from 'react';
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
  Keyboard,
  Moon,
  Sun
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
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const totalWaiting = queues.reduce((sum, q) => sum + q.counts.waiting, 0);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundOn(sound.enabled);
    if (sound.enabled) sound.playTick();
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="h-7 w-7 rounded-[var(--radius)] bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-xs shadow-xs shrink-0">
              Q
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-serif font-bold text-base text-foreground tracking-tight">QueueFlow</span>
              <span className="hidden sm:inline-block text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded border border-border">v1.2</span>
            </div>
          </div>

          {/* Desktop & Tablet Operational Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-secondary/80 p-0.5 rounded-[var(--radius)] border border-border">
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex items-center gap-1.5 px-3 py-1.2 rounded-[var(--radius)] text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Dispatch</span>
                {totalWaiting > 0 && (
                  <span className="px-1.5 py-0.2 bg-primary text-primary-foreground rounded text-[10px] font-mono font-bold">
                    {totalWaiting}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.2 rounded-[var(--radius)] text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Metrics</span>
              </button>
              <button
                onClick={() => setActiveTab('display')}
                className={`flex items-center gap-1.5 px-3 py-1.2 rounded-[var(--radius)] text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'display'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Monitor</span>
              </button>
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 rounded-[var(--radius)] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>

            {user ? (
              <>
                {/* Keyboard shortcut hint */}
                <div
                  className="hidden xl:flex items-center gap-1 text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5"
                  title="Keyboard: Space to serve next, N for new token"
                >
                  <Keyboard className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono">Space</span>
                  <span>call</span>
                </div>

                {/* Sound Chime Toggle */}
                <button
                  onClick={toggleSound}
                  className="p-1.5 sm:p-2 rounded-[var(--radius)] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer hidden sm:inline-flex"
                  title={soundOn ? 'Counter Chime On' : 'Counter Chime Muted'}
                >
                  {soundOn ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                </button>

                {/* New Line Button (Desktops) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenCreateQueue}
                  className="hidden xl:inline-flex h-8 px-2.5 text-xs"
                >
                  New Line
                </Button>

                {/* Issue Ticket Button (Tablet & Desktop) */}
                {queues.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenAddToken}
                    className="hidden md:inline-flex h-8 px-2.5 sm:px-3 text-xs shadow-sm font-semibold"
                    title="Issue new ticket"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Issue Ticket</span>
                  </Button>
                )}

                {/* User Profile & Sign Out */}
                <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-border">
                  <span className="text-xs font-semibold text-foreground hidden lg:block max-w-[120px] truncate">{user.name}</span>
                  <button
                    onClick={onLogout}
                    title="Sign out"
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={onOpenAuth} className="h-8 px-3.5 text-xs shadow-sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Phones & Small Tablets) */}
      {user && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around h-14 px-2 pb-[env(safe-area-inset-bottom)] transition-colors shadow-lg"
          aria-label="Mobile Navigation"
        >
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[11px] font-medium transition-colors cursor-pointer relative ${
              activeTab === 'queue' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <Inbox className="w-4 h-4" />
              {totalWaiting > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.1 bg-primary text-primary-foreground rounded-full text-[9px] font-mono font-bold leading-none">
                  {totalWaiting}
                </span>
              )}
            </div>
            <span>Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Metrics</span>
          </button>

          {/* Quick Issue Ticket Central Action Button */}
          {queues.length > 0 && (
            <button
              onClick={onOpenAddToken}
              className="flex flex-col items-center justify-center -mt-5 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
              title="Issue Ticket"
              aria-label="Issue New Token Ticket"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setActiveTab('display')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'display' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Monitor</span>
          </button>

          <button
            onClick={onOpenCreateQueue}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Create Queue Line"
          >
            <Plus className="w-4 h-4" />
            <span>New Line</span>
          </button>
        </nav>
      )}
    </>
  );
};
