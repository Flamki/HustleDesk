import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export const getStripe = () => {
  if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(stripeSecretKey);
};

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey);
};

export const getAuthedUser = async (req) => {
  if (!supabaseUrl || !supabaseAnonKey) return { user: null, error: 'Supabase env missing' };
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { user: null, error: 'Unauthorized' };

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();
  if (error || !user) return { user: null, error: 'Unauthorized' };
  return { user, error: null };
};

export const getRequestOrigin = (req) => {
  const explicit = process.env.APP_BASE_URL || process.env.VITE_AUTH_REDIRECT_ORIGIN || '';
  if (explicit) return explicit.replace(/\/+$/, '');

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (host) return `${proto}://${host}`.replace(/\/+$/, '');

  return 'http://localhost:5173';
};

export const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
};

