import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 max-w-sm sm:w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-destructive shrink-0" />,
    info: <Info className="w-4 h-4 text-primary shrink-0" />
  };

  const borders = {
    success: 'border-primary/30 bg-card text-foreground shadow-md',
    error: 'border-destructive/30 bg-card text-foreground shadow-md',
    info: 'border-border bg-card text-foreground shadow-md'
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[var(--radius)] border text-xs font-medium transition-all animate-in slide-in-from-bottom-2 ${borders[toast.type]}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icons[toast.type]}
        <span className="truncate">{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
