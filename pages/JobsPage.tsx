import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { JobDetailModal } from '../components/jobs/JobDetailModal';
import { Job, JobStatus } from '../types';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Plus,
  Search,
  Target,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import * as authService from '../services/supabaseService';

const PAGE_SIZE = 20;
const STATUS_TABS: Array<'All' | JobStatus> = ['All', 'Saved', 'Applied', 'Replied', 'Won', 'Lost'];
const PLATFORM_OPTIONS: Array<'all' | 'upwork' | 'fiverr' | 'linkedin' | 'other'> = [
  'all',
  'upwork',
  'fiverr',
  'linkedin',
  'other',
];

const relativeTime = (iso?: string) => {
  if (!iso) return '-';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const formatFollowup = (iso?: string) => {
  if (!iso) return { text: '-', overdue: false };
  const date = new Date(iso);
  const today = new Date();
  const diff = Math.floor((date.setHours(0, 0, 0, 0) - new Date(today.setHours(0, 0, 0, 0)).getTime()) / 86400000);
  if (diff < 0) return { text: 'Overdue', overdue: true };
  return { text: new Date(iso).toLocaleDateString(), overdue: false };
};

const getPlatformBadge = (platform: string) => {
  const p = platform.toLowerCase();
  if (p === 'upwork') return { cls: 'bg-[#14a800]/10 text-[#14a800]' };
  if (p === 'fiverr') return { cls: 'bg-[#1dbf73]/10 text-[#1dbf73]' };
  if (p === 'linkedin') return { cls: 'bg-[#0a66c2]/10 text-[#0a66c2]' };
  return { cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
};

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('jobs_intro_dismissed') !== 'true';
  });

  const dismissIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem('jobs_intro_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const startWithSample = () => {
    const sample = {
      title: 'Landing page redesign (Webflow)',
      platform: 'Upwork',
      company: 'Acme Studio',
      description:
        'We need a modern landing page redesign in Webflow. You will take the existing copy and improve layout, add responsive sections, and optimize for conversions. Please share 2-3 relevant examples and your timeline.',
      budgetMin: '300',
      budgetMax: '800',
      currency: 'USD',
      proposedPrice: '650',
    };
    try {
      localStorage.setItem('job_draft', JSON.stringify(sample));
    } catch {
      // ignore
    }
    navigate('/app/jobs/new?prefill=sample');
  };

  const initialStatus = (() => {
    const s = searchParams.get('status');
    return STATUS_TABS.includes((s as any) || 'All') ? ((s as any) || 'All') : 'All';
  })();
  const initialPlatform = (() => {
    const p = (searchParams.get('platform') || 'all') as any;
    return PLATFORM_OPTIONS.includes(p) ? p : 'all';
  })();
  const initialSort = (() => {
    const sort = searchParams.get('sort');
    return sort === 'oldest' || sort === 'budget_high' ? sort : 'newest';
  })();
  const initialSearch = searchParams.get('search') || '';
  const initialPage = (() => {
    const n = Number(searchParams.get('page') || '1');
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  })();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'All' | JobStatus>(initialStatus);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'upwork' | 'fiverr' | 'linkedin' | 'other'>(initialPlatform);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'budget_high'>(initialSort);
  const [page, setPage] = useState(initialPage);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;

  const cacheKey = useMemo(() => {
    const status = statusFilter === 'All' ? '' : statusFilter.toLowerCase();
    const platform = platformFilter === 'all' ? '' : platformFilter;
    const search = (searchQuery || '').trim().slice(0, 120);
    return `jobs_list_cache_v1:${status}|${platform}|${sortBy}|${page}|${search}`;
  }, [statusFilter, platformFilter, sortBy, page, searchQuery]);

  useEffect(() => {
    let active = true;
    const loadJobs = async () => {
      // Local-first: render cached data immediately, then refresh in the background.
      let hadCache = false;
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as { jobs: Job[]; total: number; ts: number };
          if (cached && Array.isArray(cached.jobs)) {
            hadCache = true;
            setJobs(cached.jobs);
            setTotal(Number.isFinite(cached.total) ? cached.total : 0);
            setLoading(false);
            setRefreshing(true);
          }
        }
      } catch {
        // ignore cache issues
      }

      if (!hadCache) setLoading(true);
      const { data, error } = await authService.getJobsList({
        status: statusFilter === 'All' ? undefined : statusFilter.toLowerCase() as any,
        platform: platformFilter === 'all' ? undefined : platformFilter,
        limit: PAGE_SIZE,
        offset,
        search: searchQuery || undefined,
      });

      if (!active) return;
      if (error) {
        setJobs([]);
        setTotal(0);
      } else {
        let list = [...data.jobs];
        if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (sortBy === 'budget_high') list.sort((a, b) => (b.budgetMax || b.budgetMin || 0) - (a.budgetMax || a.budgetMin || 0));
        setJobs(list);
        setTotal(data.total);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ jobs: list, total: data.total, ts: Date.now() }));
        } catch {
          // ignore cache write failures
        }
      }
      setLoading(false);
      setRefreshing(false);
    };
    void loadJobs();
    return () => {
      active = false;
    };
  }, [statusFilter, platformFilter, searchQuery, offset, sortBy, cacheKey]);

  useEffect(() => {
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const pageParam = searchParams.get('page');

    const nextStatus = STATUS_TABS.includes((status as any) || 'All') ? ((status as any) || 'All') : 'All';
    const nextPlatform = PLATFORM_OPTIONS.includes((platform as any) || 'all') ? ((platform as any) || 'all') : 'all';
    const nextSort = sort === 'oldest' || sort === 'budget_high' ? sort : 'newest';
    const nextSearch = search || '';
    const parsedPage = Number(pageParam || '1');
    const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

    if (nextStatus !== statusFilter) setStatusFilter(nextStatus);
    if (nextPlatform !== platformFilter) setPlatformFilter(nextPlatform);
    if (nextSort !== sortBy) setSortBy(nextSort);
    if (nextSearch !== searchQuery) setSearchQuery(nextSearch);
    if (nextPage !== page) setPage(nextPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (statusFilter !== 'All') next.set('status', statusFilter);
    if (platformFilter !== 'all') next.set('platform', platformFilter);
    if (searchQuery.trim()) next.set('search', searchQuery.trim());
    if (sortBy !== 'newest') next.set('sort', sortBy);
    if (page > 1) next.set('page', String(page));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [statusFilter, platformFilter, searchQuery, sortBy, page, searchParams, setSearchParams]);

  const getStatusBadgeVariant = (status: JobStatus) => {
    if (status === 'Saved') return 'neutral';
    if (status === 'Applied') return 'blue';
    if (status === 'Replied') return 'purple';
    if (status === 'Won') return 'success';
    return 'danger';
  };

  const deleteJob = async (job: Job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    const { error } = await authService.deleteJob(job.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    setTotal((t) => Math.max(0, t - 1));
  };

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div className="hd-app-container space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Jobs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            Track applications and keep follow-ups on time.
            {refreshing && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500/70 animate-pulse" />
                Updating
              </span>
            )}
          </p>
        </div>
        <Link
          to="/app/jobs/new"
          className="hd-btn-primary px-6 py-3"
        >
          <Plus size={20} /> Add Job
        </Link>
      </div>

      {showIntro && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/35 backdrop-blur-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                Quick start workflow
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Save jobs first, then move status to get follow-ups and analytics.
              </p>
            </div>
            <button
              onClick={dismissIntro}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Dismiss"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/30 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">1. Save</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-500" /> Add a job
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Paste the description so proposals and insights work later.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/30 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">2. Apply</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRight size={16} className="text-emerald-500" /> Change status
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Move from Saved to Applied so follow-ups and stats start.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/30 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">3. Win</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" /> Track outcomes
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Won and Lost close the loop and improve your analytics.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link to="/app/jobs/new" className="hd-btn-primary px-5 py-2.5">
              <Plus size={18} /> Create first job
            </Link>
            <button
              onClick={startWithSample}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 text-slate-900 dark:text-white transition-colors"
              title="Create a sample draft job"
            >
              <Wand2 size={18} className="text-indigo-500" /> Try sample job
            </button>
            <button
              onClick={dismissIntro}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusFilter === status
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {status}
            {statusFilter === status ? ` (${total})` : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search title or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => {
            setPlatformFilter(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Platforms</option>
          <option value="upwork">Upwork</option>
          <option value="fiverr">Fiverr</option>
          <option value="linkedin">LinkedIn</option>
          <option value="other">Other</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="budget_high">Budget high-low</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Platform</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Budget</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Applied Date</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Follow-Up</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Loading jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Briefcase size={28} />
                      </div>
                      <p className="text-slate-900 dark:text-white font-semibold">No jobs yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Start by adding your first opportunity.</p>
                      <Link to="/app/jobs/new" className="mt-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        Add Your First Job
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const p = getPlatformBadge(job.platform);
                  const followup = formatFollowup(job.followUpAt);
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 text-left"
                          onClick={() => {
                            setSelectedJob(job);
                            setIsEditMode(false);
                          }}
                        >
                          {job.title}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${p.cls}`}>
                          <span className="w-5 h-5 rounded-full bg-white/70 dark:bg-slate-900/50 flex items-center justify-center">
                            <PlatformIcon platform={job.platform} className="w-3.5 h-3.5" />
                          </span>
                          {job.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {job.budgetMin || job.budgetMax ? `${job.currency} ${job.budgetMin ?? '-'}${job.budgetMax ? ` - ${job.budgetMax}` : ''}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(job.status)}>{job.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{relativeTime(job.appliedAt)}</td>
                      <td className={`px-4 py-3 ${followup.overdue ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {followup.text}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setIsEditMode(false);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setIsEditMode(true);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              void deleteJob(job);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {jobs.length === 0 ? 0 : offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  page === n
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={!!selectedJob}
          initialIsEditing={isEditMode}
          onClose={() => {
            setSelectedJob(null);
            setIsEditMode(false);
          }}
          onSave={(updatedJob) => {
            void authService.updateJob(updatedJob.id, updatedJob);
            setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
            setSelectedJob(updatedJob);
            setIsEditMode(false);
          }}
          onDelete={() => {
            void deleteJob(selectedJob);
            setSelectedJob(null);
          }}
          onGenerateProposal={(jobId) => navigate(`/app/proposals/generate/${jobId}`)}
        />
      )}
    </div>
  );
};
