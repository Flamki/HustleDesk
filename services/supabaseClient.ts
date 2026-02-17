import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

type SupabaseBrowserClient = SupabaseClient<any, 'public', any>;

declare global {
  interface Window {
    __hustledesk_supabase_client__?: SupabaseBrowserClient | null;
  }
}

const createSupabaseClient = (): SupabaseBrowserClient | null => {
  if (!hasSupabase) return null;
  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
};

export const supabase =
  typeof window === 'undefined'
    ? createSupabaseClient()
    : (window.__hustledesk_supabase_client__ ??= createSupabaseClient());

const isLocalHost = (host: string): boolean => {
  const h = (host || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
};

export const getAuthBaseUrl = (): string => {
  const forced = (import.meta.env.VITE_AUTH_REDIRECT_ORIGIN || '').trim();
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
