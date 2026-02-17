import { supabase } from './supabaseClient';

export type TemplateOverrideRow = {
  template_key: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = 'template_overrides_v1';

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 7000): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

const getToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const loadLocal = (): Record<string, TemplateOverrideRow> => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, TemplateOverrideRow>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveLocal = (map: Record<string, TemplateOverrideRow>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const listTemplateOverrides = async (): Promise<{ overrides: TemplateOverrideRow[]; error: Error | null }> => {
  if (!supabase) {
    return { overrides: Object.values(loadLocal()), error: null };
  }

  const token = await getToken();
  if (!token) return { overrides: [], error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout('/api/templates/overrides', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { overrides: [], error: new Error(body.error || 'Failed to load template overrides') };
    return { overrides: Array.isArray(body.overrides) ? (body.overrides as TemplateOverrideRow[]) : [], error: null };
  } catch {
    return { overrides: [], error: new Error('Failed to load template overrides') };
  }
};

export const upsertTemplateOverride = async (
  templateKey: string,
  title: string,
  content: string
): Promise<{ override: TemplateOverrideRow | null; error: Error | null }> => {
  const safeKey = templateKey.trim();
  if (!safeKey) return { override: null, error: new Error('template_key is required') };

  if (!supabase) {
    const map = loadLocal();
    const now = new Date().toISOString();
    const row: TemplateOverrideRow = {
      template_key: safeKey,
      title: title.trim(),
      content: content.trim(),
      created_at: map[safeKey]?.created_at ?? now,
      updated_at: now,
    };
    map[safeKey] = row;
    saveLocal(map);
    return { override: row, error: null };
  }

  const token = await getToken();
  if (!token) return { override: null, error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout('/api/templates/overrides', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ template_key: safeKey, title, content }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { override: null, error: new Error(body.error || 'Failed to save override') };
    return { override: (body.override ?? null) as TemplateOverrideRow | null, error: null };
  } catch {
    return { override: null, error: new Error('Failed to save override') };
  }
};

export const deleteTemplateOverride = async (templateKey: string): Promise<{ error: Error | null }> => {
  const safeKey = templateKey.trim();
  if (!safeKey) return { error: new Error('template_key is required') };

  if (!supabase) {
    const map = loadLocal();
    delete map[safeKey];
    saveLocal(map);
    return { error: null };
  }

  const token = await getToken();
  if (!token) return { error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout(`/api/templates/overrides?template_key=${encodeURIComponent(safeKey)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { error: new Error(body.error || 'Failed to delete override') };
    return { error: null };
  } catch {
    return { error: new Error('Failed to delete override') };
  }
};

