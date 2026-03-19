import {
  AnalyticsResponse,
  AuthResponse,
  ClientsInsightsResponse,
  DashboardActivity,
  DashboardStatsResponse,
  FreelancerProfile,
  Job,
  JobsListQuery,
  JobsListResponse,
  JobStatus,
  User,
} from '../types';
import { MOCK_DELAY_MS } from '../constants';
import { getAuthBaseUrl, getSupabaseBaseUrl, hasSupabase, supabase } from './supabaseClient';

const AUTH_STORAGE_KEY = 'user_session';
const PROFILE_STORAGE_KEY = 'freelancer_profile';
const JOBS_STORAGE_KEY = 'jobs_store_v1';
const JOBS_LIST_CACHE_TTL_MS = 15_000;
const DASHBOARD_CACHE_TTL_MS = 10_000;

type CacheEntry<T> = { ts: number; data: T };
const jobsListCache = new Map<string, CacheEntry<JobsListResponse>>();
const dashboardCache = new Map<string, CacheEntry<DashboardStatsResponse>>();

const readFreshCache = <T>(entry: CacheEntry<T> | undefined, ttlMs: number): T | null => {
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) return null;
  return entry.data;
};

const invalidateJobsAndDashboardCache = () => {
  jobsListCache.clear();
  dashboardCache.clear();
};

type DbUserRow = {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  ai_credits_used: number;
  ai_credits_limit: number;
  skills: string[];
  created_at: string;
};

type DbJobStatus = 'saved' | 'applied' | 'replied' | 'won' | 'lost';
type DbPlatform = 'upwork' | 'fiverr' | 'linkedin' | 'other';

type DbJobRow = {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  platform: DbPlatform;
  job_description: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  proposed_price: number | null;
  notes: string | null;
  proposal: string | null;
  status: DbJobStatus;
  followup_date: string | null;
  followup_at: string | null;
  applied_at: string | null;
  closed_at: string | null;
  created_at: string;
};

type AuthStateListener = (user: User | null) => void;

const platformToDb = (platform: string): DbPlatform => {
  const normalized = platform.toLowerCase();
  if (normalized === 'upwork') return 'upwork';
  if (normalized === 'fiverr') return 'fiverr';
  if (normalized === 'linkedin') return 'linkedin';
  return 'other';
};

const platformFromDb = (platform: DbPlatform): string => {
  if (platform === 'upwork') return 'Upwork';
  if (platform === 'fiverr') return 'Fiverr';
  if (platform === 'linkedin') return 'LinkedIn';
  return 'Other';
};

const statusToDb = (status: JobStatus): DbJobStatus => {
  if (status === 'Saved') return 'saved';
  if (status === 'Applied') return 'applied';
  if (status === 'Replied') return 'replied';
  if (status === 'Won') return 'won';
  return 'lost';
};

const statusFromDb = (status: DbJobStatus): JobStatus => {
  if (status === 'saved') return 'Saved';
  if (status === 'applied') return 'Applied';
  if (status === 'replied') return 'Replied';
  if (status === 'won') return 'Won';
  return 'Lost';
};

const extractDateOnly = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1];
};

const normalizeFollowUpDateTime = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const dt = new Date(`${trimmed}T10:00:00`);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const dt = new Date(trimmed);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  const dt = new Date(trimmed);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

const buildDefaultFollowUpAt = (appliedAtIso: string): string => {
  const base = new Date(appliedAtIso);
  const localReminder = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + 3,
    10,
    0,
    0,
    0
  );
  return localReminder.toISOString();
};

const mapDbUserToAppUser = (row: DbUserRow): User => ({
  id: row.id,
  email: row.email,
  plan: row.plan,
  aiCreditsUsed: row.ai_credits_used ?? 0,
  aiCreditsLimit: row.ai_credits_limit ?? 5,
  skills: row.skills ?? [],
  createdAt: row.created_at,
});

const mapDbJobToAppJob = (row: DbJobRow): Job => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  company: row.company ?? undefined,
  platform: platformFromDb(row.platform),
  description: row.job_description,
  budgetMin: row.budget_min ?? undefined,
  budgetMax: row.budget_max ?? undefined,
  currency: row.currency || 'INR',
  proposedPrice: row.proposed_price ?? undefined,
  status: statusFromDb(row.status),
  createdAt: row.created_at,
  appliedAt: row.applied_at ?? undefined,
  followUpAt: row.followup_at ?? (row.followup_date ? `${row.followup_date}T10:00:00.000Z` : undefined),
  closedAt: row.closed_at ?? undefined,
  notes: row.notes ?? undefined,
  proposal: row.proposal ?? undefined,
});

const mapCreatePayloadToDb = (
  payload: Omit<Job, 'id' | 'createdAt'> & Partial<Pick<Job, 'id' | 'createdAt'>>
) => ({
  title: payload.title.trim(),
  platform: platformToDb(payload.platform),
  company: payload.company?.trim() || null,
  job_description: payload.description.trim(),
  budget_min: payload.budgetMin ?? null,
  budget_max: payload.budgetMax ?? null,
  currency: payload.currency || 'INR',
  proposed_price: payload.proposedPrice ?? null,
  status: statusToDb(payload.status),
});

const buildActivityFromJobs = (jobs: Job[]): DashboardActivity[] => {
  const items: DashboardActivity[] = [];
  for (const job of jobs) {
    items.push({
      type: 'saved',
      title: job.title,
      platform: job.platform,
      timestamp: job.createdAt,
      text: `Saved ${job.title}`,
    });
    if (job.appliedAt) {
      items.push({
        type: 'applied',
        title: job.title,
        platform: job.platform,
        timestamp: job.appliedAt,
        text: `Applied to ${job.title}`,
      });
    }
    if (job.closedAt && (job.status === 'Won' || job.status === 'Lost')) {
      items.push({
        type: job.status === 'Won' ? 'won' : 'lost',
        title: job.title,
        platform: job.platform,
        timestamp: job.closedAt,
        text: job.status === 'Won' ? `Won ${job.title}` : `Closed ${job.title} as lost`,
      });
    }
  }
  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
};

const buildFallbackUser = (id: string, email: string): User => ({
  id,
  email,
  plan: 'free',
  aiCreditsUsed: 0,
  aiCreditsLimit: 5,
  skills: [],
  createdAt: new Date().toISOString(),
});

const getStoredJobs = (): Job[] => {
  const raw = localStorage.getItem(JOBS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Job[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveJobs = (jobs: Job[]) => {
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
};

const loadUserFromUsersTable = async (id: string, email: string): Promise<User> => {
  if (!supabase) {
    return buildFallbackUser(id, email);
  }

  let data: DbUserRow | null = null;
  try {
    const query = supabase
      .from('users')
      .select('id,email,plan,ai_credits_used,ai_credits_limit,skills,created_at')
      .eq('id', id)
      .maybeSingle();

    const result = await withTimeout(
      Promise.resolve(query),
      8000,
      'Profile lookup timed out'
    );
    data = ((result as { data: DbUserRow | null }).data ?? null);
  } catch {
    data = null;
  }

  if (!data) {
    return buildFallbackUser(id, email);
  }

  return mapDbUserToAppUser(data as DbUserRow);
};

const getSupabaseToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const ensureProfileSetup = async (accessToken: string | null): Promise<void> => {
  if (!accessToken) return;
  try {
    await fetchWithTimeout(
      '/api/auth/setup-profile',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      4500
    );
  } catch {
    // Trigger-based creation is primary; API setup is best-effort fallback.
  }
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

const parseJsonSafe = async <T = any>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
};

const AUTH_CALL_TIMEOUT_MS = 30000;
const SESSION_SETUP_TIMEOUT_MS = 20000;
const CURRENT_USER_TIMEOUT_MS = 8000;

const applySessionWithRetry = async (accessToken: string, refreshToken: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const setOnce = async () => {
    const { error } = await withTimeout(
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
      SESSION_SETUP_TIMEOUT_MS,
      'Session setup timed out. Please refresh and try again.'
    );
    if (error) throw error;
  };

  try {
    await setOnce();
  } catch {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    await setOnce();
  }
};

const signInViaRestFallback = async (email: string, password: string): Promise<{ id: string; email?: string }> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const url = getSupabaseBaseUrl();
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) {
    throw new Error('Supabase env is missing');
  }

  const response = await fetchWithTimeout(
    `${url}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify({ email, password }),
    },
    15000
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body?.error_description || body?.msg || body?.error || 'Invalid login credentials';
    throw new Error(message);
  }

  const accessToken = body?.access_token as string | undefined;
  const refreshToken = body?.refresh_token as string | undefined;
  const user = body?.user as { id: string; email?: string } | undefined;

  if (!accessToken || !refreshToken || !user?.id) {
    throw new Error('Login response was incomplete. Please try again.');
  }

  await applySessionWithRetry(accessToken, refreshToken);

  return user;
};

export const hasSupabaseAuth = (): boolean => hasSupabase;

export const hydrateSessionFromUrl = async (): Promise<void> => {
  if (!supabase || typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const originalPathWithParams = `${url.pathname}${url.search}${url.hash}`;
  const hashParams = new URLSearchParams((url.hash || '').replace(/^#/, ''));
  let pendingError: unknown = null;
  const hasOAuthPayload =
    Boolean(hashParams.get('access_token') && hashParams.get('refresh_token')) ||
    Boolean(url.searchParams.get('code'));

  try {
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      await applySessionWithRetry(accessToken, refreshToken);
    }

    const authCode = url.searchParams.get('code');
    if (authCode) {
      const { error } = await withTimeout(
        supabase.auth.exchangeCodeForSession(authCode),
        AUTH_CALL_TIMEOUT_MS,
        'OAuth session exchange timed out. Please try login again.'
      );
      if (error) {
        throw error;
      }
    }
  } catch (err) {
    pendingError = err;
  } finally {
    // Only strip one-time OAuth params when session hydration succeeded.
    // If hydration fails, keep params so refresh can retry instead of losing callback data.
    if (!pendingError || !hasOAuthPayload) {
      [
        'code',
        'state',
        'error',
        'error_code',
        'error_description',
        'error_uri',
      ].forEach((key) => url.searchParams.delete(key));

      [
        'access_token',
        'refresh_token',
        'token_type',
        'expires_in',
        'expires_at',
        'provider_token',
        'provider_refresh_token',
        'sb',
        'type',
        'error',
        'error_code',
        'error_description',
      ].forEach((key) => hashParams.delete(key));

      const nextHash = hashParams.toString();
      const nextPathWithParams = `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ''}`;
      if (nextPathWithParams !== originalPathWithParams) {
        window.history.replaceState({}, document.title, nextPathWithParams);
      }
    }
  }

  if (pendingError) {
    throw pendingError;
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  if (!supabase) {
    return { user: null, error: new Error('Auth is not configured. Missing Supabase client environment variables.') };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${getAuthBaseUrl()}/login` },
      }),
      AUTH_CALL_TIMEOUT_MS,
      'Signup request timed out. Please try again.'
    );

    if (error) return { user: null, error };
    if (!data.user) return { user: null, error: null };

    await ensureProfileSetup(data.session?.access_token ?? null);
    const user = await loadUserFromUsersTable(data.user.id, data.user.email ?? email);
    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err : new Error('Signup failed. Please try again.'),
    };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  if (!supabase) {
    return { user: null, error: new Error('Auth is not configured. Missing Supabase client environment variables.') };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      AUTH_CALL_TIMEOUT_MS,
      'Login request timed out. Please try again.'
    );
    if (error || !data.user) {
      return { user: null, error: error ?? new Error('Invalid login credentials') };
    }

    const user = await loadUserFromUsersTable(data.user.id, data.user.email ?? email);
    return { user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.toLowerCase().includes('timed out')) {
      try {
        const restUser = await signInViaRestFallback(email, password);
        const user = await loadUserFromUsersTable(restUser.id, restUser.email ?? email);
        return { user, error: null };
      } catch (fallbackErr) {
        return {
          user: null,
          error:
            fallbackErr instanceof Error
              ? fallbackErr
              : new Error('Login failed after retry. Please try again.'),
        };
      }
    }

    return {
      user: null,
      error: err instanceof Error ? err : new Error('Login failed. Please try again.'),
    };
  }
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { user: null, error: null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${getAuthBaseUrl()}/login` },
  });

  return { user: null, error: error ?? null };
};

export const signOut = async (): Promise<void> => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  if (!supabase) return;

  // Clear local session immediately for responsive UX.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  // Best-effort remote sign-out; do not block UI.
  void withTimeout(
    supabase.auth.signOut(),
    4000,
    'Remote sign-out timed out'
  ).catch(() => undefined);
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      CURRENT_USER_TIMEOUT_MS,
      'Session check timed out. Please refresh and try again.'
    );
    if (error || !data.user) return null;
    return loadUserFromUsersTable(data.user.id, data.user.email ?? '');
  } catch {
    return null;
  }
};

export const getCurrentUserFromSession = async (): Promise<User | null> => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) return null;
    return buildFallbackUser(sessionUser.id, sessionUser.email ?? '');
  } catch {
    return null;
  }
};

export const onAuthStateChanged = (listener: AuthStateListener): (() => void) => {
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      listener(null);
      return;
    }
    const user = await loadUserFromUsersTable(session.user.id, session.user.email ?? '');
    listener(user);
  });

  return () => data.subscription.unsubscribe();
};

export const resendConfirmationEmail = async (email: string): Promise<{ error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { error: null };
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${getAuthBaseUrl()}/login` },
  });

  return { error: error ?? null };
};

export const getJobs = async (): Promise<{ data: Job[]; error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { data: getStoredJobs(), error: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: null };

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: (data as DbJobRow[]).map(mapDbJobToAppJob), error: null };
};

export const getJobsList = async (query: JobsListQuery = {}): Promise<{ data: JobsListResponse; error: Error | null }> => {
  const limit = Math.max(1, Math.min(100, query.limit ?? 50));
  const offset = Math.max(0, query.offset ?? 0);
  const cacheKey = JSON.stringify({
    status: query.status ?? '',
    platform: query.platform ?? '',
    search: (query.search ?? '').trim().toLowerCase(),
    limit,
    offset,
  });
  const cached = readFreshCache(jobsListCache.get(cacheKey), JOBS_LIST_CACHE_TTL_MS);
  if (cached) return { data: cached, error: null };

  if (!supabase) {
    const all = getStoredJobs();
    const filtered = all.filter((job) => {
      const statusOk = !query.status || statusToDb(job.status) === query.status;
      const platformOk = !query.platform || platformToDb(job.platform) === query.platform;
      const search = (query.search || '').trim().toLowerCase();
      const searchOk =
        !search ||
        job.title.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search);
      return statusOk && platformOk && searchOk;
    });
    const jobs = filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
    const result = { jobs, total: filtered.length, limit, offset };
    jobsListCache.set(cacheKey, { ts: Date.now(), data: result });
    return { data: result, error: null };
  }

  const token = await getSupabaseToken();
  if (token) {
    try {
      const params = new URLSearchParams();
      if (query.status) params.set('status', query.status);
      if (query.platform) params.set('platform', query.platform);
      if (query.search) params.set('search', query.search);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetchWithTimeout(`/api/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }, 6500);
      if (response.ok) {
        const body = await parseJsonSafe<{ jobs: DbJobRow[]; total?: number; limit?: number; offset?: number }>(response);
        if (!body) throw new Error('Invalid jobs response');
        const jobs = (body.jobs as DbJobRow[]).map(mapDbJobToAppJob);
        const result = {
          jobs,
          total: body.total || 0,
          limit: body.limit || limit,
          offset: body.offset || offset,
        };
        jobsListCache.set(cacheKey, { ts: Date.now(), data: result });
        return { data: result, error: null };
      }
    } catch {
      // Fallback to direct query when no serverless runtime is present.
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: { jobs: [], total: 0, limit, offset }, error: null };

  let countQuery = supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  let dataQuery = supabase.from('jobs').select('*').eq('user_id', user.id);

  if (query.status) {
    countQuery = countQuery.eq('status', query.status);
    dataQuery = dataQuery.eq('status', query.status);
  }
  if (query.platform) {
    countQuery = countQuery.eq('platform', query.platform);
    dataQuery = dataQuery.eq('platform', query.platform);
  }
  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    countQuery = countQuery.or(`title.ilike.%${s}%,job_description.ilike.%${s}%`);
    dataQuery = dataQuery.or(`title.ilike.%${s}%,job_description.ilike.%${s}%`);
  }

  const { count, error: countError } = await countQuery;
  if (countError) return { data: { jobs: [], total: 0, limit, offset }, error: countError };

  const { data, error } = await dataQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { data: { jobs: [], total: 0, limit, offset }, error };

  const result = {
    jobs: (data as DbJobRow[]).map(mapDbJobToAppJob),
    total: count || 0,
    limit,
    offset,
  };
  jobsListCache.set(cacheKey, { ts: Date.now(), data: result });
  return { data: result, error: null };
};

export const getDashboardStats = async (
  range: '7d' | '30d' | '90d' = '7d'
): Promise<{ data: DashboardStatsResponse | null; error: Error | null }> => {
  const cached = readFreshCache(dashboardCache.get(range), DASHBOARD_CACHE_TTL_MS);
  if (cached) return { data: cached, error: null };

  const getRangeStart = () => {
    const now = new Date();
    const d = new Date(now);
    if (range === '30d') d.setDate(now.getDate() - 30);
    else if (range === '90d') d.setDate(now.getDate() - 90);
    else d.setDate(now.getDate() - 7);
    return d;
  };

  if (!supabase) {
    const jobs = getStoredJobs();
    const now = new Date();
    const weekStart = getRangeStart();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = now.toISOString().slice(0, 10);

    const applicationsThisWeek = jobs.filter(
      (j) => j.status !== 'Saved' && new Date(j.createdAt) >= weekStart
    ).length;
    const awaitingReply = jobs.filter((j) => j.status === 'Applied').length;
    const activeConversations = jobs.filter((j) => j.status === 'Replied').length;
    const wonThisMonth = jobs.filter((j) => j.status === 'Won' && new Date(j.createdAt) >= monthStart);
    const totalRevenue = wonThisMonth.reduce((sum, j) => sum + (j.proposedPrice || 0), 0);
    const followupsDue = jobs.filter((j) => j.followUpAt?.slice(0, 10) === today);
    const recentActivity = buildActivityFromJobs(jobs);

    const result = {
      applications_this_week: applicationsThisWeek,
      awaiting_reply: awaitingReply,
      active_conversations: activeConversations,
      projects_won: wonThisMonth.length,
      total_revenue: totalRevenue,
      followups_due: followupsDue,
      recent_activity: recentActivity,
    };
    dashboardCache.set(range, { ts: Date.now(), data: result });
    return { data: result, error: null };
  }

  const token = await getSupabaseToken();
  if (token) {
    try {
      const withRange = await fetchWithTimeout(`/api/dashboard/stats?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      }, 4500);
      if (withRange.ok) {
        const body = await parseJsonSafe<DashboardStatsResponse>(withRange);
        if (!body) throw new Error('Invalid dashboard response');
        const result = body as DashboardStatsResponse;
        dashboardCache.set(range, { ts: Date.now(), data: result });
        return { data: result, error: null };
      }
    } catch {
      // Fallback below
    }
  }

  const { data: list, error } = await getJobsList({ limit: 1000, offset: 0 });
  if (error) return { data: null, error };
  const jobs = list.jobs;
  const now = new Date();
  const weekStart = getRangeStart();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.toISOString().slice(0, 10);

  const result = {
    applications_this_week: jobs.filter((j) => j.status !== 'Saved' && new Date(j.createdAt) >= weekStart).length,
    awaiting_reply: jobs.filter((j) => j.status === 'Applied').length,
    active_conversations: jobs.filter((j) => j.status === 'Replied').length,
    projects_won: jobs.filter((j) => j.status === 'Won' && new Date(j.createdAt) >= monthStart).length,
    total_revenue: jobs
      .filter((j) => j.status === 'Won' && new Date(j.createdAt) >= monthStart)
      .reduce((sum, j) => sum + (j.proposedPrice || 0), 0),
    followups_due: jobs.filter((j) => j.followUpAt?.slice(0, 10) === today),
    recent_activity: buildActivityFromJobs(jobs),
  };
  dashboardCache.set(range, { ts: Date.now(), data: result });
  return { data: result, error: null };
};

export const createJob = async (
  payload: Omit<Job, 'id' | 'createdAt'> & Partial<Pick<Job, 'id' | 'createdAt'>>
): Promise<{ data: Job | null; error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const job: Job = {
      ...payload,
      id: payload.id ?? `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };
    saveJobs([job, ...getStoredJobs()]);
    invalidateJobsAndDashboardCache();
    return { data: job, error: null };
  }

  const token = await getSupabaseToken();
  if (token) {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: payload.title,
          platform: payload.platform,
          company: payload.company,
          description: payload.description,
          budgetMin: payload.budgetMin,
          budgetMax: payload.budgetMax,
          proposedPrice: payload.proposedPrice,
          currency: payload.currency,
        }),
      });

      if (response.ok) {
        const body = await parseJsonSafe<{ job_id: string }>(response);
        if (!body?.job_id) throw new Error('Invalid create-job response');
        const result = await getJobById(body.job_id);
        if (!result.error) invalidateJobsAndDashboardCache();
        return result;
      }
    } catch {
      // Fallback to direct client insert for local Vite development without serverless runtime.
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: new Error('Unauthorized') };

  const dbPayload = mapCreatePayloadToDb(payload);
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...dbPayload, user_id: user.id })
    .select('*')
    .single();

  if (error) return { data: null, error };
  invalidateJobsAndDashboardCache();
  return { data: mapDbJobToAppJob(data as DbJobRow), error: null };
};

export const updateJob = async (
  id: string,
  updates: Partial<Job>
): Promise<{ data: Job | null; error: Error | null }> => {
  const normalizedUpdates: Partial<Job> = { ...updates };
  if (normalizedUpdates.status === 'Applied') {
    const nextAppliedAt = normalizedUpdates.appliedAt || new Date().toISOString();
    normalizedUpdates.appliedAt = nextAppliedAt;

    if (normalizedUpdates.followUpAt === undefined) {
      normalizedUpdates.followUpAt = buildDefaultFollowUpAt(nextAppliedAt);
    }
  }

  if (normalizedUpdates.followUpAt !== undefined) {
    const normalizedFollowUp = normalizeFollowUpDateTime(normalizedUpdates.followUpAt);
    normalizedUpdates.followUpAt = normalizedFollowUp ?? undefined;
  }

  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const jobs = getStoredJobs();
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx === -1) return { data: null, error: new Error('Job not found') };
    const updated = { ...jobs[idx], ...normalizedUpdates, id: jobs[idx].id };
    jobs[idx] = updated;
    saveJobs(jobs);
    invalidateJobsAndDashboardCache();
    return { data: updated, error: null };
  }

  const patch: Record<string, unknown> = {};
  if (normalizedUpdates.title !== undefined) patch.title = normalizedUpdates.title;
  if (normalizedUpdates.platform !== undefined) patch.platform = platformToDb(normalizedUpdates.platform);
  if (normalizedUpdates.company !== undefined) patch.company = normalizedUpdates.company ?? null;
  if (normalizedUpdates.description !== undefined) patch.job_description = normalizedUpdates.description;
  if (normalizedUpdates.budgetMin !== undefined) patch.budget_min = normalizedUpdates.budgetMin ?? null;
  if (normalizedUpdates.budgetMax !== undefined) patch.budget_max = normalizedUpdates.budgetMax ?? null;
  if (normalizedUpdates.currency !== undefined) patch.currency = normalizedUpdates.currency;
  if (normalizedUpdates.proposedPrice !== undefined) patch.proposed_price = normalizedUpdates.proposedPrice ?? null;
  if (normalizedUpdates.status !== undefined) patch.status = statusToDb(normalizedUpdates.status);
  if (normalizedUpdates.followUpAt !== undefined) {
    const followUpIso = normalizedUpdates.followUpAt ?? null;
    patch.followup_at = followUpIso;
    patch.followup_date = followUpIso ? extractDateOnly(followUpIso) ?? null : null;
  }
  if (normalizedUpdates.appliedAt !== undefined) patch.applied_at = normalizedUpdates.appliedAt ?? null;
  if (normalizedUpdates.notes !== undefined) patch.notes = normalizedUpdates.notes ?? null;
  if (normalizedUpdates.proposal !== undefined) patch.proposal = normalizedUpdates.proposal ?? null;

  const { data, error } = await supabase.from('jobs').update(patch).eq('id', id).select('*').single();
  if (error) return { data: null, error };
  invalidateJobsAndDashboardCache();
  return { data: mapDbJobToAppJob(data as DbJobRow), error: null };
};

export const deleteJob = async (id: string): Promise<{ error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    saveJobs(getStoredJobs().filter((job) => job.id !== id));
    invalidateJobsAndDashboardCache();
    return { error: null };
  }

  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (!error) invalidateJobsAndDashboardCache();
  return { error: error ?? null };
};

export const getJobById = async (id: string): Promise<{ data: Job | null; error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const localJob = getStoredJobs().find((job) => job.id === id);
    if (localJob) return { data: localJob, error: null };
  } else {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
    if (error) return { data: null, error };
    if (data) return { data: mapDbJobToAppJob(data as DbJobRow), error: null };
  }

  const mockJob: Job = {
    id,
    title: 'Senior React Developer Needed for SaaS Dashboard',
    company: 'TechFlow Inc.',
    platform: 'Upwork',
    description: `We are looking for an experienced React developer to build a modern dashboard for our SaaS product.
    
Requirements:
- Strong proficiency in React, TypeScript, and Tailwind CSS.
- Experience with charting libraries (Recharts, Chart.js).
- Ability to write clean, reusable components.
- Familiarity with Supabase is a plus.`,
    budgetMin: 50,
    budgetMax: 80,
    currency: 'USD',
    proposedPrice: 75,
    status: 'Saved',
    createdAt: new Date().toISOString(),
    notes: 'Client seems to prefer fast turnaround. Mention Figma experience.',
    userId: 'user_existing_123',
  };

  return { data: mockJob, error: null };
};

export const generateProposal = async (
  _jobId: string,
  settings: any,
  profile?: FreelancerProfile | null
): Promise<{ proposal: string; creditsRemaining: number }> => {
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const tones: Record<string, string> = {
    professional: 'I am writing to express my strong interest in your project...',
    friendly: 'Hi there! I saw your project and got excited because...',
    confident: 'I am the expert you are looking for to deliver this project...',
  };

  const selectedTone = settings.tone || 'professional';
  let intro = tones[selectedTone] || tones.professional;

  if (profile && profile.skills.length > 0) {
    if (selectedTone === 'friendly') {
      intro = `Hi there! I'm a ${profile.skills[0]} specialist with ${profile.yearsExperience} years of experience, and I'd love to help you with this project.`;
    } else if (selectedTone === 'confident') {
      intro = `With ${profile.yearsExperience} years of experience shipping production-grade ${profile.skills[0]} applications, I am the exact partner you need for this.`;
    }
  }

  const skillsMention = profile ? profile.skills.slice(0, 3).join(', ') : 'React, TypeScript, and Tailwind CSS';
  let body = `I have extensive experience with ${skillsMention}, which aligns perfectly with your requirements for the SaaS dashboard. I have previously built similar dashboards using Recharts and can ensure pixel-perfect implementation from your Figma designs.`;

  if (profile && profile.pastProjects.length > 0) {
    const proj = profile.pastProjects[0];
    body += `\n\nFor example, I recently built ${proj.name}, where I used ${proj.technologies.join(', ')}. ${proj.description}`;
  }

  if (settings.highlights?.includes('fast_turnaround')) {
    body += '\n\nI can start immediately and typically deliver initial screens within 48 hours.';
  }

  if (settings.highlights?.includes('portfolio') && profile?.portfolioUrl) {
    body += `\n\nYou can see more of my work here: ${profile.portfolioUrl}`;
  }

  const proposalText = `${intro}

${body}

I understand you need clean, reusable code, and that is my standard practice. I'm also familiar with Supabase, which should smooth out the backend integration.

Looking forward to discussing how we can bring this dashboard to life.

Best regards,
[Your Name]`;

  return { proposal: proposalText, creditsRemaining: 2 };
};

export const updateJobStatus = async (
  jobId: string,
  status: JobStatus,
  appliedAt?: string
): Promise<{ error: Error | null }> => {
  const updates: Partial<Job> = { status };
  if (appliedAt) updates.appliedAt = appliedAt;
  const { error } = await updateJob(jobId, updates);
  return { error };
};

export const saveProposal = async (jobId: string, proposal: string): Promise<{ error: Error | null }> => {
  const { error } = await updateJob(jobId, { proposal });
  return { error };
};

export const getProfile = async (): Promise<{ data: FreelancerProfile | null; error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: new Error('Unauthorized') };

  type DbFreelancerProfile = {
    user_id: string;
    skills: string[] | null;
    experience_level: 'Entry' | 'Intermediate' | 'Expert' | null;
    years_experience: number | null;
    bio: string | null;
    portfolio_url: string | null;
    linkedin_url: string | null;
    hourly_rate: number | null;
    past_projects: any[] | null;
    communication_style: string | null;
    completed_onboarding: boolean | null;
    preferences: FreelancerProfile['preferences'] | null;
    notification_settings: FreelancerProfile['notificationSettings'] | null;
  };

  try {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select(
        'user_id,skills,experience_level,years_experience,bio,portfolio_url,linkedin_url,hourly_rate,past_projects,communication_style,completed_onboarding,preferences,notification_settings'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (/relation .*freelancer_profiles.* does not exist/i.test(error.message || '')) {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
        return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
      }
      return { data: null, error };
    }

    if (!data) {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
    }

    const row = data as DbFreelancerProfile;
    const profile: FreelancerProfile = {
      id: row.user_id,
      userId: row.user_id,
      skills: Array.isArray(row.skills) ? row.skills : [],
      experienceLevel: row.experience_level || 'Entry',
      yearsExperience: Number(row.years_experience || 0),
      bio: row.bio || '',
      portfolioUrl: row.portfolio_url || undefined,
      linkedinUrl: row.linkedin_url || undefined,
      hourlyRate: Number(row.hourly_rate || 0),
      pastProjects: Array.isArray(row.past_projects) ? row.past_projects : [],
      communicationStyle: row.communication_style || 'Professional',
      completedOnboarding: Boolean(row.completed_onboarding),
      preferences: row.preferences || undefined,
      notificationSettings: row.notification_settings || undefined,
    };

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return { data: profile, error: null };
  } catch {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
  }
};

export const updateProfile = async (
  profile: FreelancerProfile
): Promise<{ data: FreelancerProfile; error: Error | null }> => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: profile, error: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: profile, error: new Error('Unauthorized') };

  try {
    const payload = {
      user_id: user.id,
      skills: profile.skills || [],
      experience_level: profile.experienceLevel || 'Entry',
      years_experience: Number(profile.yearsExperience || 0),
      bio: profile.bio || '',
      portfolio_url: profile.portfolioUrl || null,
      linkedin_url: profile.linkedinUrl || null,
      hourly_rate: Number(profile.hourlyRate || 0),
      past_projects: profile.pastProjects || [],
      communication_style: profile.communicationStyle || 'Professional',
      completed_onboarding: Boolean(profile.completedOnboarding),
      preferences: profile.preferences || {},
      notification_settings: profile.notificationSettings || {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('freelancer_profiles').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      if (/relation .*freelancer_profiles.* does not exist/i.test(error.message || '')) {
        return { data: profile, error: null };
      }
      return { data: profile, error };
    }
    return { data: profile, error: null };
  } catch {
    return { data: profile, error: null };
  }
};

export const getAnalyticsInsights = async (
  range: '7d' | '30d' | '90d' | 'ytd' = '30d'
): Promise<{ data: AnalyticsResponse | null; error: Error | null }> => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  const token = await getSupabaseToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout(`/api/analytics/insights?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }, 7000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to fetch analytics insights') };
    return { data: body as AnalyticsResponse, error: null };
  } catch {
    return { data: null, error: new Error('Failed to fetch analytics insights') };
  }
};

export const getClientsInsights = async (): Promise<{ data: ClientsInsightsResponse | null; error: Error | null }> => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  const token = await getSupabaseToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/clients/insights', {
      headers: { Authorization: `Bearer ${token}` },
    }, 7000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to fetch client insights') };
    return { data: body as ClientsInsightsResponse, error: null };
  } catch {
    return { data: null, error: new Error('Failed to fetch client insights') };
  }
};

export const updateClientSegmentationWeights = async (
  weights: ClientsInsightsResponse['segmentation_weights']
): Promise<{ data: ClientsInsightsResponse['segmentation_weights'] | null; error: Error | null }> => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/clients/segmentation-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ weights }),
    }, 7000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to update segmentation settings') };
    return { data: body.weights, error: null };
  } catch {
    return { data: null, error: new Error('Failed to update segmentation settings') };
  }
};

export const createStripeCheckoutSession = async (): Promise<{ url: string | null; error: Error | null }> => {
  if (!supabase) return { url: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { url: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, 15000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { url: null, error: new Error(body.error || 'Failed to start checkout') };
    if (!body.url) return { url: null, error: new Error('Checkout URL missing') };
    return { url: body.url, error: null };
  } catch {
    return { url: null, error: new Error('Failed to start checkout') };
  }
};

export const createStripePortalSession = async (): Promise<{ url: string | null; error: Error | null }> => {
  if (!supabase) return { url: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { url: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/payments/create-portal-session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, 15000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { url: null, error: new Error(body.error || 'Failed to open billing portal') };
    if (!body.url) return { url: null, error: new Error('Portal URL missing') };
    return { url: body.url, error: null };
  } catch {
    return { url: null, error: new Error('Failed to open billing portal') };
  }
};

export type BillingInvoice = {
  id: string;
  plan: string;
  date: string;
  amount: string;
  status: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
};

export const getStripeInvoices = async (): Promise<{ data: BillingInvoice[]; error: Error | null }> => {
  if (!supabase) return { data: [], error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { data: [], error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/payments/invoices', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, 15000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: [], error: new Error(body.error || 'Failed to fetch invoices') };
    return { data: Array.isArray(body.invoices) ? body.invoices : [], error: null };
  } catch {
    return { data: [], error: new Error('Failed to fetch invoices') };
  }
};

export type NotificationSettingsDto = {
  followup_reminders: boolean;
  client_replies: boolean;
  weekly_summary: boolean;
};

export const getNotificationSettings = async (): Promise<{
  data: NotificationSettingsDto | null;
  error: Error | null;
}> => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/notifications/settings', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, 12000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to load notification settings') };
    return { data: (body.settings || null) as NotificationSettingsDto | null, error: null };
  } catch {
    return { data: null, error: new Error('Failed to load notification settings') };
  }
};

export const updateNotificationSettings = async (
  settings: NotificationSettingsDto
): Promise<{ data: NotificationSettingsDto | null; error: Error | null }> => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/notifications/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    }, 12000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to update notification settings') };
    return { data: (body.settings || null) as NotificationSettingsDto | null, error: null };
  } catch {
    return { data: null, error: new Error('Failed to update notification settings') };
  }
};
