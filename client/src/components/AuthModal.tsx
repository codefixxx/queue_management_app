import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { api } from '../api';
import { User } from '../types';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({ name, email, password });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('manager@queueflow.com');
    setPassword('password123');
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({
        email: 'manager@queueflow.com',
        password: 'password123'
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'login' ? 'Queue Manager Sign In' : 'Create Manager Account'}
      description="Access your queues, re-order tokens, and view live analytics."
    >
      <div className="space-y-4">
        {/* Quick Demo Credentials Pill */}
        <div className="p-3 bg-secondary/80 border border-border rounded-[var(--radius)] flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 sm:gap-3">
          <div className="text-xs text-foreground min-w-0">
            <span className="font-semibold flex items-center gap-1 text-primary">
              <Sparkles className="w-3.5 h-3.5 inline shrink-0" /> Quick Demo Account
            </span>
            <span className="text-muted-foreground text-[11px] font-mono block truncate">manager@queueflow.com / password123</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleDemoLogin}
            loading={loading}
            className="text-xs h-8 sm:h-7.5 px-3 w-full xs:w-auto shrink-0 justify-center"
          >
            Auto Login
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-[var(--radius)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Manager Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@example.com"
              className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full font-semibold shadow-sm" loading={loading}>
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Register as Manager
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
