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

export const getAuthBaseUrl = (): string => {
  const forced = (import.meta.env.VITE_AUTH_REDIRECT_ORIGIN || '').trim();
  if (forced) return forced.replace(/\/+$/, '');
  return window.location.origin;
};
