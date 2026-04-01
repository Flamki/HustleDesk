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
    : Boolean(import.meta.env.PROD);

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

const resolveSupabaseUrl = (): string => {
  // Default to direct Supabase to keep auth/session stable.
  // Enable first-party proxy only when VITE_SUPABASE_PROXY_MODE=true.
  if (
    typeof window !== 'undefined' &&
    import.meta.env.PROD &&
    supabaseProxyMode &&
    !isLocalHost(window.location.hostname)
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
  return createClient(baseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });
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

