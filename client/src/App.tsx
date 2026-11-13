import { useState, useEffect, useCallback } from 'react';
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
import { ToastContainer, ToastMessage } from './components/Toast';
import { Button } from './components/ui/Button';
import { sound } from './utils/sound';
import { ArrowRight, Layers, Clock, Zap } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'display'>('queue');
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [queueDetails, setQueueDetails] = useState<QueueDetails | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [cancelTargetToken, setCancelTargetToken] = useState<Token | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = { id: Math.random().toString(), text, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Queue Details
  const loadQueueDetails = useCallback(async (id: string) => {
    try {
      const res = await api.getQueueDetails(id);
      setQueueDetails(res.queue);
    } catch (err: any) {
      console.error('Failed to load queue details:', err);
    }
  }, []);

  // Load Analytics
  const loadAnalytics = useCallback(async (qId?: string) => {
    try {
      const data = await api.getAnalytics(qId);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    }
  }, []);

  // Load All Queues
  const loadQueues = useCallback(async (preferQueueId?: string) => {
    try {
      setLoading(true);
      const res = await api.getQueues();
      setQueues(res.queues);

      if (res.queues.length > 0) {
        const nextId = preferQueueId && res.queues.some((q) => q.id === preferQueueId)
          ? preferQueueId
          : (activeQueueId && res.queues.some((q) => q.id === activeQueueId) ? activeQueueId : res.queues[0].id);

        setActiveQueueId(nextId);
        await loadQueueDetails(nextId);
      } else {
        setActiveQueueId(null);
        setQueueDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to load queues:', err);
    } finally {
      setLoading(false);
    }
  }, [activeQueueId, loadQueueDetails]);

  // Auth bootstrap
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
        });
    }
  }, []);

  // Keyboard ergonomics (Space to serve next, N for new token)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea or modal is open
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      if (isInput || isAuthOpen || isCreateQueueOpen || isAddTokenOpen || cancelTargetToken) return;

      if (e.code === 'Space' && activeTab === 'queue' && activeQueueId && queueDetails?.waitingTokens[0]) {
        e.preventDefault();
        handleServeNext(activeQueueId);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsAddTokenOpen(true);
      } else if (e.key === '1') {
        setActiveTab('queue');
      } else if (e.key === '2') {
        setActiveTab('analytics');
      } else if (e.key === '3') {
        setActiveTab('display');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeQueueId, queueDetails, isAuthOpen, isCreateQueueOpen, isAddTokenOpen, cancelTargetToken]);

  const handleSelectQueue = (id: string) => {
    setActiveQueueId(id);
    loadQueueDetails(id);
  };

  // Serve Next
  const handleServeNext = async (queueId: string) => {
    try {
      const res = await api.serveNext(queueId);
      sound.playCallChime();
      addToast(res.message, 'success');
      await loadQueueDetails(queueId);
      await loadQueues(queueId);
      loadAnalytics(queueId);
    } catch (err: any) {
      addToast(err.message || 'Failed to serve next token', 'error');
    }
  };

  // Move Up
  const handleMoveUp = async (tokenId: string) => {
    try {
      const res = await api.moveTokenUp(tokenId);
      sound.playTick();
      addToast(res.message, 'info');
      if (activeQueueId) await loadQueueDetails(activeQueueId);
    } catch (err: any) {
      addToast(err.message || 'Failed to move token up', 'error');
    }
  };

  // Move Down
  const handleMoveDown = async (tokenId: string) => {
    try {
      const res = await api.moveTokenDown(tokenId);
      sound.playTick();
      addToast(res.message, 'info');
      if (activeQueueId) await loadQueueDetails(activeQueueId);
    } catch (err: any) {
      addToast(err.message || 'Failed to move token down', 'error');
    }
  };

  // Cancel Token
  const handleCancelConfirm = async (tokenId: string, reason: string) => {
    try {
      const res = await api.cancelToken(tokenId, reason);
      addToast(res.message, 'info');
      if (activeQueueId) {
        await loadQueueDetails(activeQueueId);
        await loadQueues(activeQueueId);
        loadAnalytics(activeQueueId);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel token', 'error');
    }
  };

  // Complete Service
  const handleCompleteService = async (tokenId: string) => {
    try {
      const res = await api.completeToken(tokenId);
      addToast(res.message, 'success');
      if (activeQueueId) {
        await loadQueueDetails(activeQueueId);
        await loadQueues(activeQueueId);
        loadAnalytics(activeQueueId);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to complete token service', 'error');
    }
  };

  // Delete Queue
  const handleDeleteQueue = async (queueId: string) => {
    try {
      await api.deleteQueue(queueId);
      addToast('Queue deleted', 'info');
      await loadQueues();
      loadAnalytics();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete queue', 'error');
    }
  };

  // Quick Demo Login
  const handleOneClickDemo = async () => {
    try {
      const res = await api.login({
        email: 'manager@queueflow.com',
        password: 'password123'
      });
      setUser(res.user);
      addToast(`Manager: ${res.user.name}`, 'success');
      await loadQueues();
      await loadAnalytics();
    } catch {
      setIsAuthOpen(true);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setQueues([]);
    setQueueDetails(null);
    setAnalytics(null);
    addToast('Signed out', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-slate-200">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queues={queues}
        onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
        onOpenAddToken={() => setIsAddTokenOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        {!user ? (
          /* Un-slopped Landing: Quiet chrome, utilitarian, honest typography */
          <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-mono font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Express + TypeScript + Neon Postgres
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
              Queue management without the friction.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
              Order customers in real time. Move tokens up or down. Call the next customer with one keystroke, and review wait times with live telemetry.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOneClickDemo}
                className="w-full sm:w-auto h-11 px-6 font-semibold shadow-xs"
              >
                <span>Open demo terminal</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto h-11 px-6 bg-white"
              >
                Manager sign in
              </Button>
            </div>

            {/* Feature specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 text-left border-t border-slate-200/80 pt-10">
              <div className="p-4 bg-white rounded-xl border border-slate-200/80">
                <Layers className="w-4 h-4 text-slate-700 mb-2" />
                <h3 className="font-bold text-xs text-slate-900 mb-1">Multi-Queue Dispatch</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Independent service lines with custom prefixes and automatic token numbering.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/80">
                <Zap className="w-4 h-4 text-slate-700 mb-2" />
                <h3 className="font-bold text-xs text-slate-900 mb-1">One-Touch Reorder</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Adjust position order with spring physics, priority flags, or call next with Spacebar.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/80">
                <Clock className="w-4 h-4 text-slate-700 mb-2" />
                <h3 className="font-bold text-xs text-slate-900 mb-1">Wait Telemetry</h3>
                <p className="text-xs text-slate-500 leading-normal">
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
            onRefresh={(qId) => loadAnalytics(qId)}
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
          addToast(`Token ${token.tokenNumber} added`, 'success');
          if (activeQueueId) loadQueueDetails(activeQueueId);
          loadQueues(token.queueId);
          loadAnalytics(token.queueId);
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
