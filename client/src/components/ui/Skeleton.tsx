import React from 'react';
import clsx from 'clsx';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('animate-pulse rounded-[var(--radius)] bg-muted/80', className)}
      {...props}
    />
  );
};

export const QueueBoardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-150">
      {/* Queue Tabs Bar Skeleton */}
      <div className="flex items-center justify-between border-b border-border pb-3 gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>

      {/* Dispatch Control Station Banner Skeleton */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>

          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Waiting Line Card Skeleton */}
      <div className="rounded-[var(--radius)] border border-border bg-card overflow-hidden shadow-sm">
        <div className="py-3 px-4 border-b border-border flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 border border-border rounded-md gap-3 bg-card"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-7 rounded" />
                <Skeleton className="h-7 w-24 rounded font-mono" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-3.5 w-72 rounded mt-1.5" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-[var(--radius)] border border-border bg-card space-y-2.5 shadow-sm">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
            <Skeleton className="h-2.5 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-[var(--radius)] border border-border bg-card space-y-4 shadow-sm">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
        <div className="p-5 rounded-[var(--radius)] border border-border bg-card space-y-4 shadow-sm">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
};

export const ModalSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-1 animate-in fade-in duration-150">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="pt-2 flex justify-end gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
};
