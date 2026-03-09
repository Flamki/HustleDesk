import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, DollarSign, ShieldAlert } from 'lucide-react';
import { getSharedTimeReport } from '../services/timeShareService';
import { SharedTimeReportResponse } from '../types';
import { BrandLogo } from '../components/brand/BrandLogo';

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SharedTimeReportPage: React.FC = () => {
  const { token } = useParams();
  const [data, setData] = useState<SharedTimeReportResponse | null>(null);
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
      const { data: result, error: fetchError } = await getSharedTimeReport(t);
      if (!active) return;
      if (fetchError || !result) {
        setData(null);
        setError(fetchError?.message || 'Failed to load report');
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

  const title = data?.link.label || 'Time Report';
  const rangeLabel = useMemo(() => {
    if (!data) return '';
    const from = new Date(data.link.from_time);
    const to = new Date(data.link.to_time);
    return `${from.toLocaleDateString()} to ${to.toLocaleDateString()}`;
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent py-10 px-4">
      <div className="hd-app-container space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/35 backdrop-blur-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="h-5 w-fit">
                <BrandLogo className="h-5 w-auto" />
              </div>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{rangeLabel}</p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Read-only report link
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/25 p-5">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                <Clock size={14} /> Tracked Time
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
                Effective Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {data ? `${data.summary.currency} ${data.summary.effective_hourly_rate.toFixed(2)}/h` : '-'}
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
          <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <p className="font-bold text-slate-900 dark:text-white">Sessions</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data ? `${data.entries.length} entries` : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/30">
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Client / Project</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Duration</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Rate</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : !data || data.entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No entries.
                    </td>
                  </tr>
                ) : (
                  data.entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {new Date(e.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{e.client}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{e.project}</p>
                        {data.link.include_details && e.description ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {e.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                        {formatDuration(e.duration_seconds)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {e.currency} {Number(e.hourly_rate || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">
                        {e.currency} {Number(e.earnings || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5" />
            <p>
              This link is read-only. If you did not expect to receive it, you can close this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


