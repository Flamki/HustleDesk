import React from 'react';
import { Loader2 } from 'lucide-react';

export const RouteLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => {
  return (
    <div className="w-full h-full min-h-[40vh] flex items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/40">
        <Loader2 className="h-5 w-5 animate-spin text-slate-600 dark:text-slate-300" />
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
      </div>
    </div>
  );
};

