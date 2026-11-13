import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    localStorage.removeItem('queue_manager_token');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              Application Error Occurred
            </h2>
            <p className="text-xs text-slate-500 mb-5 leading-normal">
              An unexpected render error occurred in the queue interface. You can reload the terminal or reset your session.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-left font-mono text-[11px] text-slate-700 mb-5 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Reset Session
              </Button>
              <Button variant="primary" size="sm" onClick={this.handleReload}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reload Terminal
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

