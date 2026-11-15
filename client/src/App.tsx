import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getAuthToken } from './api';
import { User, QueueSummary, QueueDetails, Token, AnalyticsData } from './types';
import { Navbar } from './components/Navbar';
import { QueueBoard } from './components/QueueBoard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PublicDisplayModal } from './components/PublicDisplayModal';
import { AuthModal } from './components/AuthModal';
import { CreateQueueModal } from './components/CreateQueueModal';
import { AddTokenModal } from './components/AddTokenModal';
import { CancelTokenModal } from './components/CancelTokenModal';
import { TokenSuccessModal } from './components/TokenSuccessModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Button } from './components/ui/Button';
import { sound } from './utils/sound';
import { ArrowRight, Layers, Clock, Zap, AlertCircle, RefreshCw } from 'lucide-react';

function getInitialSearchParams() {
  if (typeof window === 'undefined') return { tab: 'queue' as const, queueId: null, page: 1, range: 'today' };
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get('tab');
  const tab: 'queue' | 'analytics' | 'display' = rawTab === 'analytics' || rawTab === 'display' ? rawTab : 'queue';
  const queueId = params.get('queueId') || null;
  const page = Math.max(1, parseInt(params.get('page') || '1') || 1);
  const rawRange = params.get('range');
  const range = rawRange === '7d' || rawRange === '30d' || rawRange === 'all' ? rawRange : 'today';
  return { tab, queueId, page, range };
}

export function App() {
  const initialParams = useRef(getInitialSearchParams()).current;
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'display'>(initialParams.tab);
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(initialParams.queueId);
  const [historyPage, setHistoryPage] = useState<number>(initialParams.page);
  const [analyticsRange, setAnalyticsRange] = useState<string>(initialParams.range);
  const [queueDetails, setQueueDetails] = useState<QueueDetails | null>(null);
  const [queueCache, setQueueCache] = useState<Record<string, QueueDetails>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const activeQueueIdRef = useRef<string | null>(null);
  activeQueueIdRef.current = activeQueueId;

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [cancelTargetToken, setCancelTargetToken] = useState<Token | null>(null);
  const [successToken, setSuccessToken] = useState<Token | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = { id: Math.random().toString(), text, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateUrl = useCallback((updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === undefined || val === '' || (key === 'page' && Number(val) === 1) || (key === 'range' && val === 'today')) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    }
    const query = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, '', query);
  }, []);

  // Load Queue Details with Page
  const loadQueueDetails = useCallback(async (id: string, page = 1) => {
    try {
      setLoading(true);
      const res = await api.getQueueDetails(id, page);
      setQueueDetails(res.queue);
      setQueueCache((prev) => ({ ...prev, [id]: res.queue }));
      setNetworkError(null);
    } catch (err: any) {
      console.error('Failed to load queue details:', err);
      setNetworkError(err.message || 'Failed to load queue details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Analytics with Range
  const loadAnalytics = useCallback(async (qId?: string, range = analyticsRange) => {
    try {
      const data = await api.getAnalytics(qId, range);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    }
  }, [analyticsRange]);

  // Load All Queues
  const loadQueues = useCallback(async (preferQueueId?: string) => {
    try {
      setLoading(true);
      const res = await api.getQueues();
      setQueues(res.queues);
      setNetworkError(null);

      if (res.queues.length > 0) {
        const currentId = activeQueueIdRef.current;
        const nextId = initialParams.queueId && res.queues.some((q) => q.id === initialParams.queueId)
          ? initialParams.queueId
          : (preferQueueId && res.queues.some((q) => q.id === preferQueueId)
            ? preferQueueId
            : (currentId && res.queues.some((q) => q.id === currentId) ? currentId : res.queues[0].id));

        setActiveQueueId(nextId);
        updateUrl({ tab: activeTab, queueId: nextId, page: historyPage, range: analyticsRange });
        await loadQueueDetails(nextId, historyPage);
      } else {
        setActiveQueueId(null);
        setQueueDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to load queues:', err);
      setNetworkError(err.message || 'Unable to load queues from server');
    } finally {
      setLoading(false);
    }
  }, [loadQueueDetails, activeTab, historyPage, analyticsRange, initialParams.queueId, updateUrl]);

  // Handle browser back/forward or URL state changes
  useEffect(() => {
    const handlePopState = () => {
      const current = getInitialSearchParams();
      setActiveTab(current.tab);
      if (current.queueId) setActiveQueueId(current.queueId);
      setHistoryPage(current.page);
      setAnalyticsRange(current.range);
      if (current.queueId) {
        loadQueueDetails(current.queueId, current.page);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadQueueDetails]);

  // Auth bootstrap on initial load
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => {
          setUser(res.user);
          loadQueues();
          loadAnalytics();
        })
        .catch(() => {
          api.logout();
          setUser(null);
        })
        .finally(() => {
          setIsBootstrapping(false);
        });
    } else {
      setIsBootstrapping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleServeNext = useCallback(async (queueId: string) => {
    try {
      const res = await api.serveNext(queueId);
      sound.playChime();
      addToast(res.message, 'success');
      loadQueueDetails(queueId);
      setQueues((prev) => prev.map((q) => q.id === queueId ? {
        ...q,
        counts: { ...q.counts, waiting: Math.max(0, q.counts.waiting - 1), inService: q.counts.inService + 1 }
      } : q));
    } catch (err: any) {
      sound.playError();
      addToast(err.message || 'Failed to serve next token', 'error');
    }
  }, [loadQueueDetails]);

  // Keyboard Shortcuts: Space to Serve Next, 'n' to Add Token
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        isAuthOpen ||
        isCreateQueueOpen ||
        isAddTokenOpen ||
        cancelTargetToken ||
        successToken
      ) {
        return;
      }

      // Only allow operational keyboard dispatch while viewing the active queue board
      if (activeTab === 'queue' && e.code === 'Space' && activeQueueId && user) {
        e.preventDefault();
        handleServeNext(activeQueueId);
      } else if (activeTab === 'queue' && (e.key === 'n' || e.key === 'N') && activeQueueId && user) {
        e.preventDefault();
        setIsAddTokenOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeQueueId, user, isAuthOpen, isCreateQueueOpen, isAddTokenOpen, cancelTargetToken, successToken, handleServeNext]);

  // Actions
  const handleSelectQueue = (id: string) => {
    setActiveQueueId(id);
    setHistoryPage(1);
    updateUrl({ tab: 'queue', queueId: id, page: 1 });
    if (queueCache[id]) {
      setQueueDetails(queueCache[id]);
    }
    loadQueueDetails(id, 1);
  };

  const handleHistoryPageChange = (newPage: number) => {
    setHistoryPage(newPage);
    if (activeQueueId) {
      updateUrl({ tab: 'queue', queueId: activeQueueId, page: newPage });
      loadQueueDetails(activeQueueId, newPage);
    }
  };

  const handleTabChange = (tab: 'queue' | 'analytics' | 'display') => {
    setActiveTab(tab);
    updateUrl({ tab, queueId: tab === 'queue' ? activeQueueId : undefined });
    if (tab === 'analytics') {
      loadAnalytics(activeQueueId || undefined, analyticsRange);
    }
  };

  const handleAnalyticsRefresh = (qId?: string, range?: string) => {
    const nextRange = range || analyticsRange;
    if (range) setAnalyticsRange(range);
    updateUrl({ tab: 'analytics', queueId: qId, range: nextRange });
    loadAnalytics(qId, nextRange);
  };

  const handleMoveUp = async (tokenId: string) => {
    try {
      const res = await api.moveTokenUp(tokenId);
      sound.playTick();
      addToast(res.message, 'info');
      if (res.tokens && activeQueueId) {
        setQueueDetails((prev) => (prev ? { ...prev, waitingTokens: res.tokens } : prev));
        setQueueCache((prev) =>
          prev[activeQueueId] ? { ...prev, [activeQueueId]: { ...prev[activeQueueId], waitingTokens: res.tokens } } : prev
        );
      } else if (activeQueueId) {
        loadQueueDetails(activeQueueId);
      }
    } catch (err: any) {
      sound.playError();
      addToast(err.message || 'Failed to move token', 'error');
    }
  };

  const handleMoveDown = async (tokenId: string) => {
    try {
      const res = await api.moveTokenDown(tokenId);
      sound.playTick();
      addToast(res.message, 'info');
      if (res.tokens && activeQueueId) {
        setQueueDetails((prev) => (prev ? { ...prev, waitingTokens: res.tokens } : prev));
        setQueueCache((prev) =>
          prev[activeQueueId] ? { ...prev, [activeQueueId]: { ...prev[activeQueueId], waitingTokens: res.tokens } } : prev
        );
      } else if (activeQueueId) {
        loadQueueDetails(activeQueueId);
      }
    } catch (err: any) {
      sound.playError();
      addToast(err.message || 'Failed to move token', 'error');
    }
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!cancelTargetToken) return;
    try {
      const res = await api.cancelToken(cancelTargetToken.id, reason);
      addToast(res.message, 'info');
      setCancelTargetToken(null);
      if (activeQueueId) {
        loadQueueDetails(activeQueueId);
        setQueues((prev) =>
          prev.map((q) =>
            q.id === activeQueueId
              ? {
                  ...q,
                  counts: {
                    ...q.counts,
                    waiting: Math.max(0, q.counts.waiting - 1),
                    cancelled: q.counts.cancelled + 1
                  }
                }
              : q
          )
        );
      }
    } catch (err: any) {
      sound.playError();
      addToast(err.message || 'Failed to cancel token', 'error');
    }
  };

  const handleCompleteService = async (tokenId: string) => {
    try {
      const res = await api.completeToken(tokenId);
      sound.playChime();
      addToast(res.message, 'success');
      if (activeQueueId) {
        loadQueueDetails(activeQueueId);
        setQueues((prev) =>
          prev.map((q) =>
            q.id === activeQueueId
              ? {
                  ...q,
                  counts: {
                    ...q.counts,
                    inService: Math.max(0, q.counts.inService - 1),
                    completed: q.counts.completed + 1
                  }
                }
              : q
          )
        );
      }
    } catch (err: any) {
      sound.playError();
      addToast(err.message || 'Failed to complete token', 'error');
    }
  };

  const handleDeleteQueue = async (queueId: string) => {
    if (!window.confirm('Are you sure you want to delete this queue and its tokens?')) return;
    try {
      await api.deleteQueue(queueId);
      setQueueCache((prev) => {
        const copy = { ...prev };
        delete copy[queueId];
        return copy;
      });
      addToast('Queue deleted successfully', 'info');
      loadQueues();
      loadAnalytics();
    } catch (err: any) {
      sound.playError();
      addToast(err.message || 'Failed to delete queue', 'error');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setQueues([]);
    setQueueDetails(null);
    setQueueCache({});
    setAnalytics(null);
    addToast('Signed out of terminal', 'info');
  };

  const activeQueue = queues.find((q) => q.id === activeQueueId) || null;

  // Initial App Loading Screen
  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-[var(--radius)] bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold mx-auto text-sm animate-pulse shadow-md">
            Q
          </div>
          <p className="text-xs font-mono text-muted-foreground">Initializing QueueFlow terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground font-sans transition-colors">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        queues={queues}
        onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
        onOpenAddToken={() => setIsAddTokenOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Network Connection Error Banner */}
      {networkError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-3 sm:px-4 py-2.5 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="font-medium truncate">{networkError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadQueues(activeQueueId || undefined)}
              className="h-6 px-2 text-[11px] ml-auto shrink-0"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      <main className={`flex-1 ${user ? 'pb-20 md:pb-6' : ''}`}>
        {!user ? (
          /* Utilitarian landing screen */
          <div className="max-w-4xl mx-auto px-4 py-10 sm:py-20 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground border border-border rounded-[var(--radius)] text-xs font-mono font-medium mb-5 sm:mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="truncate">Express + TypeScript + Neon Postgres</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-tight">
              Queue management without the friction.
            </h1>

            <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed font-sans px-2">
              Order customers in real time. Move tokens up or down. Call the next customer with one keystroke, and review wait times with live telemetry.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 max-w-sm sm:max-w-none mx-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto h-10.5 sm:h-11 px-6 sm:px-8 font-semibold shadow-sm text-xs sm:text-sm"
              >
                <span>Manager Sign In</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            {/* Feature specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mt-10 sm:mt-16 text-left border-t border-border pt-8 sm:pt-10">
              <div className="p-4 sm:p-5 bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm">
                <Layers className="w-4 h-4 text-primary mb-2" />
                <h3 className="font-bold text-xs text-foreground mb-1">Multi-Queue Dispatch</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Independent service lines with custom prefixes and automatic token numbering.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm">
                <Zap className="w-4 h-4 text-primary mb-2" />
                <h3 className="font-bold text-xs text-foreground mb-1">One-Touch Reorder</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Adjust position order with spring physics, priority flags, or call next with Spacebar.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm sm:col-span-2 md:col-span-1">
                <Clock className="w-4 h-4 text-primary mb-2" />
                <h3 className="font-bold text-xs text-foreground mb-1">Wait Telemetry</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Calculate exact wait times and arrival intervals powered by Neon Lakebase Postgres.
                </p>
              </div>
            </div>
          </div>
        ) : activeTab === 'queue' ? (
          <QueueBoard
            queues={queues}
            activeQueueId={activeQueueId}
            onSelectQueue={handleSelectQueue}
            queueDetails={queueDetails}
            loading={loading}
            historyPage={historyPage}
            onHistoryPageChange={handleHistoryPageChange}
            onServeNext={handleServeNext}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onOpenCancel={(token) => setCancelTargetToken(token)}
            onCompleteService={handleCompleteService}
            onOpenAddToken={() => setIsAddTokenOpen(true)}
            onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
            onDeleteQueue={handleDeleteQueue}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsDashboard
            analytics={analytics}
            queues={queues}
            loading={loading}
            selectedRange={analyticsRange}
            selectedQueueId={activeQueueId || 'all'}
            onRefresh={handleAnalyticsRefresh}
          />
        ) : (
          <PublicDisplayModal
            queues={queues}
            activeQueueId={activeQueueId}
            queueDetails={queueDetails}
            onSelectQueue={handleSelectQueue}
            onClose={() => setActiveTab('queue')}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setLoading(true);
          setUser(u);
          addToast(`Manager: ${u.name}`, 'success');
          loadQueues();
          loadAnalytics();
        }}
      />

      <CreateQueueModal
        isOpen={isCreateQueueOpen}
        onClose={() => setIsCreateQueueOpen(false)}
        onQueueCreated={(newQueue) => {
          addToast(`Queue "${newQueue.name}" created`, 'success');
          loadQueues(newQueue.id);
          loadAnalytics();
        }}
      />

      <AddTokenModal
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
        queues={queues}
        selectedQueueId={activeQueueId}
        onTokenAdded={(token) => {
          sound.playTick();
          setSuccessToken(token);
          loadQueueDetails(token.queueId);
          setQueues((prev) =>
            prev.map((q) =>
              q.id === token.queueId
                ? {
                    ...q,
                    counts: {
                      ...q.counts,
                      waiting: q.counts.waiting + 1,
                      total: q.counts.total + 1
                    }
                  }
                : q
            )
          );
        }}
      />

      {/* Ticket Issued Success Screen */}
      <TokenSuccessModal
        isOpen={!!successToken}
        onClose={() => setSuccessToken(null)}
        token={successToken}
        queue={activeQueue}
        onIssueAnother={() => {
          setSuccessToken(null);
          setIsAddTokenOpen(true);
        }}
      />

      <CancelTokenModal
        isOpen={!!cancelTargetToken}
        onClose={() => setCancelTargetToken(null)}
        token={cancelTargetToken}
        onConfirm={handleCancelConfirm}
      />

      {/* Toast Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
