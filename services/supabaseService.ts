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
import { getAuthBaseUrl, hasSupabase, supabase } from './supabaseClient';

const AUTH_STORAGE_KEY = 'user_session';
const PROFILE_STORAGE_KEY = 'freelancer_profile';
const JOBS_STORAGE_KEY = 'jobs_store_v1';
const OAUTH_INTENT_STORAGE_KEY = 'oauth_intent_v1';
const OAUTH_ERROR_STORAGE_KEY = 'oauth_error_v1';
const OAUTH_INTENT_TTL_MS = 10 * 60 * 1000;
const JOBS_LIST_CACHE_TTL_MS = 15_000;
const DASHBOARD_CACHE_TTL_MS = 10_000;
const authLookupSetting = String(import.meta.env.VITE_AUTH_USE_DB_PROFILE_LOOKUP || '').toLowerCase().trim();
const AUTH_USE_DB_PROFILE_LOOKUP = authLookupSetting ? authLookupSetting !== 'false' : true;
const PROFILE_SETUP_TIMEOUT_MS = 3500;

type CacheEntry<T> = { ts: number; data: T };
const jobsListCache = new Map<string, CacheEntry<JobsListResponse>>();
const dashboardCache = new Map<string, CacheEntry<DashboardStatsResponse>>();
const profileSetupInflight = new Map<string, Promise<boolean>>();
type ProfileSetupCacheEntry = { ok: boolean; ts: number };
const profileSetupResultByUser = new Map<string, ProfileSetupCacheEntry>();
const PROFILE_SETUP_OK_TTL_MS = 10 * 60 * 1000;
const PROFILE_SETUP_FAIL_TTL_MS = 20 * 1000;
let usersTableUnavailable = false;
let freelancerProfilesTableUnavailable = false;
let freelancerProfileKeyPreference: 'user_id' | 'id' | null = null;

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
type OAuthIntent = 'login' | 'signup';
type AuthResolutionContext = 'signup' | 'login' | 'session';
type ProfileBootstrapMode = 'ensure' | 'check';

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

const buildFallbackUser = (id: string, email: string, createdAt?: string): User => ({
  id,
  email,
  plan: 'free',
  aiCreditsUsed: 0,
  aiCreditsLimit: 5,
  skills: [],
  createdAt: createdAt || new Date().toISOString(),
});

type DbErrorLike = { message?: string; code?: string } | null | undefined;

const isSchemaOrRelationError = (error: DbErrorLike): boolean => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  if (code === 'PGRST205' || code === 'PGRST204' || code === '42P01' || code === '42703') return true;
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    message.includes('relation') ||
    message.includes('column')
  );
};

const normalizeDbError = (error: unknown): DbErrorLike => {
  if (!error || typeof error !== 'object') return null;
  const obj = error as { message?: string; code?: string };
  return { message: obj.message, code: obj.code };
};

const clearOAuthIntent = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(OAUTH_INTENT_STORAGE_KEY);
};

const setOAuthIntent = (intent: OAuthIntent): void => {
  if (typeof window === 'undefined') return;
  const payload = { intent, ts: Date.now() };
  window.localStorage.setItem(OAUTH_INTENT_STORAGE_KEY, JSON.stringify(payload));
};

const getPendingOAuthIntent = (): OAuthIntent | null => {
  if (typeof window === 'undefined') return null;

  try {
    const urlIntent = new URLSearchParams(window.location.search).get('intent');
    if (urlIntent === 'login' || urlIntent === 'signup') return urlIntent;
  } catch {
    // Ignore URL parsing issues.
  }

  try {
    const raw = window.localStorage.getItem(OAUTH_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { intent?: OAuthIntent; ts?: number };
    const intent = parsed?.intent;
    const ts = Number(parsed?.ts || 0);
    if (!(intent === 'login' || intent === 'signup')) return null;
    if (!ts || Date.now() - ts > OAUTH_INTENT_TTL_MS) {
      clearOAuthIntent();
      return null;
    }
    return intent;
  } catch {
    clearOAuthIntent();
    return null;
  }
};

const getPendingOAuthIntentTimestamp = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OAUTH_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number };
    const ts = Number(parsed?.ts || 0);
    if (!ts || Date.now() - ts > OAUTH_INTENT_TTL_MS) {
      clearOAuthIntent();
      return null;
    }
    return ts;
  } catch {
    clearOAuthIntent();
    return null;
  }
};

const setOAuthErrorCode = (code: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OAUTH_ERROR_STORAGE_KEY, code);
};

export const consumePendingOAuthErrorCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  const code = window.localStorage.getItem(OAUTH_ERROR_STORAGE_KEY);
  if (code) window.localStorage.removeItem(OAUTH_ERROR_STORAGE_KEY);
  return code;
};

const getProfileSetupCacheKey = (userId: string, mode: ProfileBootstrapMode): string =>
  `${userId || 'unknown-user'}:${mode}`;

const readProfileSetupCache = (cacheKey: string): boolean | null => {
  const entry = profileSetupResultByUser.get(cacheKey);
  if (!entry) return null;
  const ttl = entry.ok ? PROFILE_SETUP_OK_TTL_MS : PROFILE_SETUP_FAIL_TTL_MS;
  if (Date.now() - entry.ts > ttl) {
    profileSetupResultByUser.delete(cacheKey);
    return null;
  }
  return entry.ok;
};

const writeProfileSetupCache = (cacheKey: string, ok: boolean): void => {
  profileSetupResultByUser.set(cacheKey, { ok, ts: Date.now() });
};

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

const loadUserFromUsersTable = async (id: string, email: string): Promise<User | null> => {
  // Default auth mode does not depend on public.users to avoid login breakage
  // when schema drift/migrations are incomplete in production.
  if (!supabase || !AUTH_USE_DB_PROFILE_LOOKUP || usersTableUnavailable) {
    return null;
  }

  try {
    const result = await withTimeout(
      Promise.resolve(
        supabase
          .from('users')
          .select('id,email,plan,skills,created_at')
          .eq('id', id)
          .maybeSingle()
      ),
      3500,
      'Profile lookup timed out'
    ) as {
      data: Partial<DbUserRow> | null;
      error?: { message?: string } | null;
    };

    if (result.error) {
      if (isSchemaOrRelationError(result.error)) usersTableUnavailable = true;
      return null;
    }
    if (!result.data) return null;

    const data: DbUserRow = {
      id: String(result.data.id || id),
      email: String(result.data.email || email),
      plan: result.data.plan === 'pro' ? 'pro' : 'free',
      ai_credits_used: Number(result.data.ai_credits_used ?? 0),
      ai_credits_limit: Number(result.data.ai_credits_limit ?? 5),
      skills: Array.isArray(result.data.skills) ? result.data.skills : [],
      created_at: String(result.data.created_at || new Date().toISOString()),
    };
    return mapDbUserToAppUser(data);
  } catch (error) {
    if (isSchemaOrRelationError(normalizeDbError(error))) usersTableUnavailable = true;
    return null;
  }
};

const getSupabaseToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const ensureProfileSetup = async (
  userId: string,
  accessToken: string | null,
  mode: ProfileBootstrapMode = 'ensure'
): Promise<boolean> => {
  if (!accessToken) return false;
  const cacheKey = getProfileSetupCacheKey(userId, mode);
  const cached = readProfileSetupCache(cacheKey);
  if (cached != null) return cached;
  const inflight = profileSetupInflight.get(cacheKey);
  if (inflight) return inflight;

  const setupPromise = (async () => {
    try {
      const response = await fetchWithTimeout(
        '/api/auth/setup-profile',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mode }),
        },
        PROFILE_SETUP_TIMEOUT_MS
      );
      if (!response.ok) {
        writeProfileSetupCache(cacheKey, false);
        return false;
      }
      const body = await parseJsonSafe<{ success?: boolean; account_ready?: boolean }>(response);
      const ok = !body ? true : Boolean(body.success !== false && body.account_ready !== false);
      writeProfileSetupCache(cacheKey, ok);
      return ok;
    } catch {
      // Trigger-based creation is primary; API setup is best-effort fallback.
      writeProfileSetupCache(cacheKey, false);
      return false;
    } finally {
      profileSetupInflight.delete(cacheKey);
    }
  })();

  profileSetupInflight.set(cacheKey, setupPromise);
  return setupPromise;
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

type OAuthLoginRejectResult = 'deleted' | 'not_eligible' | 'error' | 'skipped';

const rejectOAuthLoginOnlyAccount = async (
  accessToken: string | null,
  loginStartedAtMs: number | null
): Promise<OAuthLoginRejectResult> => {
  if (!accessToken) return 'skipped';
  try {
    const response = await fetchWithTimeout(
      '/api/auth/reject-oauth-login',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login_started_at_ms: loginStartedAtMs && Number.isFinite(loginStartedAtMs) ? loginStartedAtMs : null,
        }),
      },
      4000
    );
    if (response.ok) return 'deleted';
    if (response.status === 409) return 'not_eligible';
    return 'error';
  } catch {
    return 'error';
  }
};

const resolveUserAfterAuth = async (
  userId: string,
  email: string,
  accessToken: string | null,
  createdAt?: string,
  context: AuthResolutionContext = 'session'
): Promise<User | null> => {
  const oauthIntent = getPendingOAuthIntent();
  if (oauthIntent === 'login') {
    // Strict login behavior: a Login flow must only continue for accounts
    // that existed before this login attempt.
    const loginStartedAtMs = getPendingOAuthIntentTimestamp();
    const cleanupResult = await rejectOAuthLoginOnlyAccount(accessToken, loginStartedAtMs);
    if (cleanupResult === 'deleted' || cleanupResult === 'error') {
      clearOAuthIntent();
      setOAuthErrorCode(cleanupResult === 'deleted' ? 'no_account' : 'oauth_failed');
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }
      return null;
    }
  }

  if (oauthIntent) {
    clearOAuthIntent();
  }

  const shouldBootstrap =
    context === 'signup' || oauthIntent === 'signup';
  let verifiedAccountReady = false;
  if (accessToken) {
    if (shouldBootstrap) {
      await ensureProfileSetup(userId, accessToken, 'ensure');
    } else {
      const accountReady = await ensureProfileSetup(userId, accessToken, 'check');
      if (!accountReady) {
        setOAuthErrorCode('no_account');
        if (supabase) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        }
        return null;
      }
      verifiedAccountReady = true;
    }
  }
  const user = await loadUserFromUsersTable(userId, email);
  if (user) return user;
  if (!shouldBootstrap && verifiedAccountReady) {
    return buildFallbackUser(userId, email, createdAt);
  }
  if (shouldBootstrap) {
    return buildFallbackUser(userId, email, createdAt);
  }
  setOAuthErrorCode('no_account');
  if (supabase) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
  return null;
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

const AUTH_CALL_TIMEOUT_MS = 15000;
const SESSION_SETUP_TIMEOUT_MS = 8000;
const SESSION_VALIDATE_TIMEOUT_MS = 6500;
const OAUTH_QUERY_KEYS = [
  'code',
  'state',
  'error',
  'error_code',
  'error_description',
  'error_uri',
];
const OAUTH_HASH_KEYS = [
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
];

const clearOAuthArtifactsFromUrl = (): void => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams((url.hash || '').replace(/^#/, ''));

  OAUTH_QUERY_KEYS.forEach((key) => url.searchParams.delete(key));
  OAUTH_HASH_KEYS.forEach((key) => hashParams.delete(key));

  const nextHash = hashParams.toString();
  const nextPathWithParams = `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ''}`;
  const currentPathWithParams = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextPathWithParams !== currentPathWithParams) {
    window.history.replaceState({}, document.title, nextPathWithParams);
  }
};

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

const hasActiveSession = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
};

export const hasSupabaseAuth = (): boolean => hasSupabase;

export const hydrateSessionFromUrl = async (): Promise<void> => {
  if (!supabase || typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams((url.hash || '').replace(/^#/, ''));

  const callbackError =
    url.searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    url.searchParams.get('error') ||
    hashParams.get('error');
  if (callbackError) {
    clearOAuthArtifactsFromUrl();
    throw new Error(callbackError);
  }

  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    try {
      await applySessionWithRetry(accessToken, refreshToken);
    } finally {
      clearOAuthArtifactsFromUrl();
    }
    return;
  }

  const authCode = url.searchParams.get('code');
  if (authCode) {
    try {
      let exchangeError: Error | null = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const { error } = await withTimeout(
          supabase.auth.exchangeCodeForSession(authCode),
          AUTH_CALL_TIMEOUT_MS,
          'OAuth session exchange timed out. Please try login again.'
        );
        if (!error) {
          exchangeError = null;
          break;
        }
        exchangeError = error;
        if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 300));
      }

      if (exchangeError) {
        if (await hasActiveSession()) return;
        throw exchangeError;
      }
    } finally {
      clearOAuthArtifactsFromUrl();
    }
    return;
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
        options: { emailRedirectTo: `${getAuthBaseUrl()}/auth/callback` },
      }),
      AUTH_CALL_TIMEOUT_MS,
      'Signup request timed out. Please try again.'
    );

    if (error) return { user: null, error };
    if (!data.user) return { user: null, error: null };
    // Email-confirmation mode: no active session yet, treat as successful signup.
    if (!data.session?.access_token) return { user: null, error: null };

    const user = await resolveUserAfterAuth(
      data.user.id,
      data.user.email ?? email,
      data.session.access_token,
      (data.user as { created_at?: string }).created_at,
      'signup'
    );
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

    const user = await resolveUserAfterAuth(
      data.user.id,
      data.user.email ?? email,
      data.session?.access_token ?? null,
      (data.user as { created_at?: string }).created_at,
      'login'
    );
    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err : new Error('Login failed. Please try again.'),
    };
  }
};

export const signInWithGoogle = async (
  intent: OAuthIntent = 'login',
  returnTo?: string | null
): Promise<AuthResponse> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { user: null, error: null };
  }

  const callback = new URL(`${getAuthBaseUrl()}/auth/callback`);
  callback.searchParams.set('intent', intent);
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    callback.searchParams.set('returnTo', returnTo);
  }

  setOAuthIntent(intent);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback.toString() },
  });

  return { user: null, error: error ?? null };
};

export const signOut = async (): Promise<void> => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  clearOAuthIntent();
  consumePendingOAuthErrorCode();
  clearOAuthArtifactsFromUrl();
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
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const sessionUser = session?.user;
    if (!sessionUser) return null;

    let resolvedUser = sessionUser;
    try {
      const userResult = await withTimeout(
        Promise.resolve(supabase.auth.getUser()),
        SESSION_VALIDATE_TIMEOUT_MS,
        'Session validation timed out'
      );
      if (userResult.error) {
        const msg = String(userResult.error.message || '').toLowerCase();
        if (
          msg.includes('jwt') ||
          msg.includes('expired') ||
          msg.includes('invalid') ||
          msg.includes('unauthorized')
        ) {
          return null;
        }
      } else if (userResult.data?.user) {
        resolvedUser = userResult.data.user;
      }
    } catch {
      // Keep using session user as best effort when validation endpoint is temporarily slow.
    }

    return await resolveUserAfterAuth(
      resolvedUser.id,
      resolvedUser.email ?? '',
      session?.access_token ?? null,
      (resolvedUser as { created_at?: string }).created_at,
      'session'
    );
  } catch {
    return null;
  }
};

export const getCurrentUserFromSession = async (): Promise<User | null> => {
  return await getCurrentUser();
};

export const onAuthStateChanged = (listener: AuthStateListener): (() => void) => {
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      listener(null);
      return;
    }
    let user: User | null = null;
    try {
      user = await resolveUserAfterAuth(
        session.user.id,
        session.user.email ?? '',
        session.access_token ?? null,
        (session.user as { created_at?: string }).created_at,
        'session'
      );
    } catch {
      user = null;
    }
    listener(user);
  });

  return () => data.subscription.unsubscribe();
};

export const resendConfirmationEmail = async (email: string): Promise<{ error: Error | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { error: null };
  }

  try {
    const response = await fetchWithTimeout(
      '/api/auth/resend-verification',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
      7000
    );
    const body = await parseJsonSafe<{ error?: string }>(response);
    if (!response.ok) {
      return { error: new Error(body?.error || 'Failed to resend verification email') };
    }
    return { error: null };
  } catch {
    // Fallback to direct client resend for local/dev resilience.
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${getAuthBaseUrl()}/auth/callback` },
    });
    return { error: error ?? null };
  }
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
    const s = sanitizeSearchTermForPostgrest(query.search);
    if (s) {
      countQuery = countQuery.or(`title.ilike.%${s}%,job_description.ilike.%${s}%`);
      dataQuery = dataQuery.or(`title.ilike.%${s}%,job_description.ilike.%${s}%`);
    }
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
        const nowIso = new Date().toISOString();
        const created: Job = {
          id: body.job_id,
          userId: payload.userId || '',
          title: payload.title.trim(),
          company: payload.company?.trim() || undefined,
          platform: payload.platform,
          description: payload.description.trim(),
          budgetMin: payload.budgetMin,
          budgetMax: payload.budgetMax,
          currency: payload.currency || 'INR',
          proposedPrice: payload.proposedPrice,
          status: payload.status,
          createdAt: nowIso,
          notes: payload.notes || undefined,
          proposal: payload.proposal || undefined,
        };
        invalidateJobsAndDashboardCache();
        return { data: created, error: null };
      }

      // If API route is reachable and explicitly rejected, return server error as-is.
      const apiError = await parseJsonSafe<{ error?: string }>(response);
      return {
        data: null,
        error: new Error(apiError?.error || 'Failed to save job'),
      };
    } catch {
      if (!import.meta.env.DEV) {
        return { data: null, error: new Error('Failed to save job') };
      }
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

const normalizeJobId = (rawId: string): string => {
  const raw = String(rawId || '');
  if (!raw) return '';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  return decoded
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\/+$/g, '')
    .split(/[?#]/, 1)[0]
    .trim();
};

const findJobInLocalSources = (rawId: string): Job | null => {
  const targetId = normalizeJobId(rawId);
  if (!targetId) return null;

  const fromStored = getStoredJobs().find((job) => normalizeJobId(job.id) === targetId);
  if (fromStored) return fromStored;

  for (const cacheEntry of jobsListCache.values()) {
    const cachedJobs = cacheEntry?.data?.jobs;
    if (!Array.isArray(cachedJobs)) continue;
    const found = cachedJobs.find((job) => normalizeJobId(job.id) === targetId);
    if (found) return found;
  }

  return null;
};

export const getJobById = async (id: string): Promise<{ data: Job | null; error: Error | null }> => {
  const normalizedId = normalizeJobId(id);
  if (!normalizedId) return { data: null, error: new Error('Invalid job ID') };

  const fallbackLocal = findJobInLocalSources(normalizedId);

  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (fallbackLocal) return { data: fallbackLocal, error: null };
    return { data: null, error: new Error('Job not found') };
  }

  const { data, error } = await supabase.from('jobs').select('*').eq('id', normalizedId).maybeSingle();
  if (!error && data) return { data: mapDbJobToAppJob(data as DbJobRow), error: null };

  if (error) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user) {
      const { data: rows, error: listError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!listError && Array.isArray(rows)) {
        const recovered = (rows as DbJobRow[]).find((row) => normalizeJobId(String(row.id)) === normalizedId);
        if (recovered) return { data: mapDbJobToAppJob(recovered), error: null };
      }
    }

    if (fallbackLocal) return { data: fallbackLocal, error: null };
    return { data: null, error };
  }

  if (data) return { data: mapDbJobToAppJob(data as DbJobRow), error: null };
  if (fallbackLocal) return { data: fallbackLocal, error: null };

  return { data: null, error: new Error('Job not found') };
};

export type ProposalSettings = {
  tone?: 'professional' | 'friendly' | 'confident';
  length?: 'concise' | 'standard' | 'detailed';
  highlights?: string[];
};

export type ProfileAssistantHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ProfileAssistantContext = {
  mode?: 'onboarding' | 'settings' | 'default';
  currentStepId?: string;
  nextStepPrompt?: string;
};

export type ProfileAssistantResult = {
  reply: string;
  profilePatch: Partial<FreelancerProfile>;
};

const KNOWN_SKILLS = [
  'react',
  'typescript',
  'next.js',
  'node.js',
  'supabase',
  'tailwind',
  'figma',
  'python',
  'aws',
  'seo',
  'design',
  'marketing',
  'sql',
  'javascript',
  'webflow',
  'wordpress',
  'shopify',
  'postgresql',
];

const sanitizeSearchTermForPostgrest = (value: string): string =>
  String(value || '')
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

const deriveExperienceLevelFromYears = (
  years: number
): FreelancerProfile['experienceLevel'] => {
  if (years >= 8) return 'Expert';
  if (years >= 3) return 'Intermediate';
  return 'Entry';
};

const looksLikeGibberish = (text: string): boolean => {
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  if (!normalized) return true;
  if (normalized.length <= 2) return true;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const longToken = tokens.find((token) => token.length >= 12 && /^([a-z])\1+$/i.test(token));
  if (longToken) return true;

  const uniqueTokens = new Set(tokens);
  const diversity = uniqueTokens.size / tokens.length;
  if (tokens.length >= 3 && diversity < 0.4) return true;

  return false;
};

const extractSkillsFromText = (text: string): string[] => {
  const lower = String(text || '').toLowerCase();
  const fromKnown = KNOWN_SKILLS.filter((skill) => lower.includes(skill)).map((skill) =>
    skill
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('.')
  );

  const phraseMatches = String(text || '').match(/[a-zA-Z][a-zA-Z0-9+.#/-]{2,20}/g) || [];
  const fromPhrases = phraseMatches
    .map((token) => token.trim())
    .filter((token) => /^[a-z0-9+.#/-]+$/i.test(token))
    .map((token) => token.replace(/\.$/, ''))
    .filter((token) => token.length >= 3 && token.length <= 20)
    .filter((token) => !/^(and|the|for|with|from|this|that|have|just|like|many|none|nope|n\/a)$/i.test(token))
    .slice(0, 8)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1));

  return [...new Set([...fromKnown, ...fromPhrases])].slice(0, 12);
};

const inferTechnologies = (text: string): string[] =>
  KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(text))
    .slice(0, 8)
    .map((skill) =>
      skill
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('.')
    );

const buildFallbackProposal = (
  settings: ProposalSettings,
  profile?: FreelancerProfile | null
): string => {
  const tones: Record<'professional' | 'friendly' | 'confident', string> = {
    professional: 'I am writing to express my strong interest in your project.',
    friendly: 'Hi there! I saw your project and got excited because it is a great fit for my background.',
    confident: 'I am the expert you are looking for to deliver this project successfully.',
  };

  const selectedTone: 'professional' | 'friendly' | 'confident' =
    settings.tone === 'friendly' || settings.tone === 'confident'
      ? settings.tone
      : 'professional';
  let intro = tones[selectedTone];

  if (profile && profile.skills.length > 0) {
    if (selectedTone === 'friendly') {
      intro = `Hi there! I'm a ${profile.skills[0]} specialist with ${profile.yearsExperience} years of experience, and I'd love to help you with this project.`;
    } else if (selectedTone === 'confident') {
      intro = `With ${profile.yearsExperience} years of experience shipping production-grade ${profile.skills[0]} work, I am the right partner to deliver this project.`;
    }
  }

  const skillsMention = profile?.skills?.length
    ? profile.skills.slice(0, 3).join(', ')
    : 'React, TypeScript, and Tailwind CSS';
  let body = `I have extensive experience with ${skillsMention}, which aligns closely with your requirements. I focus on clean architecture, maintainable code, and clear communication throughout delivery.`;

  if (profile && profile.pastProjects.length > 0) {
    const proj = profile.pastProjects[0];
    body += `\n\nFor example, I recently built ${proj.name}, where I used ${proj.technologies.join(', ')}. ${proj.description}`;
  }

  if (settings.highlights?.includes('fast_turnaround')) {
    body += '\n\nI can start immediately and deliver a high-quality first draft quickly.';
  }

  if (settings.highlights?.includes('portfolio') && profile?.portfolioUrl) {
    body += `\n\nYou can see relevant samples here: ${profile.portfolioUrl}`;
  }

  return `${intro}

${body}

I would love to discuss scope, timeline, and expected outcomes so we can begin with confidence.

Best regards,
[Your Name]`;
};

const buildLocalProfileAssistantFallback = (
  message: string,
  profile: FreelancerProfile,
  context?: ProfileAssistantContext
): ProfileAssistantResult => {
  const patch: Partial<FreelancerProfile> = {};
  const text = message.trim();
  const lower = text.toLowerCase();
  const stepId = String(context?.currentStepId || '').toLowerCase();
  const nextPrompt = context?.nextStepPrompt ? ` ${context.nextStepPrompt}` : '';
  const wantsSkip = /^(skip|none|n\/a|na|nope|no)$/i.test(text);
  const gibberish = looksLikeGibberish(text);

  const urls = text.match(/https?:\/\/[^\s)]+/gi) || [];
  if (urls.length > 0) {
    const first = urls[0];
    if (/linkedin\.com/i.test(first)) {
      patch.linkedinUrl = first;
    } else {
      patch.portfolioUrl = first;
    }
  }

  const yearsMatch = text.match(/(\d{1,2})\s*(?:\+?\s*)?(?:years?|yrs?)/i) || text.match(/^(\d{1,2})$/);
  if (yearsMatch) {
    const years = Math.max(0, Math.min(60, Number(yearsMatch[1])));
    patch.yearsExperience = years;
    patch.experienceLevel = deriveExperienceLevelFromYears(years);
  }

  const rateMatch =
    text.match(/\$?\s*(\d{2,4})(?:\s*\/?\s*(?:hr|hour))/i) ||
    (stepId === 'rate' ? text.match(/\b(\d{2,4})\b/) : null);
  if (rateMatch) {
    patch.hourlyRate = Math.max(0, Math.min(10000, Number(rateMatch[1])));
  }

  if ((stepId === 'intro' || lower.includes('skill') || lower.includes('service')) && !gibberish) {
    const discoveredSkills = extractSkillsFromText(text);
    if (discoveredSkills.length > 0) {
      patch.skills = [...new Set([...(profile.skills || []), ...discoveredSkills])].slice(0, 24);
    }
  }

  if ((stepId === 'project' || lower.includes('project') || lower.length > 80) && !gibberish && !wantsSkip) {
    const technologies = inferTechnologies(text);
    const nameFromPrefix = text.match(/(?:project|built|created)\s*[:-]?\s*([^.:\n]{4,80})/i)?.[1]?.trim();
    patch.pastProjects = [
      {
        id: `generated-${Date.now()}`,
        name: nameFromPrefix || 'Client Project',
        description: text.slice(0, 500),
        technologies,
      },
    ];
  }

  if ((stepId === 'bio' || lower.includes('bio') || text.length >= 80) && !gibberish && !wantsSkip) {
    patch.bio = text.slice(0, 600);
  }

  const hasUsefulPatch = Object.keys(patch).length > 0;
  if (hasUsefulPatch) {
    return {
      reply: `I updated your profile with what I could confidently extract.${nextPrompt}`.trim(),
      profilePatch: patch,
    };
  }

  if (wantsSkip) {
    return {
      reply: `No problem, I can skip this part.${nextPrompt}`.trim(),
      profilePatch: {},
    };
  }

  if (stepId === 'intro') {
    return {
      reply:
        'Tell me your main services as a short list, like "React development, UI design, API integrations".',
      profilePatch: {},
    };
  }
  if (stepId === 'experience') {
    return {
      reply: 'Please share your years of experience as a number, like "4 years".',
      profilePatch: {},
    };
  }
  if (stepId === 'portfolio') {
    return {
      reply: 'Please paste your portfolio/GitHub/LinkedIn URL, or say "skip".',
      profilePatch: {},
    };
  }
  if (stepId === 'project') {
    return {
      reply:
        'Share one project with what you built and tech used. Example: "Built an e-commerce dashboard in React + Supabase for a retail client."',
      profilePatch: {},
    };
  }
  if (stepId === 'rate') {
    return {
      reply: 'What is your target hourly rate in USD? Example: "$35/hr".',
      profilePatch: {},
    };
  }
  if (stepId === 'bio') {
    return {
      reply:
        'Write 2-3 lines about your strengths and client outcomes. I will turn it into a polished bio.',
      profilePatch: {},
    };
  }

  return {
    reply: `I captured that context. Share specifics like skills, years, hourly rate, bio, or links and I will update them.${nextPrompt}`.trim(),
    profilePatch: {},
  };
};

export const generateProposal = async (
  jobId: string,
  settings: ProposalSettings,
  profile?: FreelancerProfile | null
): Promise<{ proposal: string; creditsRemaining: number; provider?: string; warning?: string | null }> => {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { proposal: buildFallbackProposal(settings, profile), creditsRemaining: 2 };
  }

  const token = await getSupabaseToken();
  if (!token) {
    throw new Error('Unauthorized');
  }

  const response = await fetchWithTimeout(
    '/api/ai/proposal',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId,
        settings,
        profile,
      }),
    },
    25000
  );

  const body = await parseJsonSafe<{
    proposal?: string;
    creditsRemaining?: number;
    error?: string;
    provider?: string;
    warning?: string | null;
  }>(response);
  if (!response.ok) {
    throw new Error(body?.error || 'Failed to generate proposal');
  }

  const proposal = String(body?.proposal || '').trim();
  if (!proposal) {
    throw new Error('AI returned an empty proposal');
  }

  return {
    proposal,
    creditsRemaining: Number.isFinite(Number(body?.creditsRemaining))
      ? Number(body?.creditsRemaining)
      : 0,
    provider: typeof body?.provider === 'string' ? String(body.provider) : undefined,
    warning: typeof body?.warning === 'string' ? String(body.warning) : null,
  };
};

export const generateProfileAssistantReply = async (
  message: string,
  profile: FreelancerProfile,
  context?: ProfileAssistantContext,
  history: ProfileAssistantHistoryMessage[] = []
): Promise<ProfileAssistantResult> => {
  const fallback = buildLocalProfileAssistantFallback(message, profile, context);

  if (!supabase) {
    return fallback;
  }

  const token = await getSupabaseToken();
  if (!token) {
    return fallback;
  }

  try {
    const response = await fetchWithTimeout(
      '/api/ai/profile-assistant',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          profile,
          context,
          history: history.slice(-12),
        }),
      },
      20000
    );

    const body = await parseJsonSafe<{ reply?: string; profilePatch?: Partial<FreelancerProfile>; error?: string }>(response);
    if (!response.ok) {
      const errorMessage = body?.error || 'Failed to process profile assistant request';
      return {
        reply: /fireworks/i.test(errorMessage)
          ? `${fallback.reply} (AI provider temporarily unavailable, using local assistant mode.)`
          : fallback.reply,
        profilePatch: fallback.profilePatch,
      };
    }

    const reply = String(body?.reply || '').trim();
    const profilePatch =
      body?.profilePatch && typeof body.profilePatch === 'object' ? body.profilePatch : {};

    if (!reply && Object.keys(profilePatch).length === 0) {
      return fallback;
    }

    return {
      reply: reply || fallback.reply,
      profilePatch,
    };
  } catch {
    return fallback;
  }
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
  if (freelancerProfilesTableUnavailable) {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: new Error('Unauthorized') };

  type DbFreelancerProfile = {
    id?: string;
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
    preferences?: FreelancerProfile['preferences'] | null;
    notification_settings?: FreelancerProfile['notificationSettings'] | null;
  };

  try {
    let data: DbFreelancerProfile | null = null;
    let error: DbErrorLike = null;

    const keyCandidates: Array<'user_id' | 'id'> = freelancerProfileKeyPreference
      ? [freelancerProfileKeyPreference, freelancerProfileKeyPreference === 'user_id' ? 'id' : 'user_id']
      : ['user_id', 'id'];

    for (const key of keyCandidates) {
      const result = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq(key, user.id)
        .maybeSingle();
      const resultError = normalizeDbError(result.error);
      if (!resultError) {
        data = (result.data as DbFreelancerProfile | null) || null;
        error = null;
        freelancerProfileKeyPreference = key;
        break;
      }

      // Try fallback key only when this key is missing in current schema.
      if (/column .* does not exist|Could not find .* in the schema cache/i.test(resultError.message || '')) {
        error = resultError;
        continue;
      }

      error = resultError;
      break;
    }

    if (error) {
      if (isSchemaOrRelationError(error)) {
        freelancerProfilesTableUnavailable = true;
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
        return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
      }
      return { data: null, error: new Error(error.message || 'Failed to load profile') };
    }

    if (!data) {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      return { data: saved ? (JSON.parse(saved) as FreelancerProfile) : null, error: null };
    }

    const row = data as DbFreelancerProfile;
    const rowUserId = row.user_id || row.id || user.id;
    const profile: FreelancerProfile = {
      id: rowUserId,
      userId: rowUserId,
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
  } catch (error) {
    if (isSchemaOrRelationError(normalizeDbError(error))) {
      freelancerProfilesTableUnavailable = true;
    }
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
  if (freelancerProfilesTableUnavailable) {
    return { data: profile, error: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: profile, error: new Error('Unauthorized') };

  try {
    const basePayload = {
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
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase
      .from('freelancer_profiles')
      .upsert(
        {
          ...basePayload,
          preferences: profile.preferences || {},
          notification_settings: profile.notificationSettings || {},
        },
        { onConflict: 'user_id' }
      );

    // Backward-compatible fallback for schemas missing preferences/notification_settings.
    if (error && /column .*freelancer_profiles.*(preferences|notification_settings).*does not exist|Could not find .* (preferences|notification_settings)/i.test(error.message || '')) {
      const fallback = await supabase
        .from('freelancer_profiles')
        .upsert(basePayload, { onConflict: 'user_id' });
      error = fallback.error;
    }

    if (error) {
      if (isSchemaOrRelationError(normalizeDbError(error))) {
        freelancerProfilesTableUnavailable = true;
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

export type RazorpayCheckoutOrder = {
  provider: 'razorpay';
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
    name?: string;
    contact?: string;
  };
  successUrl?: string;
  cancelUrl?: string;
  pricing?: {
    baseAmountMinor: number;
    discountAmountMinor: number;
    finalAmountMinor: number;
    promoCodeApplied: string | null;
    promoDescription: string | null;
  };
};

export type BillingCheckoutSession = {
  url: string | null;
  razorpayOrder: RazorpayCheckoutOrder | null;
  error: Error | null;
};

export const createStripeCheckoutSession = async (
  options?: { promoCode?: string | null }
): Promise<BillingCheckoutSession> => {
  if (!supabase) return { url: null, razorpayOrder: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { url: null, razorpayOrder: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        promoCode: String(options?.promoCode || '').trim() || undefined,
      }),
    }, 15000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { url: null, razorpayOrder: null, error: new Error(body.error || 'Failed to start checkout') };

    if (body?.provider === 'razorpay' && body?.orderId && body?.keyId) {
      return {
        url: null,
        razorpayOrder: {
          provider: 'razorpay',
          keyId: String(body.keyId),
          orderId: String(body.orderId),
          amount: Number(body.amount || 0),
          currency: String(body.currency || 'USD'),
          name: String(body.name || 'GetSoloDesk'),
          description: String(body.description || 'GetSoloDesk Pro'),
          prefill: body.prefill && typeof body.prefill === 'object' ? body.prefill : undefined,
          successUrl: body.successUrl ? String(body.successUrl) : undefined,
          cancelUrl: body.cancelUrl ? String(body.cancelUrl) : undefined,
          pricing: body.pricing && typeof body.pricing === 'object'
            ? {
                baseAmountMinor: Number(body.pricing.baseAmountMinor || 0),
                discountAmountMinor: Number(body.pricing.discountAmountMinor || 0),
                finalAmountMinor: Number(body.pricing.finalAmountMinor || 0),
                promoCodeApplied: body.pricing.promoCodeApplied
                  ? String(body.pricing.promoCodeApplied)
                  : null,
                promoDescription: body.pricing.promoDescription
                  ? String(body.pricing.promoDescription)
                  : null,
              }
            : undefined,
        },
        error: null,
      };
    }

    if (!body.url) return { url: null, razorpayOrder: null, error: new Error('Checkout session missing') };
    return { url: body.url, razorpayOrder: null, error: null };
  } catch {
    return { url: null, razorpayOrder: null, error: new Error('Failed to start checkout') };
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

export type FollowupReminderSweepResult = {
  success: boolean;
  triggered_by?: 'secret' | 'admin_user';
  scanned: number;
  due: number;
  sent: number;
  skipped: number;
  skipped_no_email: number;
  skipped_disabled: number;
  failed: number;
  timestamp: string;
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

export const verifyRazorpayPayment = async (
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
): Promise<{ success: boolean; status?: string; error: Error | null }> => {
  if (!supabase) return { success: false, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { success: false, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/payments/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }, 15000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: new Error(body.error || 'Failed to verify payment') };
    }
    return {
      success: Boolean(body.success),
      status: body.status ? String(body.status) : undefined,
      error: null,
    };
  } catch {
    return { success: false, error: new Error('Failed to verify payment') };
  }
};

export const runFollowupReminderSweepNow = async (): Promise<{
  data: FollowupReminderSweepResult | null;
  error: Error | null;
}> => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const token = await getSupabaseToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  try {
    const response = await fetchWithTimeout('/api/cron/followup-reminders-run-now', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, 45000);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to run follow-up sweep') };
    if (!body.success) return { data: null, error: new Error(body.error || 'Follow-up sweep did not complete') };
    return { data: body as FollowupReminderSweepResult, error: null };
  } catch {
    return { data: null, error: new Error('Failed to run follow-up sweep') };
  }
};
