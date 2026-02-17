import React from 'react';
import { BarChart2, Hammer } from 'lucide-react';

export const WebsiteAnalyticsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Website Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Performance metrics for your website pages.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 md:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <BarChart2 size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Under Construction
          </h2>
        </div>

        <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
          <Hammer size={18} className="mt-0.5 text-slate-400" />
          <p>
            This section is being built. Website analytics will be available here soon.
          </p>
        </div>
      </div>
    </div>
  );
};

