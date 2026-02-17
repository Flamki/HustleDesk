import { TimeEntriesQuery, TimeEntriesResponse, TimeEntry } from '../types';
import { hasSupabase, supabase } from './supabaseClient';

const STORAGE_KEY = 'time_entries_local_v1';
const TIME_ENTRIES_CACHE_TTL_MS = 10_000;
type TimeEntriesCacheEntry = { ts: number; data: TimeEntriesResponse };
const timeEntriesCache = new Map<string, TimeEntriesCacheEntry>();

const readFreshTimeEntriesCache = (key: string): TimeEntriesResponse | null => {
  const entry = timeEntriesCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TIME_ENTRIES_CACHE_TTL_MS) return null;
  return entry.data;
};

const invalidateTimeEntriesCache = () => {
  timeEntriesCache.clear();
};

type DbTimeEntry = {
  id: string;
  user_id: string;
  job_id: string | null;
  client: string;
  project: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  hourly_rate: number;
  currency: string;
  earnings: number;
  created_at: string;
};

const mapDbToApp = (row: DbTimeEntry): TimeEntry => ({
  id: row.id,
  userId: row.user_id,
  jobId: row.job_id ?? undefined,
  client: row.client,
  project: row.project,
  description: row.description || '',
  startTime: row.start_time,
  endTime: row.end_time,
  durationSeconds: row.duration_seconds,
  hourlyRate: Number(row.hourly_rate || 0),
  currency: row.currency || 'USD',
  earnings: Number(row.earnings || 0),
  createdAt: row.created_at,
});

const toDb = (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'userId'> & Partial<Pick<TimeEntry, 'userId'>>) => ({
  job_id: entry.jobId ?? null,
  client: entry.client.trim(),
  project: entry.project.trim(),
  description: (entry.description || '').trim(),
  start_time: entry.startTime,
  end_time: entry.endTime,
  duration_seconds: Math.max(0, Math.floor(entry.durationSeconds)),
  hourly_rate: Number(entry.hourlyRate || 0),
  currency: (entry.currency || 'USD').trim().slice(0, 10) || 'USD',
  earnings: Number(entry.earnings || 0),
});

const getToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 6500
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

const readLocal = (): TimeEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TimeEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocal = (entries: TimeEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const filterByQuery = (entries: TimeEntry[], query: TimeEntriesQuery) => {
  let next = [...entries];
  if (query.from) {
    const from = new Date(query.from).getTime();
    next = next.filter((e) => new Date(e.startTime).getTime() >= from);
  }
  if (query.to) {
    const to = new Date(query.to).getTime();
    next = next.filter((e) => new Date(e.startTime).getTime() <= to);
  }
  next.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const limit = Math.max(1, Math.min(200, query.limit ?? 100));
  const offset = Math.max(0, query.offset ?? 0);
  return { entries: next.slice(offset, offset + limit), total: next.length, limit, offset };
};

export const listTimeEntries = async (
  query: TimeEntriesQuery = {}
): Promise<{ data: TimeEntriesResponse; error: Error | null }> => {
  const key = JSON.stringify({
    from: query.from ?? '',
    to: query.to ?? '',
    limit: query.limit ?? 100,
    offset: query.offset ?? 0,
  });
  const cached = readFreshTimeEntriesCache(key);
  if (cached) return { data: cached, error: null };

  if (!supabase) {
    const result = filterByQuery(readLocal(), query);
    timeEntriesCache.set(key, { ts: Date.now(), data: result });
    return { data: result, error: null };
  }

  const limit = Math.max(1, Math.min(200, query.limit ?? 100));
  const offset = Math.max(0, query.offset ?? 0);
  const token = await getToken();

  if (token) {
    try {
      const params = new URLSearchParams();
      if (query.from) params.set('from', query.from);
      if (query.to) params.set('to', query.to);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetchWithTimeout(`/api/time-entries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }, 6500);
      if (response.ok) {
        const body = await response.json();
        return {
          data: (() => {
            const result = {
            entries: (body.entries as DbTimeEntry[]).map(mapDbToApp),
            total: body.total || 0,
            limit: body.limit || limit,
            offset: body.offset || offset,
            };
            timeEntriesCache.set(key, { ts: Date.now(), data: result });
            return result;
          })(),
          error: null,
        };
      }
      // In local Vite dev, serverless API routes are usually unavailable (404).
      // Fall back to direct Supabase queries below.
    } catch {
      // fallback below
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: { entries: [], total: 0, limit, offset }, error: null };

  let countQuery = supabase.from('time_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  let dataQuery = supabase.from('time_entries').select('*').eq('user_id', user.id);

  if (query.from) {
    countQuery = countQuery.gte('start_time', query.from);
    dataQuery = dataQuery.gte('start_time', query.from);
  }
  if (query.to) {
    countQuery = countQuery.lte('start_time', query.to);
    dataQuery = dataQuery.lte('start_time', query.to);
  }

  const { count, error: countError } = await countQuery;
  if (countError) return { data: { entries: [], total: 0, limit, offset }, error: countError };

  const { data, error } = await dataQuery
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { data: { entries: [], total: 0, limit, offset }, error };

  const result = {
    entries: (data as DbTimeEntry[]).map(mapDbToApp),
    total: count || 0,
    limit,
    offset,
  };
  timeEntriesCache.set(key, { ts: Date.now(), data: result });
  return { data: result, error: null };
};

export const createTimeEntry = async (
  payload: Omit<TimeEntry, 'id' | 'createdAt' | 'userId'>
): Promise<{ data: TimeEntry | null; error: Error | null }> => {
  if (!supabase) {
    const local: TimeEntry = {
      ...payload,
      id: `local_${Date.now()}`,
      userId: 'local_user',
      createdAt: new Date().toISOString(),
    };
    writeLocal([local, ...readLocal()]);
    invalidateTimeEntriesCache();
    return { data: local, error: null };
  }

  const token = await getToken();
  if (token) {
    try {
      const response = await fetchWithTimeout('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }, 6500);
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        invalidateTimeEntriesCache();
        return { data: mapDbToApp(body.entry as DbTimeEntry), error: null };
      }

      const shouldFallback = [404, 405, 500, 502, 503, 504].includes(response.status);
      if (!shouldFallback) {
        return { data: null, error: new Error(body.error || 'Failed to create time entry') };
      }
      // fallback below
    } catch {
      // fallback below
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: new Error('Unauthorized') };

  const { data, error } = await supabase
    .from('time_entries')
    .insert({ ...toDb(payload), user_id: user.id })
    .select('*')
    .single();
  if (error) return { data: null, error };
  invalidateTimeEntriesCache();
  return { data: mapDbToApp(data as DbTimeEntry), error: null };
};

export const updateTimeEntry = async (
  id: string,
  payload: Omit<TimeEntry, 'id' | 'createdAt' | 'userId'>
): Promise<{ data: TimeEntry | null; error: Error | null }> => {
  if (!supabase) {
    const entries = readLocal();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return { data: null, error: new Error('Time entry not found') };
    const updated: TimeEntry = { ...entries[idx], ...payload };
    entries[idx] = updated;
    writeLocal(entries);
    invalidateTimeEntriesCache();
    return { data: updated, error: null };
  }

  const token = await getToken();
  if (token) {
    try {
      const response = await fetchWithTimeout(`/api/time-entries?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }, 6500);
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        invalidateTimeEntriesCache();
        return { data: mapDbToApp(body.entry as DbTimeEntry), error: null };
      }

      const shouldFallback = [404, 405, 500, 502, 503, 504].includes(response.status);
      if (!shouldFallback) {
        return { data: null, error: new Error(body.error || 'Failed to update time entry') };
      }
      // fallback below
    } catch {
      // fallback below
    }
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update(toDb(payload))
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { data: null, error };
  invalidateTimeEntriesCache();
  return { data: mapDbToApp(data as DbTimeEntry), error: null };
};

export const deleteTimeEntry = async (id: string): Promise<{ error: Error | null }> => {
  if (!supabase) {
    writeLocal(readLocal().filter((e) => e.id !== id));
    invalidateTimeEntriesCache();
    return { error: null };
  }

  const token = await getToken();
  if (token) {
    try {
      const response = await fetchWithTimeout(`/api/time-entries?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }, 6500);
      if (response.ok) {
        invalidateTimeEntriesCache();
        return { error: null };
      }

      const shouldFallback = [404, 405, 500, 502, 503, 504].includes(response.status);
      if (!shouldFallback) {
        const body = await response.json().catch(() => ({}));
        return { error: new Error(body.error || 'Failed to delete time entry') };
      }
      // fallback below
    } catch {
      // fallback below
    }
  }

  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  if (!error) invalidateTimeEntriesCache();
  return { error: error ?? null };
};
