import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'vip';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight border';

  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    secondary: 'bg-slate-50 text-slate-600 border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
    destructive: 'bg-rose-50 text-rose-800 border-rose-200/90',
    outline: 'border-slate-300 text-slate-700 bg-transparent',
    vip: 'bg-amber-100/70 text-amber-950 border-amber-300/80 font-bold'
  };

  return (
    <span className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
