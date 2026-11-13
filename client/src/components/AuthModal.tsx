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
      onClose={onClose}
      title={mode === 'login' ? 'Queue Manager Sign In' : 'Create Manager Account'}
      description="Access your queues, re-order tokens, and view live analytics."
    >
      <div className="space-y-4">
        {/* Quick Demo Credentials Pill */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
          <div className="text-xs text-blue-900">
            <span className="font-semibold block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 inline" /> Quick Demo Account
            </span>
            <span className="text-blue-700 text-[11px]">manager@queueflow.com (password123)</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleDemoLogin}
            loading={loading}
            className="text-xs h-7.5 px-3 whitespace-nowrap"
          >
            Auto Login
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Manager Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@example.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
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
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
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

