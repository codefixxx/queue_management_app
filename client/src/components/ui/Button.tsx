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
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none select-none rounded-lg cursor-pointer active:scale-[0.985]';

  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs border border-slate-900',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200/80 border border-slate-200/80',
    outline: 'border border-slate-300/90 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-xs',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 shadow-xs'
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs font-semibold gap-2',
    lg: 'h-10.5 px-5 text-sm font-semibold gap-2.5',
    icon: 'h-8.5 w-8.5 p-0'
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
