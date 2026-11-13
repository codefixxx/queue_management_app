import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-lg cursor-pointer';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 focus-visible:ring-slate-400',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs focus-visible:ring-blue-500',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-500 active:bg-rose-800',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus-visible:ring-emerald-500 active:bg-emerald-800'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9.5 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2.5 font-semibold',
    icon: 'h-9 w-9 p-0'
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

