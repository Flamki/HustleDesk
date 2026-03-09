import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, DollarSign, ShieldAlert } from 'lucide-react';
import { getSharedTimeEntry } from '../services/timeEntryShareService';
import { SharedTimeEntryResponse } from '../types';
import { BrandLogo } from '../components/brand/BrandLogo';

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SharedTimeEntryPage: React.FC = () => {
  const { token } = useParams();
  const [data, setData] = useState<SharedTimeEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const t = String(token || '').trim();
      if (!t) {
        setError('Invalid link.');
        setLoading(false);
        return;
      }
      const { data: result, error: fetchError } = await getSharedTimeEntry(t);
      if (!active) return;
      if (fetchError || !result) {
        setData(null);
        setError(fetchError?.message || 'Failed to load entry');
      } else {
        setData(result);
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  const dateLabel = useMemo(() => {
    if (!data) return '';
    const start = new Date(data.entry.start_time);
    const end = new Date(data.entry.end_time);
    return `${start.toLocaleString()} to ${end.toLocaleString()}`;
  }, [data]);

  const title = data ? `${data.entry.client} • ${data.entry.project}` : 'Time Session';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent py-10 px-4">
      <div className="hd-app-container space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/35 backdrop-blur-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="h-5 w-fit">
                <BrandLogo className="h-5 w-auto" />
              </div>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dateLabel}</p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Read-only session link
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/25 p-5">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                <Clock size={14} /> Duration
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {data ? formatDuration(data.summary.tracked_seconds) : '--:--:--'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/25 p-5">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                <DollarSign size={14} /> Amount
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {data ? `${data.summary.currency} ${data.summary.total_earnings.toFixed(2)}` : '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/25 p-5">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                Hourly rate
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {data ? `${data.summary.currency} ${data.entry.hourly_rate.toFixed(2)}/h` : '-'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/35 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <p className="font-bold text-slate-900 dark:text-white">Session details</p>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : !data ? (
              <p className="text-sm text-slate-500">No data.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Client</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{data.entry.client}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Project</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{data.entry.project}</p>
                  </div>
                </div>

                {data.link.include_details && data.entry.description ? (
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {data.entry.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/25 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Description is hidden for this shared link.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5" />
            <p>This link is read-only.</p>
          </div>
        </div>
      </div>
    </div>
  );
};


