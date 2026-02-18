import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  Info,
  Pause,
  Play,
  Plus,
  Square,
  Trash2,
  Link2,
  ExternalLink,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Job, TimeEntry } from '../types';
import { TimeEntryShareLink } from '../types';
import { getJobsList } from '../services/supabaseService';
import {
  createTimeEntry,
  deleteTimeEntry,
  listTimeEntries,
} from '../services/timeTrackerService';
import {
  createTimeEntryShareLink,
  listTimeEntryShareLinks,
  revokeTimeEntryShareLink,
} from '../services/timeEntryShareService';
import { copyTextToClipboard } from '../utils/clipboard';
import { ConfirmDialog, useToast } from '../components/ui';

type Period = 'today' | 'week' | 'month';
type TimerStatus = 'idle' | 'running' | 'paused';

type TimerDraft = {
  status: TimerStatus;
  startedAt: string | null;
  pausedAt: string | null;
  pausedSeconds: number;
  client: string;
  project: string;
  description: string;
  hourlyRate: number;
  currency: string;
  jobId?: string;
};

const TIMER_DRAFT_KEY = 'time_tracker_active_draft_v1';

const initialDraft: TimerDraft = {
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  pausedSeconds: 0,
  client: '',
  project: '',
  description: '',
  hourlyRate: 25,
  currency: 'USD',
  jobId: undefined,
};

const readDraft = (): TimerDraft => {
  const raw = localStorage.getItem(TIMER_DRAFT_KEY);
  if (!raw) return initialDraft;
  try {
    const parsed = JSON.parse(raw) as TimerDraft;
    return { ...initialDraft, ...parsed };
  } catch {
    return initialDraft;
  }
};

const writeDraft = (draft: TimerDraft) => {
  localStorage.setItem(TIMER_DRAFT_KEY, JSON.stringify(draft));
};

const getPeriodRange = (period: Period) => {
  const now = new Date();
  const from = new Date(now);
  if (period === 'week') from.setDate(now.getDate() - 7);
  else if (period === 'month') from.setDate(now.getDate() - 30);
  else from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: now.toISOString() };
};

const dayKey = (iso: string) => {
  // Stable cache key component (changes daily, not every refresh).
  return String(iso || '').slice(0, 10) || 'unknown';
};

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const durationBetween = (startIso: string, endIso: string) => {
  return Math.max(0, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
};

const earningsFor = (seconds: number, hourlyRate: number) => {
  const amount = (seconds / 3600) * Math.max(0, hourlyRate || 0);
  return Math.round(amount * 100) / 100;
};

const dateInputValue = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const timeInputValue = (date: Date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const TimeTrackerPage: React.FC = () => {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [draft, setDraft] = useState<TimerDraft>(() => readDraft());
  const [nowTick, setNowTick] = useState(Date.now());

  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareIncludeDetails, setShareIncludeDetails] = useState(true);
  const [shareExpiresDays, setShareExpiresDays] = useState<number>(14);
  const [shareForceNew, setShareForceNew] = useState(false);
  const [shareEntry, setShareEntry] = useState<TimeEntry | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareLinks, setShareLinks] = useState<TimeEntryShareLink[]>([]);
  const [selectedShareLinkId, setSelectedShareLinkId] = useState<string>('');
  
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkToRevoke, setLinkToRevoke] = useState<TimeEntryShareLink | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const [manualDate, setManualDate] = useState(() => dateInputValue(new Date()));
  const [manualStart, setManualStart] = useState(() => timeInputValue(new Date(Date.now() - 3600 * 1000)));
  const [manualEnd, setManualEnd] = useState(() => timeInputValue(new Date()));
  const [manualClient, setManualClient] = useState('');
  const [manualProject, setManualProject] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualRate, setManualRate] = useState(25);
  const [manualCurrency, setManualCurrency] = useState('USD');
  const [manualJobId, setManualJobId] = useState('');

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);

  const entriesCacheKey = useMemo(
    () => `time_entries_cache_v1:${period}:${dayKey(from)}:${dayKey(to)}`,
    [period, from, to]
  );
  const jobsCacheKey = useMemo(() => `jobs_picker_cache_v1`, []);

  useEffect(() => {
    writeDraft(draft);
  }, [draft]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!shareNotice) return;
    const id = window.setTimeout(() => setShareNotice(null), 3500);
    return () => window.clearTimeout(id);
  }, [shareNotice]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // Local-first: render cached entries immediately, refresh in background.
      // Important: do NOT set loading=false just because jobs cache exists; that causes a "No entries" flash.
      let hasEntriesCache = false;
      try {
        const rawEntries = localStorage.getItem(entriesCacheKey);
        if (rawEntries) {
          const cached = JSON.parse(rawEntries) as { entries: TimeEntry[]; ts: number };
          if (cached && Array.isArray(cached.entries)) {
            hasEntriesCache = true;
            setEntries(cached.entries);
          }
        }
      } catch {
        // ignore
      }

      try {
        const rawJobs = localStorage.getItem(jobsCacheKey);
        if (rawJobs) {
          const cached = JSON.parse(rawJobs) as { jobs: Job[]; ts: number };
          if (cached && Array.isArray(cached.jobs)) {
            setJobs(cached.jobs);
          }
        }
      } catch {
        // ignore
      }

      if (hasEntriesCache) {
        setLoading(false);
        setRefreshing(true);
      } else {
        setLoading(true);
        setRefreshing(false);
      }
      setError(null);

      const [entriesResult, jobsResult] = await Promise.all([
        listTimeEntries({ from, to, limit: 500, offset: 0 }),
        getJobsList({ limit: 200, offset: 0 }),
      ]);

      if (!active) return;
      if (entriesResult.error) {
        setError(entriesResult.error.message);
        setEntries([]);
      } else {
        setEntries(entriesResult.data.entries);
        try {
          localStorage.setItem(entriesCacheKey, JSON.stringify({ entries: entriesResult.data.entries, ts: Date.now() }));
        } catch {
          // ignore
        }
      }

      if (!jobsResult.error) {
        setJobs(jobsResult.data.jobs);
        try {
          localStorage.setItem(jobsCacheKey, JSON.stringify({ jobs: jobsResult.data.jobs, ts: Date.now() }));
        } catch {
          // ignore
        }
      }

      setLoading(false);
      setRefreshing(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [from, to, entriesCacheKey, jobsCacheKey]);

  const runningSeconds = useMemo(() => {
    if (draft.status === 'idle' || !draft.startedAt) return 0;
    if (draft.status === 'paused' && draft.pausedAt) {
      return Math.max(0, durationBetween(draft.startedAt, draft.pausedAt) - draft.pausedSeconds);
    }
    return Math.max(0, durationBetween(draft.startedAt, new Date(nowTick).toISOString()) - draft.pausedSeconds);
  }, [draft, nowTick]);

  const runningEarnings = useMemo(
    () => earningsFor(runningSeconds, draft.hourlyRate),
    [runningSeconds, draft.hourlyRate]
  );

  const summary = useMemo(() => {
    const trackedSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0) + runningSeconds;
    const totalEarnings = entries.reduce((sum, e) => sum + e.earnings, 0) + runningEarnings;
    const avgRate = trackedSeconds > 0 ? totalEarnings / (trackedSeconds / 3600) : 0;
    return { trackedSeconds, totalEarnings, avgRate };
  }, [entries, runningSeconds, runningEarnings]);

  const byClient = useMemo(() => {
    const map = new Map<string, { seconds: number; earnings: number }>();
    for (const entry of entries) {
      const key = entry.client;
      const current = map.get(key) || { seconds: 0, earnings: 0 };
      current.seconds += entry.durationSeconds;
      current.earnings += entry.earnings;
      map.set(key, current);
    }
    if (draft.status !== 'idle' && draft.client && runningSeconds > 0) {
      const current = map.get(draft.client) || { seconds: 0, earnings: 0 };
      current.seconds += runningSeconds;
      current.earnings += runningEarnings;
      map.set(draft.client, current);
    }
    return [...map.entries()].sort((a, b) => b[1].seconds - a[1].seconds);
  }, [entries, draft.status, draft.client, runningSeconds, runningEarnings]);

  const setJobFieldsFromId = (jobId: string, forManual = false) => {
    const found = jobs.find((j) => j.id === jobId);
    if (!found) return;
    const client = found.company?.trim() || found.platform;
    const project = found.title;
    if (forManual) {
      setManualClient(client);
      setManualProject(project);
    } else {
      setDraft((prev) => ({ ...prev, client, project, jobId: found.id }));
    }
  };

  const canStart = draft.client.trim() && draft.project.trim() && draft.hourlyRate >= 0;

  const startTimer = () => {
    if (!canStart) return;
    const nowIso = new Date().toISOString();
    setDraft((prev) => ({
      ...prev,
      status: 'running',
      startedAt: nowIso,
      pausedAt: null,
      pausedSeconds: 0,
    }));
  };

  const pauseTimer = () => {
    setDraft((prev) => {
      if (prev.status !== 'running') return prev;
      return { ...prev, status: 'paused', pausedAt: new Date().toISOString() };
    });
  };

  const resumeTimer = () => {
    setDraft((prev) => {
      if (prev.status !== 'paused' || !prev.pausedAt) return prev;
      const pausedDelta = durationBetween(prev.pausedAt, new Date().toISOString());
      return {
        ...prev,
        status: 'running',
        pausedAt: null,
        pausedSeconds: prev.pausedSeconds + pausedDelta,
      };
    });
  };

  const resetDraftFields = () => {
    setDraft((prev) => ({
      ...initialDraft,
      client: prev.client,
      project: prev.project,
      hourlyRate: prev.hourlyRate || 25,
      currency: prev.currency || 'USD',
      jobId: prev.jobId,
    }));
  };

  const stopTimer = async () => {
    if (!draft.startedAt) return;
    const endIso = new Date().toISOString();
    const seconds = Math.max(0, durationBetween(draft.startedAt, endIso) - draft.pausedSeconds);
    if (seconds <= 0) {
      setError('Tracked duration is zero. Let the timer run for at least a second.');
      return;
    }

    setBusy(true);
    setError(null);
    const payload = {
      jobId: draft.jobId,
      client: draft.client.trim(),
      project: draft.project.trim(),
      description: draft.description.trim(),
      startTime: draft.startedAt,
      endTime: endIso,
      durationSeconds: seconds,
      hourlyRate: draft.hourlyRate,
      currency: draft.currency,
      earnings: earningsFor(seconds, draft.hourlyRate),
    };
    const { data, error: createError } = await createTimeEntry(payload);
    setBusy(false);

    if (createError || !data) {
      setError(createError?.message || 'Failed to save time entry.');
      return;
    }

    setEntries((prev) => [data, ...prev]);
    resetDraftFields();
    localStorage.removeItem(TIMER_DRAFT_KEY);
    setNotice({ kind: 'success', text: 'Time entry saved.' });
  };

  const addManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const startIso = new Date(`${manualDate}T${manualStart}`).toISOString();
    const endIso = new Date(`${manualDate}T${manualEnd}`).toISOString();
    const seconds = durationBetween(startIso, endIso);
    if (!manualClient.trim() || !manualProject.trim()) {
      setError('Manual entry requires client and project.');
      return;
    }
    if (seconds <= 0) {
      setError('Manual end time must be after start time.');
      return;
    }

    setBusy(true);
    setError(null);
    const { data, error: createError } = await createTimeEntry({
      jobId: manualJobId || undefined,
      client: manualClient.trim(),
      project: manualProject.trim(),
      description: manualDescription.trim(),
      startTime: startIso,
      endTime: endIso,
      durationSeconds: seconds,
      hourlyRate: manualRate,
      currency: manualCurrency,
      earnings: earningsFor(seconds, manualRate),
    });
    setBusy(false);

    if (createError || !data) {
      setError(createError?.message || 'Failed to add manual entry.');
      return;
    }

    setEntries((prev) => [data, ...prev]);
    setManualOpen(false);
    setManualDescription('');
    setNotice({ kind: 'success', text: 'Manual entry saved.' });
  };

  const removeEntry = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    const { error: deleteError } = await deleteTimeEntry(entryToDelete.id);
    setIsDeleting(false);
    setEntryToDelete(null);
    
    if (deleteError) {
      showToast({
        variant: 'error',
        title: 'Failed to delete entry',
        message: deleteError.message,
      });
      return;
    }
    
    setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
    showToast({
      variant: 'success',
      message: 'Time entry deleted successfully',
    });
  };

  const shareUrlFor = (token: string) => `${window.location.origin}/share/time-entry/${token}`;

  const expiryIsoForDays = (days: number) => {
    if (!days || days <= 0) return null;
    const target = new Date();
    target.setDate(target.getDate() + days);
    const y = target.getUTCFullYear();
    const m = target.getUTCMonth();
    const d = target.getUTCDate();
    return new Date(Date.UTC(y, m, d, 23, 59, 59, 0)).toISOString();
  };

  const isActiveLink = (link: TimeEntryShareLink) => {
    if (link.revokedAt) return false;
    if (!link.expiresAt) return true;
    return new Date(link.expiresAt).getTime() > Date.now();
  };

  const isSameSettings = (link: TimeEntryShareLink, includeDetails: boolean, expiresAt: string | null) => {
    if (link.includeDetails !== includeDetails) return false;
    const a = link.expiresAt || null;
    return a === expiresAt;
  };

  const selectShareLink = (link: TimeEntryShareLink | null) => {
    if (!link) {
      setSelectedShareLinkId('');
      setShareUrl('');
      setShareCopied(false);
      return;
    }
    setSelectedShareLinkId(link.id);
    setShareUrl(shareUrlFor(link.token));
    setShareCopied(false);
  };

  const openShareFor = async (entry: TimeEntry) => {
    setShareEntry(entry);
    setShareIncludeDetails(true);
    setShareExpiresDays(14);
    setShareForceNew(false);
    setShareUrl('');
    setShareError(null);
    setShareNotice(null);
    setShareCopied(false);
    setShareLinks([]);
    setSelectedShareLinkId('');
    setShareOpen(true);

    setShareLoading(true);
    const { data, error } = await listTimeEntryShareLinks(entry.id);
    setShareLoading(false);
    if (error) {
      setShareError(error.message);
      return;
    }
    setShareLinks(data);

    const preferred =
      data.find((l) => isActiveLink(l) && l.includeDetails === true) ||
      data.find((l) => isActiveLink(l));
    selectShareLink(preferred ?? null);
  };

  const createShare = async () => {
    if (!shareEntry) return;
    setShareBusy(true);
    setShareError(null);
    setShareNotice(null);
    setShareCopied(false);

    const expiresAt = expiryIsoForDays(shareExpiresDays);

    // Client-side guard: if a matching active link already exists, reuse it unless forced.
    if (!shareForceNew) {
      const existing = shareLinks.find((l) => isActiveLink(l) && isSameSettings(l, shareIncludeDetails, expiresAt));
      if (existing) {
        selectShareLink(existing);
        setShareBusy(false);
        setShareNotice({ kind: 'info', text: 'Existing link selected. Use Copy to copy it.' });
        return;
      }
    }

    const { data, error: createError } = await createTimeEntryShareLink({
      timeEntryId: shareEntry.id,
      includeDetails: shareIncludeDetails,
      expiresAt,
      forceNew: shareForceNew,
    });

    if (createError || !data) {
      setShareBusy(false);
      setShareError(createError?.message || 'Failed to create share link');
      return;
    }

    setShareLinks((prev) => [data, ...prev]);
    selectShareLink(data);
    setShareNotice({ kind: 'success', text: shareForceNew ? 'New link created. Use Copy to copy it.' : 'Link ready. Use Copy to copy it.' });

    setShareBusy(false);
  };

  const revokeShare = async () => {
    if (!linkToRevoke) return;
    setIsRevoking(true);
    const { data, error } = await revokeTimeEntryShareLink(linkToRevoke.id);
    setIsRevoking(false);
    setLinkToRevoke(null);
    
    if (error || !data) {
      showToast({
        variant: 'error',
        title: 'Failed to revoke link',
        message: error?.message || 'Failed to revoke link.',
      });
      return;
    }

    setShareLinks((prev) => prev.map((l) => (l.id === linkToRevoke.id ? data : l)));
    if (selectedShareLinkId === linkToRevoke.id) {
      setShareUrl('');
      setSelectedShareLinkId('');
      setShareCopied(false);
    }
    showToast({
      variant: 'info',
      message: 'Share link revoked successfully',
    });
  };

  return (
    <div className="hd-app-container space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Time Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            Track billable hours, earnings, and client profitability.
            {refreshing && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400/70 dark:bg-slate-500/70 animate-pulse" />
                Updating
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                period === p
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setManualOpen((v) => !v)}
            className="hd-btn-primary px-4 py-2"
          >
            <Plus size={16} /> Manual Entry
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-sm flex items-center gap-2 ${
            notice.kind === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-200'
              : notice.kind === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300'
                : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
          }`}
        >
          {notice.kind === 'success' ? <CheckCircle2 size={16} /> : notice.kind === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
          <span className="font-semibold">{notice.text}</span>
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShareOpen(false)}
          />
          <div className="absolute inset-x-4 top-10 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[900px]">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">Share Session</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Creates a read-only link for this specific session.
                  </p>
                </div>
                <button
                  onClick={() => setShareOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                  title="Close"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {shareNotice && (
                  <div
                    className={`px-4 py-3 rounded-xl border text-sm flex items-center gap-2 ${
                      shareNotice.kind === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                        : shareNotice.kind === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300'
                          : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {shareNotice.kind === 'success' ? <CheckCircle2 size={16} /> : shareNotice.kind === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
                    <span className="font-semibold">{shareNotice.text}</span>
                  </div>
                )}

                {shareError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-300">
                    {shareError}
                  </div>
                )}

                {shareEntry ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Session</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                      {shareEntry.client} | {shareEntry.project}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(shareEntry.startTime).toLocaleString()} to {new Date(shareEntry.endTime).toLocaleString()}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Saved links</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Reuse an existing link, or create a new one with different settings.
                      </p>
                    </div>
                    {shareLoading ? (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Loader2 size={14} className="animate-spin" /> Loading
                      </span>
                    ) : null}
                  </div>

                  {shareLinks.length === 0 && !shareLoading ? (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      No saved links yet for this session.
                    </div>
                  ) : null}

                  {shareLinks.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {shareLinks.slice(0, 6).map((link) => {
                        const active = isActiveLink(link);
                        const expiresLabel = link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never';
                        return (
                          <div
                            key={link.id}
                            className={`rounded-xl border px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${
                              selectedShareLinkId === link.id
                                ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-900/10'
                                : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/20'
                            }`}
                          >
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="selectedShareLink"
                                checked={selectedShareLinkId === link.id}
                                onChange={() => selectShareLink(link)}
                                className="mt-1"
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {link.includeDetails ? 'Description visible' : 'Description hidden'}
                                  </span>
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                      active
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    {active ? 'Active' : link.revokedAt ? 'Revoked' : 'Expired'}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Expires: {expiresLabel}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Created {new Date(link.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </label>

                            <div className="flex items-center gap-2 md:justify-end">
                              <button
                                onClick={async () => {
                                  const url = shareUrlFor(link.token);
                                  const copied = await copyTextToClipboard(url);
                                  if (copied.ok) {
                                    setShareCopied(true);
                                    setShareNotice({ kind: 'success', text: 'Link copied.' });
                                  } else {
                                    setShareCopied(false);
                                    setShareNotice({ kind: 'info', text: 'Copy not available. Select and copy manually.' });
                                  }
                                }}
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 text-slate-900 dark:text-white text-sm font-bold"
                              >
                                Copy
                              </button>
                              <a
                                href={shareUrlFor(link.token)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 text-slate-900 dark:text-white text-sm font-bold inline-flex items-center gap-2"
                              >
                                <ExternalLink size={16} /> Open
                              </a>
                              <button
                                onClick={() => setLinkToRevoke(link)}
                                className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-200 text-sm font-bold"
                                aria-label="Revoke share link"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                      Expires (days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={shareExpiresDays}
                      onChange={(e) => setShareExpiresDays(Number(e.target.value || 0))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Set to 0 for no expiry.
                    </p>
                  </div>

                  <div className="md:col-span-5">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={shareIncludeDetails}
                        onChange={(e) => setShareIncludeDetails(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700"
                      />
                      Include task descriptions
                    </label>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Turn this off to hide the task description in the shared link.
                    </p>
                    <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={shareForceNew}
                        onChange={(e) => setShareForceNew(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700"
                      />
                      Always create a new link
                    </label>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      If off, we reuse an existing active link with the same settings.
                    </p>
                  </div>

                  <div className="md:col-span-3 flex md:justify-end">
                    <button
                      onClick={() => {
                        void createShare();
                      }}
                      disabled={shareBusy}
                      className="hd-btn-primary px-5 py-2.5 disabled:opacity-60"
                    >
                      {shareBusy ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
                      {shareBusy ? 'Creating...' : 'Create new link'}
                    </button>
                  </div>
                </div>

                {shareUrl ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/25 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Link</p>
                      <input
                        value={shareUrl}
                        readOnly
                        onFocus={(e) => e.currentTarget.select()}
                        className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/30 text-slate-900 dark:text-white text-sm font-mono"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Tip: click the field to select the full link.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          const copied = await copyTextToClipboard(shareUrl);
                          if (copied.ok) {
                            setShareCopied(true);
                            setShareNotice({ kind: 'success', text: 'Link copied.' });
                          } else {
                            setShareCopied(false);
                            setShareNotice({ kind: 'info', text: 'Copy not available. Select and copy manually.' });
                          }
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 text-slate-900 dark:text-white text-sm font-bold"
                      >
                        {shareCopied ? 'Copied' : 'Copy'}
                      </button>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 text-slate-900 dark:text-white text-sm font-bold inline-flex items-center gap-2"
                      >
                        <ExternalLink size={16} /> Open
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Tracked Time</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatDuration(summary.trackedSeconds)}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Earnings</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {draft.currency} {summary.totalEarnings.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Effective Hourly Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {draft.currency} {summary.avgRate.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <select
            value={draft.jobId || ''}
            onChange={(e) => {
              const jobId = e.target.value;
              if (!jobId) {
                setDraft((prev) => ({ ...prev, jobId: undefined }));
                return;
              }
              setJobFieldsFromId(jobId);
            }}
            className="lg:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            disabled={draft.status !== 'idle'}
          >
            <option value="">Select job (optional)</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <input
            value={draft.client}
            onChange={(e) => setDraft((prev) => ({ ...prev, client: e.target.value }))}
            placeholder="Client"
            disabled={draft.status !== 'idle'}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
          />
          <input
            value={draft.project}
            onChange={(e) => setDraft((prev) => ({ ...prev, project: e.target.value }))}
            placeholder="Project"
            disabled={draft.status !== 'idle'}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.hourlyRate}
            onChange={(e) => setDraft((prev) => ({ ...prev, hourlyRate: Number(e.target.value || 0) }))}
            placeholder="Hourly rate"
            disabled={draft.status !== 'idle'}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
          />
          <select
            value={draft.currency}
            onChange={(e) => setDraft((prev) => ({ ...prev, currency: e.target.value }))}
            disabled={draft.status !== 'idle'}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <textarea
          value={draft.description}
          onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Task description"
          disabled={draft.status !== 'idle'}
          rows={2}
          className="w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
        />

        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-mono text-4xl font-bold text-slate-900 dark:text-white">{formatDuration(runningSeconds)}</div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Live Earnings: {draft.currency} {runningEarnings.toFixed(2)}
          </div>
          <div className="flex items-center gap-2">
            {draft.status === 'idle' && (
              <button
                onClick={startTimer}
                disabled={!canStart || busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-60"
              >
                <Play size={16} /> Start
              </button>
            )}
            {draft.status === 'running' && (
              <>
                <button
                  onClick={pauseTimer}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  <Pause size={16} /> Pause
                </button>
                <button
                  onClick={() => {
                    void stopTimer();
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Square size={16} /> Stop
                </button>
              </>
            )}
            {draft.status === 'paused' && (
              <>
                <button
                  onClick={resumeTimer}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  <Play size={16} /> Resume
                </button>
                <button
                  onClick={() => {
                    void stopTimer();
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Square size={16} /> Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {manualOpen && (
        <form
          onSubmit={(e) => {
            void addManualEntry(e);
          }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Manual Time Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={manualJobId}
              onChange={(e) => {
                const jobId = e.target.value;
                setManualJobId(jobId);
                if (jobId) setJobFieldsFromId(jobId, true);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            >
              <option value="">Select job (optional)</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <input
              value={manualClient}
              onChange={(e) => setManualClient(e.target.value)}
              placeholder="Client"
              required
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
            />
            <input
              value={manualProject}
              onChange={(e) => setManualProject(e.target.value)}
              placeholder="Project"
              required
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
            />
            <input
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Task description"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
            />
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              required
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            />
            <input
              type="time"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
              required
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            />
            <input
              type="time"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
              required
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                value={manualRate}
                onChange={(e) => setManualRate(Number(e.target.value || 0))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              />
              <select
                value={manualCurrency}
                onChange={(e) => setManualCurrency(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60"
            >
              Save Manual Entry
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Tracked Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Client / Project</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Duration</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Rate</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Earnings</th>
                  <th className="text-right px-4 py-3 text-slate-500 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Loading entries...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No entries in this period.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {new Date(entry.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{entry.client}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{entry.project}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{formatDuration(entry.durationSeconds)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {entry.currency} {entry.hourlyRate.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {entry.currency} {entry.earnings.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openShareFor(entry)}
                          className="inline-flex p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 mr-1"
                          title="Share session"
                          aria-label="Share session"
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEntryToDelete(entry);
                          }}
                          className="inline-flex p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <DollarSign size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Client Profitability</h3>
          </div>
          <div className="p-4 space-y-3">
            {byClient.length === 0 ? (
              <p className="text-sm text-slate-500">No client data yet.</p>
            ) : (
              byClient.map(([client, stats]) => (
                <div key={client} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{client}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDuration(stats.seconds)}</span>
                    <span>
                      {draft.currency} {stats.earnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={removeEntry}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
      />

      <ConfirmDialog
        isOpen={!!linkToRevoke}
        onClose={() => setLinkToRevoke(null)}
        onConfirm={revokeShare}
        title="Revoke Share Link"
        message="Are you sure you want to revoke this link? Anyone with it will lose access."
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        variant="warning"
        loading={isRevoking}
      />
    </div>
  );
};
