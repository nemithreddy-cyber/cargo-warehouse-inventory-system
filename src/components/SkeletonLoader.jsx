import React from 'react';

export const SkeletonPulse = ({ className = '', ...props }) => (
  <div
    className={`skeleton-shimmer rounded ${className}`}
    {...props}
  />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
    <div className="flex justify-between items-center">
      <SkeletonPulse className="w-24 h-4" />
      <SkeletonPulse className="w-8 h-8 rounded-xl" />
    </div>
    <div className="space-y-2">
      <SkeletonPulse className="w-16 h-8" />
      <SkeletonPulse className="w-32 h-3" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-full">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <SkeletonPulse className="w-32 h-5" />
      <SkeletonPulse className="w-16 h-4" />
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-4">
                <SkeletonPulse className="w-16 h-3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-5 py-4">
                  <SkeletonPulse className={`h-4 ${j === 0 ? 'w-24' : j === 1 ? 'w-32' : 'w-16'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonPulse className="w-48 h-5" />
      <SkeletonPulse className="w-16 h-4" />
    </div>
    <div className="h-64 flex items-end justify-between gap-4 pt-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className="w-full rounded-t-xl"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </div>
);
