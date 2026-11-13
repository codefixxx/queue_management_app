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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white text-slate-800 shadow-lg',
    error: 'border-rose-200 bg-white text-slate-800 shadow-lg',
    info: 'border-blue-200 bg-white text-slate-800 shadow-lg'
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-medium transition-all animate-in slide-in-from-bottom-2 ${borders[toast.type]}`}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <span>{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

