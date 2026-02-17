import { supabase } from './supabaseClient';

type MarketingSiteRow = {
  id: string;
  user_id: string;
  site_kind: 'link_in_bio' | 'portfolio';
  config: Record<string, any>;
  slug: string;
  name: string;
  template: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  logo_url: string | null;
  show_email_signup: boolean;
  show_portfolio: boolean;
  primary_color: string;
  accent_color: string;
  background_style: 'aurora' | 'grid' | 'plain';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type PortfolioItemRow = {
  id: string;
  user_id: string;
  site_id: string;
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type SignupRow = {
  id: string;
  site_id: string;
  email: string;
  name: string | null;
  consent: boolean;
  created_at: string;
};

export type WebsiteAnalyticsResponse = {
  range_days: number;
  metrics: {
    unique_visitors: number;
    page_views: number;
    sessions: number;
    signups: number;
    bounce_rate: number;
    avg_session_duration_sec: number;
    conversion_rate: number;
  };
  series: Array<{
    day: string;
    unique_visitors: number;
    page_views: number;
    sessions: number;
    signups: number;
    bounce_rate: number;
    session_duration_sec: number;
  }>;
  breakdowns: {
    pages: Array<{ label: string; value: number }>;
    referrers: Array<{ label: string; value: number }>;
    sources: Array<{ label: string; value: number }>;
    mediums: Array<{ label: string; value: number }>;
    campaigns: Array<{ label: string; value: number }>;
    countries: Array<{ label: string; value: number }>;
    devices: Array<{ label: string; value: number }>;
    links: Array<{ label: string; value: number }>;
  };
};

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 9000): Promise<Response> => {
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

export const listSites = async (): Promise<{ sites: MarketingSiteRow[]; error: Error | null }> => {
  if (!supabase) return { sites: [], error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { sites: [], error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout('/api/marketing/sites', { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { sites: [], error: new Error(body.error || 'Failed to load sites') };
    return { sites: Array.isArray(body.sites) ? (body.sites as MarketingSiteRow[]) : [], error: null };
  } catch {
    return { sites: [], error: new Error('Failed to load sites') };
  }
};

export const createSite = async (
  payload: Partial<
    Pick<MarketingSiteRow, 'name' | 'slug' | 'template' | 'headline' | 'subheadline' | 'cta_text'> &
      Pick<MarketingSiteRow, 'show_email_signup' | 'show_portfolio' | 'primary_color' | 'accent_color' | 'background_style' | 'site_kind' | 'config'> & {
        published: boolean;
      }
  >
): Promise<{ site: MarketingSiteRow | null; error: Error | null }> => {
  if (!supabase) return { site: null, error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { site: null, error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout('/api/marketing/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { site: (body.site ?? null) as MarketingSiteRow | null, error: new Error(body.error || 'Failed to create site') };
    return { site: (body.site ?? null) as MarketingSiteRow | null, error: null };
  } catch {
    return { site: null, error: new Error('Failed to create site') };
  }
};

export const updateSite = async (
  id: string,
  patch: Partial<Omit<MarketingSiteRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ site: MarketingSiteRow | null; error: Error | null }> => {
  if (!supabase) return { site: null, error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { site: null, error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout(`/api/marketing/sites?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { site: null, error: new Error(body.error || 'Failed to update site') };
    return { site: (body.site ?? null) as MarketingSiteRow | null, error: null };
  } catch {
    return { site: null, error: new Error('Failed to update site') };
  }
};

export const deleteSite = async (id: string): Promise<{ error: Error | null }> => {
  if (!supabase) return { error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout(`/api/marketing/sites?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { error: new Error(body.error || 'Failed to delete site') };
    return { error: null };
  } catch {
    return { error: new Error('Failed to delete site') };
  }
};

export const listPortfolioItems = async (siteId: string): Promise<{ items: PortfolioItemRow[]; error: Error | null }> => {
  if (!supabase) return { items: [], error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { items: [], error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout(`/api/marketing/portfolio?site_id=${encodeURIComponent(siteId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { items: [], error: new Error(body.error || 'Failed to load portfolio') };
    return { items: Array.isArray(body.items) ? (body.items as PortfolioItemRow[]) : [], error: null };
  } catch {
    return { items: [], error: new Error('Failed to load portfolio') };
  }
};

export const createPortfolioItem = async (
  payload: Pick<PortfolioItemRow, 'site_id' | 'title'> & Partial<Pick<PortfolioItemRow, 'description' | 'url' | 'tags' | 'sort_order'>>
): Promise<{ item: PortfolioItemRow | null; error: Error | null }> => {
  if (!supabase) return { item: null, error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { item: null, error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout('/api/marketing/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { item: null, error: new Error(body.error || 'Failed to create item') };
    return { item: (body.item ?? null) as PortfolioItemRow | null, error: null };
  } catch {
    return { item: null, error: new Error('Failed to create item') };
  }
};

export const deletePortfolioItem = async (id: string): Promise<{ error: Error | null }> => {
  if (!supabase) return { error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { error: new Error('Unauthorized') };

  try {
    const res = await fetchWithTimeout(`/api/marketing/portfolio?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { error: new Error(body.error || 'Failed to delete item') };
    return { error: null };
  } catch {
    return { error: new Error('Failed to delete item') };
  }
};

export const listSiteSignups = async (
  siteId: string,
  limit = 50,
  offset = 0
): Promise<{ signups: SignupRow[]; total: number; error: Error | null }> => {
  if (!supabase) return { signups: [], total: 0, error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { signups: [], total: 0, error: new Error('Unauthorized') };

  const params = new URLSearchParams({
    site_id: siteId,
    limit: String(limit),
    offset: String(offset),
  });

  try {
    const res = await fetchWithTimeout(`/api/marketing/site-signups?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { signups: [], total: 0, error: new Error(body.error || 'Failed to load signups') };
    return {
      signups: Array.isArray(body.signups) ? (body.signups as SignupRow[]) : [],
      total: body.total || 0,
      error: null,
    };
  } catch {
    return { signups: [], total: 0, error: new Error('Failed to load signups') };
  }
};

export const fetchWebsiteAnalytics = async (
  siteId: string,
  days = 28
): Promise<{ data: WebsiteAnalyticsResponse | null; error: Error | null }> => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const token = await getToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  const params = new URLSearchParams({ site_id: siteId, days: String(days) });
  try {
    const res = await fetchWithTimeout(`/api/marketing/website-analytics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: new Error(body.error || 'Failed to load analytics') };
    return { data: body as WebsiteAnalyticsResponse, error: null };
  } catch {
    return { data: null, error: new Error('Failed to load analytics') };
  }
};

export type PublicSiteResponse = {
  site: {
    id: string;
    user_id: string;
    site_kind: 'link_in_bio' | 'portfolio';
    config: Record<string, any>;
    slug: string;
    name: string;
    template: string;
    headline: string;
    subheadline: string;
    cta_text: string;
    logo_url: string | null;
    show_email_signup: boolean;
    show_portfolio: boolean;
    primary_color: string;
    accent_color: string;
    background_style: 'aurora' | 'grid' | 'plain';
    published_at: string;
  };
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    url: string | null;
    tags: string[];
    sort_order: number;
    created_at: string;
  }>;
};

export const fetchPublicSite = async (slug: string): Promise<{ data: PublicSiteResponse | null; error: Error | null }> => {
  try {
    const res = await fetchWithTimeout(`/api/public/site?slug=${encodeURIComponent(slug)}`, { method: 'GET' }, 12000);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: new Error(body.error || 'Failed to load site') };
    return { data: body as PublicSiteResponse, error: null };
  } catch {
    return { data: null, error: new Error('Failed to load site') };
  }
};

export const submitPublicSignup = async (
  slug: string,
  payload: { email: string; name?: string; consent?: boolean }
): Promise<{ ok: boolean; error: Error | null }> => {
  try {
    const res = await fetchWithTimeout(
      '/api/public/site-signup',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: payload.email, name: payload.name || '', consent: payload.consent !== false, website: '' }),
      },
      12000
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: new Error(body.error || 'Signup failed') };
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: new Error('Signup failed') };
  }
};

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getAnonId = () => {
  const key = 'mk_anon_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = `anon_${randomId()}`;
  localStorage.setItem(key, created);
  return created;
};

const getSessionId = (slug: string) => {
  const key = `mk_session_${slug}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = `sess_${randomId()}`;
  localStorage.setItem(key, created);
  return created;
};

export const trackPublicSiteEvent = async (
  slug: string,
  eventType: 'page_view' | 'session_start' | 'link_click' | 'signup',
  metadata: Record<string, any> = {}
): Promise<void> => {
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    const payload = {
      slug,
      event_type: eventType,
      anon_id: getAnonId(),
      session_id: getSessionId(slug),
      metadata: {
        ...metadata,
        path: metadata.path || `${window.location.pathname}${window.location.hash || ''}`,
        referrer_host: metadata.referrer_host || (ref?.host || '(direct)'),
        utm_source: metadata.utm_source || new URLSearchParams(window.location.search).get('utm_source') || '',
        utm_medium: metadata.utm_medium || new URLSearchParams(window.location.search).get('utm_medium') || '',
        utm_campaign: metadata.utm_campaign || new URLSearchParams(window.location.search).get('utm_campaign') || '',
        device: metadata.device || (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1200 ? 'tablet' : 'desktop'),
      },
    };
    await fetchWithTimeout(
      '/api/public/site-event',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      6000
    );
  } catch {
    // no-op for analytics tracking errors
  }
};
