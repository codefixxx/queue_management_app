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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* Queue Tabs Bar Skeleton */}
      <div className="flex items-center justify-between border-b border-border pb-2.5 sm:pb-3 gap-2 sm:gap-4 w-full min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          <Skeleton className="h-8 w-24 sm:w-28 rounded-md shrink-0" />
          <Skeleton className="h-8 w-28 sm:w-32 rounded-md shrink-0" />
          <Skeleton className="h-8 w-14 sm:w-16 rounded-md shrink-0" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-7 w-14 sm:w-16 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>

      {/* Dispatch Control Station Banner Skeleton */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-3.5 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded" />
              <Skeleton className="h-6 w-40 sm:w-48 rounded" />
            </div>
            <Skeleton className="h-3.5 w-52 sm:w-64 rounded" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Skeleton className="h-9 flex-1 md:w-24 rounded-md" />
            <Skeleton className="h-9 flex-1 md:w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Waiting Line Card Skeleton */}
      <div className="rounded-[var(--radius)] border border-border bg-card overflow-hidden shadow-sm">
        <div className="py-2.5 sm:py-3 px-3.5 sm:px-4 border-b border-border flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border border-border rounded-md gap-2.5 bg-card"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <Skeleton className="h-6 w-6 sm:w-7 rounded shrink-0" />
                <Skeleton className="h-7 w-20 sm:w-24 rounded font-mono shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-24 sm:w-32 rounded" />
                  <Skeleton className="h-2.5 w-16 sm:w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-3.5 w-60 sm:w-72 rounded mt-1.5" />
        </div>
        <Skeleton className="h-8 w-full sm:w-36 rounded-md" />
      </div>

      {/* KPI Cards Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 sm:p-4 rounded-[var(--radius)] border border-border bg-card space-y-2 shadow-sm">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 sm:h-7 w-16 sm:w-20 rounded" />
            <Skeleton className="h-2.5 w-20 sm:w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="lg:col-span-2 p-3 sm:p-4 rounded-[var(--radius)] border border-border bg-card space-y-3 shadow-sm">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-52 sm:h-64 w-full rounded-md" />
        </div>
        <div className="p-3 sm:p-4 rounded-[var(--radius)] border border-border bg-card space-y-3 shadow-sm">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-44 sm:h-48 w-full rounded-md" />
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
