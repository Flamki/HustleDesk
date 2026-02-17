import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { AnalyticsResponse } from '../types';
import { getAnalyticsInsights } from '../services/supabaseService';

type Range = '7d' | '30d' | '90d' | 'ytd';

const prettyRange = (r: Range) => (r === 'ytd' ? 'YTD' : r.toUpperCase());

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<Range>('30d');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: result, error: fetchError } = await getAnalyticsInsights(range);
      if (!active) return;
      if (fetchError || !result) {
        setData(null);
        setError(fetchError?.message || 'Failed to load analytics');
      } else {
        setData(result);
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [range]);

  const trend = data?.trend ?? [];
  const funnel = data?.funnel ?? [];
  const platformPerformance = data?.platform_performance ?? [];
  const insights = data?.insights ?? [];
  const cohortRetention = data?.cohort_retention ?? [];
  const metrics = data?.metrics ?? {
    total_revenue: 0,
    win_rate: 0,
    active_leads: 0,
    tracked_hours: 0,
    effective_hourly_rate: 0,
  };
  const forecast = data?.forecast ?? {
    next_30_days_revenue: 0,
    avg_daily_revenue: 0,
    trend_slope_per_day: 0,
    confidence: 0,
  };

  const maxFunnel = useMemo(() => Math.max(1, ...(funnel.map((f) => f.value) || [1])), [funnel]);
  const maxTrend = useMemo(() => Math.max(1, ...(trend.map((t) => t.revenue) || [1])), [trend]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Data-science style performance insights from jobs and time tracking.
          </p>
        </div>
        <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {(['7d', '30d', '90d', 'ytd'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                range === r
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {prettyRange(r)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Metric title="Total Revenue" value={data ? `$${metrics.total_revenue.toFixed(2)}` : '-'} icon={<DollarSign size={18} />} />
        <Metric title="Win Rate" value={data ? `${metrics.win_rate.toFixed(1)}%` : '-'} icon={<Trophy size={18} />} />
        <Metric title="Active Leads" value={data ? `${metrics.active_leads}` : '-'} icon={<Target size={18} />} />
        <Metric title="Tracked Hours" value={data ? `${metrics.tracked_hours.toFixed(2)}h` : '-'} icon={<Clock size={18} />} />
        <Metric title="Effective Rate" value={data ? `$${metrics.effective_hourly_rate.toFixed(2)}/h` : '-'} icon={<TrendingUp size={18} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Revenue Trend
          </h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading trend...</p>
          ) : !data || trend.length === 0 ? (
            <p className="text-sm text-slate-500">No trend data in this range.</p>
          ) : (
            <div className="flex items-end gap-2 h-56">
              {trend.map((point) => {
                const h = Math.max(6, (point.revenue / maxTrend) * 100);
                return (
                  <div key={point.label} className="flex-1 min-w-0 group">
                    <div className="h-full flex items-end">
                      <div className="w-full rounded-t-md bg-indigo-500/80 hover:bg-indigo-500 transition-colors" style={{ height: `${h}%` }} />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 truncate text-center">{point.label.slice(5)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Funnel</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading funnel...</p>
          ) : !data || funnel.length === 0 ? (
            <p className="text-sm text-slate-500">No data.</p>
          ) : (
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">{f.stage}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{f.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(f.value / maxFunnel) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Platform Performance</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading platforms...</p>
          ) : !data || platformPerformance.length === 0 ? (
            <p className="text-sm text-slate-500">No platform data.</p>
          ) : (
            <div className="space-y-3">
              {platformPerformance
                .sort((a, b) => b.revenue - a.revenue)
                .map((p) => (
                  <div key={p.platform} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 dark:text-white">{p.platform.toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{p.applications} apps</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Win rate {p.win_rate.toFixed(1)}% | Revenue ${p.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4">Model Insights</h3>
          {loading ? (
            <p className="text-sm text-slate-300">Computing insights...</p>
          ) : !data || insights.length === 0 ? (
            <p className="text-sm text-slate-300">Not enough data to generate insights yet.</p>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div key={`${insight.type}-${idx}`} className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="text-xs text-slate-300 mt-1">{insight.detail}</p>
                  <p className="text-[10px] text-indigo-200 mt-2">Confidence {insight.confidence}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Forecast (Next 30 Days)</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Forecasting...</p>
          ) : !data ? (
            <p className="text-sm text-slate-500">No data.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                ${forecast.next_30_days_revenue.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">
                Avg daily revenue: ${forecast.avg_daily_revenue.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">
                Trend slope/day: {forecast.trend_slope_per_day.toFixed(4)}
              </p>
              <p className="text-sm text-slate-500">
                Confidence: {forecast.confidence.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cohort Retention Matrix</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Computing retention...</p>
          ) : !data || cohortRetention.length === 0 ? (
            <p className="text-sm text-slate-500">Not enough client-month history.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-slate-500">Cohort</th>
                    <th className="text-left p-2 text-slate-500">Size</th>
                    {(cohortRetention[0]?.retention ?? []).map((r) => (
                      <th key={r.month} className="text-left p-2 text-slate-500">{r.month.slice(5)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortRetention.map((row) => (
                    <tr key={row.cohort_month} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-2 font-semibold text-slate-900 dark:text-white">{row.cohort_month}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">{row.cohort_size}</td>
                      {(row.retention ?? []).map((r) => (
                        <td key={`${row.cohort_month}-${r.month}`} className="p-2">
                          <span
                            className="inline-flex min-w-10 justify-center px-2 py-1 rounded-md text-[10px] font-semibold"
                            style={{
                              background: `rgba(99,102,241,${Math.max(0.08, r.rate / 120)})`,
                              color: r.rate > 40 ? '#111827' : '#4b5563',
                            }}
                          >
                            {r.rate.toFixed(0)}%
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-xs uppercase tracking-wide text-slate-500 mt-3">{title}</p>
    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);
