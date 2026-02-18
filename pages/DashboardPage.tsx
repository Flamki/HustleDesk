import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Briefcase, MessageSquare, Clock3, Trophy, Wand2, CheckCircle2 } from 'lucide-react';
import { DashboardStatsResponse, Job } from '../types';
import * as authService from '../services/supabaseService';

const DASHBOARD_CACHE_KEY = 'dashboard_stats_cache_v1';

const emptyStats: DashboardStatsResponse = {
  applications_this_week: 0,
  awaiting_reply: 0,
  active_conversations: 0,
  projects_won: 0,
  total_revenue: 0,
  followups_due: [],
  recent_activity: [],
};

const readCachedStats = (): DashboardStatsResponse | null => {
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardStatsResponse;
  } catch {
    return null;
  }
};

const relativeTime = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const avgWaitDays = (jobs: Job[]) => {
  const applied = jobs.filter((j) => j.status === 'Applied' && j.appliedAt);
  if (applied.length === 0) return 0;
  const total = applied.reduce((sum, j) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(j.appliedAt as string).getTime()) / 86400000));
    return sum + days;
  }, 0);
  return Math.round(total / applied.length);
};

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRange = (() => {
    const r = searchParams.get('range');
    return r === '30d' || r === '90d' ? r : '7d';
  })();

  const [stats, setStats] = useState<DashboardStatsResponse | null>(() => readCachedStats());
  const [loading, setLoading] = useState(() => !readCachedStats());
  const [range, setRange] = useState<'7d' | '30d' | '90d'>(initialRange);

  useEffect(() => {
    const r = searchParams.get('range');
    const next = r === '30d' || r === '90d' ? r : '7d';
    if (next !== range) setRange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (range !== '7d') next.set('range', range);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [range, searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await Promise.race([
          authService.getDashboardStats(range),
          new Promise<{ data: DashboardStatsResponse | null }>((_, reject) =>
            window.setTimeout(() => reject(new Error('Dashboard request timed out')), 9000)
          ),
        ]);
        if (!active) return;
        const next = data ?? emptyStats;
        setStats(next);
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(next));
      } catch {
        if (!active) return;
        setStats((prev) => prev ?? emptyStats);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [range]);

  const followups = stats?.followups_due || [];
  const activity = stats?.recent_activity || [];
  const applicationsChange = useMemo(() => {
    if (!stats) return 0;
    return Math.max(0, Math.floor(stats.applications_this_week / 3));
  }, [stats]);
  const avgWait = useMemo(() => avgWaitDays(followups as Job[]), [followups]);

  if (loading && !stats) {
    return (
      <div className="hd-app-container space-y-6">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hd-app-container space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your pipeline performance at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  range === r
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Link
            to="/app/jobs/new"
            className="hd-btn-primary"
          >
            <Briefcase size={16} /> Add New Job
          </Link>
          <Link
            to="/app/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
          >
            <Wand2 size={16} /> Generate Proposal
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Applications This Week"
          value={stats?.applications_this_week || 0}
          sub={`${applicationsChange >= 0 ? '+' : ''}${applicationsChange} vs last week`}
          tone="indigo"
          icon={<ArrowUpRight size={18} />}
          index={0}
        />
        <StatCard
          title="Awaiting Reply"
          value={stats?.awaiting_reply || 0}
          sub={`${avgWait} days avg`}
          tone="amber"
          icon={<Clock3 size={18} />}
          index={1}
        />
        <StatCard
          title="Active Conversations"
          value={stats?.active_conversations || 0}
          sub="View all"
          tone="blue"
          icon={<MessageSquare size={18} />}
          link="/app/jobs?status=replied"
          index={2}
        />
        <StatCard
          title="Projects Won"
          value={stats?.projects_won || 0}
          sub={`Revenue: ${(stats?.total_revenue || 0).toLocaleString()}`}
          tone="green"
          icon={<Trophy size={18} />}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={`${a.timestamp}-${i}`} className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{a.text}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{relativeTime(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Follow-Ups Due Today</h3>
          {followups.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">No follow-ups due. Great job!</div>
          ) : (
            <div className="space-y-3">
              {followups.map((job) => {
                const sinceApplied = job.appliedAt
                  ? Math.max(0, Math.floor((Date.now() - new Date(job.appliedAt).getTime()) / 86400000))
                  : 0;
                return (
                  <div key={job.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{job.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {job.platform} - {sinceApplied} day{sinceApplied !== 1 ? 's' : ''} since applied
                    </p>
                    <Link
                      to={`/app/proposals/generate/${job.id}`}
                      className="inline-flex mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Send Follow-Up
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const toneClasses: Record<string, { chip: string; icon: string }> = {
  indigo: { chip: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400' },
  amber: { chip: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400' },
  blue: { chip: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
  green: { chip: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
};

const StatCard: React.FC<{
  title: string;
  value: number;
  sub: string;
  tone: keyof typeof toneClasses;
  icon: React.ReactNode;
  link?: string;
  index?: number;
}> = ({ title, value, sub, tone, icon, link, index = 0 }) => {
  const c = toneClasses[tone];
  const content = (
    <div 
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-slide-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${c.chip} flex items-center justify-center transition-transform duration-200 hover:scale-110`}>{icon}</div>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4">{title}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1 transition-all duration-300">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{sub}</p>
    </div>
  );
  return link ? <Link to={link} className="block">{content}</Link> : content;
};
