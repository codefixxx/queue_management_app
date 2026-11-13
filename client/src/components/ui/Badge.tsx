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
  const base =
    'inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium tracking-tight border transition-colors';

  const variants = {
    default: 'bg-secondary text-secondary-foreground border-border',
    secondary: 'bg-muted text-muted-foreground border-border',
    success: 'bg-primary/15 text-primary border-primary/30 font-semibold',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold',
    destructive: 'bg-destructive/15 text-destructive border-destructive/30 font-semibold',
    outline: 'border-border text-foreground bg-transparent',
    vip: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold'
  };

  return (
    <span className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
