import React from 'react';
import { cn } from '../../utils/cn';

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
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none select-none rounded-[var(--radius)] cursor-pointer active:scale-[0.985]';

  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:opacity-90 shadow-sm border border-primary font-semibold',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-muted border border-border',
    outline:
      'border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground shadow-2xs',
    destructive:
      'bg-destructive text-destructive-foreground hover:opacity-90 border border-destructive shadow-xs font-semibold',
    ghost:
      'text-muted-foreground hover:bg-muted hover:text-foreground',
    success:
      'bg-primary text-primary-foreground hover:opacity-90 border border-primary shadow-xs font-semibold'
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs font-semibold gap-2',
    lg: 'h-10 px-5 text-sm font-semibold gap-2.5',
    icon: 'h-8.5 w-8.5 p-0'
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
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
