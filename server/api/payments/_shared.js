import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export const getRazorpayConfig = () => {
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
  }
  return {
    keyId: razorpayKeyId,
    keySecret: razorpayKeySecret,
    webhookSecret: razorpayWebhookSecret,
    currency: String(process.env.RAZORPAY_CURRENCY || 'USD').trim().toUpperCase() || 'USD',
    planName: String(process.env.RAZORPAY_PRO_PLAN_NAME || 'GetSoloDesk Pro').trim() || 'GetSoloDesk Pro',
    amountMinor: Number.parseInt(process.env.RAZORPAY_PRO_AMOUNT_MINOR || '900', 10) || 900,
  };
};

export const callRazorpayApi = async (endpoint, options = {}) => {
  const config = getRazorpayConfig();
  const method = options.method || 'GET';
  const headers = {
    Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };

  const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body?.error?.description || body?.error?.reason || body?.error || 'Razorpay API request failed';
    throw new Error(message);
  }

  return body;
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

