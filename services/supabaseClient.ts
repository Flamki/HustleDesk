import { createClient, SupabaseClient } from '@supabase/supabase-js';

const sanitizeEnvValue = (value: unknown): string =>
  String(value ?? '')
    .replace(/^(["'])+|(["'])+$/g, '')
    .replace(/(?:\\r\\n|\\n|\\r)+$/g, '')
    .trim();

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const supabaseUrlFromEnv = trimTrailingSlash(sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL));
const supabaseAnonKey = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
const proxyModeSetting = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_PROXY_MODE).toLowerCase();
const supabaseProxyMode =
  proxyModeSetting
    ? proxyModeSetting === 'true'
    : false;

const proxyAllowedHostsFromEnv = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_PROXY_ALLOWED_HOSTS);
const proxyAllowedHosts = proxyAllowedHostsFromEnv
  ? proxyAllowedHostsFromEnv
      .split(',')
      .map((value: string) => value.trim().toLowerCase())
      .filter(Boolean)
  : ['getsolodesk.com', 'www.getsolodesk.com'];

type SupabaseBrowserClient = SupabaseClient<any, 'public', any>;

declare global {
  interface Window {
    __getsolodesk_supabase_client__?: SupabaseBrowserClient | null;
  }
}

const isLocalHost = (host: string): boolean => {
  const h = (host || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
};

const isProxyAllowedHost = (host: string): boolean => {
  const h = (host || '').toLowerCase();
  if (!h) return false;
  if (h.endsWith('.vercel.app')) return false;
  return proxyAllowedHosts.includes(h);
};

const resolveSupabaseUrl = (): string => {
  // Default to direct Supabase to keep auth/session stable.
  // Enable first-party proxy only when explicitly enabled and on approved hosts.
  if (
    typeof window !== 'undefined' &&
    import.meta.env.PROD &&
    supabaseProxyMode &&
    !isLocalHost(window.location.hostname) &&
    isProxyAllowedHost(window.location.hostname)
  ) {
    return `${trimTrailingSlash(window.location.origin)}/api/sb`;
  }
  return supabaseUrlFromEnv;
};

export const getSupabaseBaseUrl = (): string => resolveSupabaseUrl();
export const hasSupabase = Boolean(getSupabaseBaseUrl() && supabaseAnonKey);

const createSupabaseClient = (): SupabaseBrowserClient | null => {
  const baseUrl = getSupabaseBaseUrl();
  if (!hasSupabase) return null;

  const buildClient = (): SupabaseBrowserClient =>
    createClient(baseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });

  const isStorageJsonParseError = (error: unknown): boolean => {
    const message = String((error as { message?: string } | null)?.message ?? error ?? '').toLowerCase();
    return message.includes('not valid json') || message.includes('unexpected token');
  };

  const clearLikelyCorruptedAuthStorage = (): void => {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  };

  try {
    return buildClient();
  } catch (error) {
    if (typeof window !== 'undefined' && isStorageJsonParseError(error)) {
      try {
        clearLikelyCorruptedAuthStorage();
        return buildClient();
      } catch (retryError) {
        console.error('Supabase client init failed after auth storage cleanup:', retryError);
        return null;
      }
    }

    console.error('Supabase client init failed:', error);
    return null;
  }
};

export const supabase =
  typeof window === 'undefined'
    ? createSupabaseClient()
    : (window.__getsolodesk_supabase_client__ ??= createSupabaseClient());

export const getAuthBaseUrl = (): string => {
  const forced = sanitizeEnvValue(import.meta.env.VITE_AUTH_REDIRECT_ORIGIN);
  if (forced) {
    const clean = forced.replace(/\/+$/, '');
    // Safety guard: prevent production sessions from being redirected to localhost.
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      try {
        const forcedHost = new URL(clean).hostname;
        const currentHost = window.location.hostname;
        if (isLocalHost(forcedHost) && !isLocalHost(currentHost)) {
          return window.location.origin.replace(/\/+$/, '');
        }
      } catch {
        // Fall through and return clean value.
      }
    }
    return clean;
  }
  return window.location.origin;
};

