import { useState, useEffect, useCallback } from 'react';
import { api, getAuthToken } from './api';
import { User, QueueSummary, QueueDetails, Token, AnalyticsData } from './types';
import { Navbar } from './components/Navbar';
import { QueueBoard } from './components/QueueBoard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuthModal } from './components/AuthModal';
import { CreateQueueModal } from './components/CreateQueueModal';
import { AddTokenModal } from './components/AddTokenModal';
import { CancelTokenModal } from './components/CancelTokenModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Button } from './components/ui/Button';
import { Sparkles, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics'>('queue');
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

  // Switch queue
  const handleSelectQueue = (id: string) => {
    setActiveQueueId(id);
    loadQueueDetails(id);
  };

  // Requirement 6: Assign token at top of queue for service
  const handleServeNext = async (queueId: string) => {
    try {
      const res = await api.serveNext(queueId);
      addToast(res.message, 'success');
      await loadQueueDetails(queueId);
      await loadQueues(queueId);
      loadAnalytics(queueId);
    } catch (err: any) {
      addToast(err.message || 'Failed to serve next token', 'error');
    }
  };

  // Requirement 5: Move token Up
  const handleMoveUp = async (tokenId: string) => {
    try {
      const res = await api.moveTokenUp(tokenId);
      addToast(res.message, 'info');
      if (activeQueueId) await loadQueueDetails(activeQueueId);
    } catch (err: any) {
      addToast(err.message || 'Failed to move token up', 'error');
    }
  };

  // Requirement 5: Move token Down
  const handleMoveDown = async (tokenId: string) => {
    try {
      const res = await api.moveTokenDown(tokenId);
      addToast(res.message, 'info');
      if (activeQueueId) await loadQueueDetails(activeQueueId);
    } catch (err: any) {
      addToast(err.message || 'Failed to move token down', 'error');
    }
  };

  // Requirement 7: Cancel token
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

  // Complete service
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
      addToast('Queue deleted successfully', 'info');
      await loadQueues();
      loadAnalytics();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete queue', 'error');
    }
  };

  // Quick Demo Login from landing
  const handleOneClickDemo = async () => {
    try {
      const res = await api.login({
        email: 'manager@queueflow.com',
        password: 'password123'
      });
      setUser(res.user);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      await loadQueues();
      await loadAnalytics();
    } catch (err: any) {
      setIsAuthOpen(true);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setQueues([]);
    setQueueDetails(null);
    setAnalytics(null);
    addToast('Signed out successfully', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
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
          /* Landing Hero for Unauthenticated User with instant Demo Button */
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Full-Stack Express.js + TypeScript + Shadcn UI
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 mb-6 leading-tight">
              Real-Time Queue Management <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                & Predictive Analytics
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10">
              Manage multi-counter queues, reorder customer tokens in real time, call next in line with
              one click, and visualize wait-time telemetry and throughput charts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOneClickDemo}
                className="w-full sm:w-auto shadow-lg shadow-blue-500/25 text-base px-8 py-3.5 font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2 text-amber-300" />
                Launch Demo Manager (1-Click)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto text-base px-6 py-3.5 bg-white"
              >
                <ShieldCheck className="w-5 h-5 mr-2 text-slate-600" />
                Sign In / Register
              </Button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Multi-Queue Orchestration</h3>
                <p className="text-xs text-slate-500">
                  Create named queues with custom prefix codes, separate service booths, and track active loads.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Dynamic Position Reordering</h3>
                <p className="text-xs text-slate-500">
                  Move tokens up or down the line seamlessly, assign top token with 1-click, and handle cancellations cleanly.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Telemetry & Wait-Time Analytics</h3>
                <p className="text-xs text-slate-500">
                  Interactive Recharts dashboard tracking arrival trends, average wait duration, and throughput metrics.
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
        ) : (
          <AnalyticsDashboard
            analytics={analytics}
            queues={queues}
            loading={loading}
            onRefresh={(qId) => loadAnalytics(qId)}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          addToast(`Signed in as ${u.name}`, 'success');
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
          addToast(`Token ${token.tokenNumber} added to queue`, 'success');
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

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
