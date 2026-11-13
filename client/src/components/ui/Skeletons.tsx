import React from 'react';
import { Skeleton } from './Skeleton';

export const QueueBoardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-150">
      {/* Queue Tabs Bar Skeleton */}
      <div className="flex items-center justify-between border-b border-slate-200/90 pb-3 gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>

      {/* Dispatch Control Station Banner Skeleton */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>

          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9.5 w-24 rounded-lg" />
            <Skeleton className="h-9.5 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Main Waiting Line Card Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="py-3 px-4 border-b border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 border border-slate-100 rounded-lg gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-7 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3.5 w-10 rounded" />
                  </div>
                  <Skeleton className="h-3 w-44 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <Skeleton className="h-7 w-8 rounded" />
                <Skeleton className="h-7 w-8 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-150">
      {/* Scope Filter Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3.5 w-72 rounded" />
        </div>
        <Skeleton className="h-8 w-44 rounded-lg" />
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Row 2: Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="h-48 w-full flex items-center justify-center">
            <Skeleton className="h-36 w-36 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
      </div>

      {/* Row 3: Histogram & Table Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="space-y-2 pt-1">
            {[1, 2, 3, 4].map((r) => (
              <Skeleton key={r} className="h-8 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
