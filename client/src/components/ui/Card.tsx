import React from 'react';
import clsx from 'clsx';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={clsx('rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xs', className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={clsx('flex flex-col space-y-1.5 p-5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={clsx('font-semibold leading-none tracking-tight text-slate-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={clsx('text-xs text-slate-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={clsx('p-5 pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={clsx('flex items-center p-5 pt-0', className)} {...props}>
    {children}
  </div>
);

