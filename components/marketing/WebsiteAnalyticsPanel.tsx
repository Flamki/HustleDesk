import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Clock3, Eye, MousePointerClick, TrendingUp, Users } from 'lucide-react';
import { fetchWebsiteAnalytics, type WebsiteAnalyticsResponse } from '../../services/marketingWebsiteService';

type SiteLike = { id: string; slug: string; name: string };

const fmtInt = (n: number) => new Intl.NumberFormat().format(Math.round(n || 0));
const fmtPct = (n: number) => `${(n || 0).toFixed(2)}%`;
const fmtDuration = (sec: number) => {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
};

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  dotClass: string;
}> = ({ label, value, icon, dotClass }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
    </div>
    <div className="mt-2 flex items-end justify-between gap-3">
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-slate-400">{icon}</div>
    </div>
  </div>
);

const BreakdownCard: React.FC<{ title: string; rows: Array<{ label: string; value: number }> }> = ({ title, rows }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
    <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
    <div className="mt-3 space-y-2">
      {rows.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">No data</div> : null}
      {rows.map((r) => (
        <div key={`${title}-${r.label}`} className="flex items-center justify-between gap-2 text-sm">
          <div className="truncate text-slate-700 dark:text-slate-300">{r.label}</div>
          <div className="font-semibold text-slate-900 dark:text-white">{fmtInt(r.value)}</div>
        </div>
      ))}
    </div>
  </div>
);

const MultiLineChart: React.FC<{ data: WebsiteAnalyticsResponse['series'] }> = ({ data }) => {
  const w = 980;
  const h = 280;
  const pad = 26;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;
  const maxY = Math.max(
    1,
    ...data.map((d) => d.unique_visitors),
    ...data.map((d) => d.page_views),
    ...data.map((d) => d.sessions),
    ...data.map((d) => d.signups)
  );
  const x = (i: number) => pad + (i / Math.max(1, data.length - 1)) * chartW;
  const y = (v: number) => pad + chartH - (v / maxY) * chartH;
  const mkPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold text-slate-900 dark:text-white">Trend</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Visitors, views, sessions, signups</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[280px]">
        <rect x={0} y={0} width={w} height={h} fill="transparent" />
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1={pad} x2={w - pad} y1={pad + chartH * r} y2={pad + chartH * r} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth={1} />
        ))}
        <path d={mkPath(data.map((d) => d.unique_visitors))} fill="none" stroke="#ec4899" strokeWidth={2} />
        <path d={mkPath(data.map((d) => d.page_views))} fill="none" stroke="#7c3aed" strokeWidth={2} />
        <path d={mkPath(data.map((d) => d.sessions))} fill="none" stroke="#059669" strokeWidth={2} />
        <path d={mkPath(data.map((d) => d.signups))} fill="none" stroke="#f59e0b" strokeWidth={2} />
      </svg>
      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-pink-500" /> Unique visitors</div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-violet-600" /> Page views</div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Sessions</div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-amber-500" /> Signups</div>
      </div>
    </div>
  );
};

export const WebsiteAnalyticsPanel: React.FC<{ site: SiteLike }> = ({ site }) => {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WebsiteAnalyticsResponse | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchWebsiteAnalytics(site.id, days);
      if (!active) return;
      if (error || !data) {
        setError(error?.message || 'Failed to load website analytics');
        setData(null);
      } else {
        setData(data);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [site.id, days]);

  const metrics = useMemo(
    () =>
      data?.metrics || {
        unique_visitors: 0,
        page_views: 0,
        sessions: 0,
        signups: 0,
        bounce_rate: 0,
        avg_session_duration_sec: 0,
        conversion_rate: 0,
      },
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-100/90 via-violet-100/80 to-slate-100 dark:from-indigo-900/30 dark:via-violet-900/20 dark:to-slate-900/20 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">Website analytics</div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Advanced funnel metrics for <span className="font-semibold">{site.name}</span> ({site.slug})
            </div>
          </div>
          <div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 2 weeks</option>
              <option value={28}>Last 4 weeks</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Unique visitors" value={fmtInt(metrics.unique_visitors)} icon={<Users size={16} />} dotClass="bg-pink-500" />
        <StatCard label="Page views" value={fmtInt(metrics.page_views)} icon={<Eye size={16} />} dotClass="bg-violet-600" />
        <StatCard label="Sessions" value={fmtInt(metrics.sessions)} icon={<BarChart3 size={16} />} dotClass="bg-emerald-600" />
        <StatCard label="Bounce rate" value={fmtPct(metrics.bounce_rate)} icon={<TrendingUp size={16} />} dotClass="bg-amber-500" />
        <StatCard label="Session duration" value={fmtDuration(metrics.avg_session_duration_sec)} icon={<Clock3 size={16} />} dotClass="bg-indigo-600" />
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400">
          Loading analytics...
        </div>
      ) : data ? (
        <>
          <MultiLineChart data={data.series} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <BreakdownCard title="Pages" rows={data.breakdowns.pages} />
            <BreakdownCard title="Referrers" rows={data.breakdowns.referrers} />
            <BreakdownCard title="Sources" rows={data.breakdowns.sources} />
            <BreakdownCard title="Countries" rows={data.breakdowns.countries} />
            <BreakdownCard title="Devices" rows={data.breakdowns.devices} />
            <BreakdownCard title="Top links clicked" rows={data.breakdowns.links} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <MousePointerClick size={15} className="text-slate-400" />
              Conversion rate: <span className="font-semibold text-slate-900 dark:text-white">{fmtPct(metrics.conversion_rate)}</span>
              <span className="text-slate-400">({fmtInt(metrics.signups)} signups)</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

