import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { secureJson } from '../_shared/security.js';

const json = secureJson;

const getHeader = (req, name) => {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isLikelyResendKey = (value) => /^re_[A-Za-z0-9]+/.test(String(value || '').trim());

const getDomainFromEmail = (email) => {
  if (!isValidEmail(email)) return '';
  return String(email).trim().split('@')[1].toLowerCase();
};

const isDomainVerified = (domainRow) => {
  if (!domainRow || typeof domainRow !== 'object') return false;
  const status = String(domainRow.status || '').toLowerCase();
  if (status === 'verified' || status === 'active') return true;

  const records = Array.isArray(domainRow.records) ? domainRow.records : [];
  if (records.length > 0) {
    const allVerified = records.every((r) => String(r?.status || '').toLowerCase() === 'verified');
    if (allVerified) return true;
  }

  return false;
};

const checkResendDomain = async (apiKey, domain) => {
  const result = {
    checked: false,
    domain,
    domain_found: false,
    domain_verified: false,
    status: null,
    open_tracking: null,
    click_tracking: null,
    pending_records: 0,
    error: null,
  };

  if (!apiKey || !domain) return result;

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    result.checked = true;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      result.error = body?.message || body?.error || `HTTP ${response.status}`;
      return result;
    }

    const domains = Array.isArray(body?.data) ? body.data : [];
    const match = domains.find((d) => String(d?.name || '').toLowerCase() === domain);
    if (!match) return result;

    result.domain_found = true;
    result.status = String(match.status || '').toLowerCase() || null;
    result.open_tracking = match.open_tracking ?? null;
    result.click_tracking = match.click_tracking ?? null;
    result.domain_verified = isDomainVerified(match);

    if (Array.isArray(match.records)) {
      result.pending_records = match.records.filter(
        (r) => String(r?.status || '').toLowerCase() !== 'verified'
      ).length;
    }

    return result;
  } catch (err) {
    result.checked = true;
    result.error = err instanceof Error ? err.message : 'Failed to call Resend domains API';
    return result;
  }
};

const checkSupabaseConnectivity = async (url, serviceRoleKey) => {
  const out = {
    users_table_access: false,
    auth_admin_access: false,
    error: null,
  };
  if (!url || !serviceRoleKey) return out;

  try {
    const serviceClient = createClient(url, serviceRoleKey);
    const [{ error: usersError }, { error: authError }] = await Promise.all([
      serviceClient.from('users').select('id', { head: true, count: 'exact' }).limit(1),
      serviceClient.auth.admin.listUsers({ page: 1, perPage: 1 }),
    ]);

    out.users_table_access = !usersError;
    out.auth_admin_access = !authError;
    if (usersError || authError) {
      out.error = usersError?.message || authError?.message || 'Supabase connectivity checks failed';
    }
    return out;
  } catch (err) {
    out.error = err instanceof Error ? err.message : 'Supabase connectivity checks failed';
    return out;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const expectedToken = process.env.HEALTHCHECK_TOKEN || process.env.CRON_SECRET || '';
  const hasConfiguredToken = Boolean(expectedToken) && !/SET_A_LONG_RANDOM_TOKEN/i.test(expectedToken);
  if (expectedToken) {
    const providedToken =
      getHeader(req, 'x-health-token') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
    if (!safeEqual(providedToken, expectedToken)) {
      return json(res, 401, { error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

  const resendApiKey = process.env.RESEND_API_KEY || '';
  const fromEmail = process.env.MARKETING_FROM_EMAIL || '';
  const fromName = process.env.MARKETING_FROM_NAME || 'GetSoloDesk';
  const appBaseUrl =
    process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || process.env.VITE_AUTH_REDIRECT_ORIGIN || '';
  const fromDomain = getDomainFromEmail(fromEmail);

  const supabaseConnectivity = await checkSupabaseConnectivity(supabaseUrl, supabaseServiceRoleKey);
  const resendDomain = await checkResendDomain(resendApiKey, fromDomain);

  const authEmail = {
    supabase_url_present: Boolean(supabaseUrl),
    supabase_anon_key_present: Boolean(supabaseAnonKey),
    supabase_service_role_present: Boolean(supabaseServiceRoleKey),
    supabase_users_table_access: supabaseConnectivity.users_table_access,
    supabase_auth_admin_access: supabaseConnectivity.auth_admin_access,
    smtp_config_checked: false,
    note: 'Supabase SMTP provider settings are not readable from this runtime. Verify in Supabase Auth settings.',
  };

  const followupEmail = {
    resend_api_key_present: Boolean(resendApiKey),
    resend_api_key_format_ok: isLikelyResendKey(resendApiKey),
    from_email_present: Boolean(fromEmail),
    from_email_valid: isValidEmail(fromEmail),
    from_name_present: Boolean(String(fromName || '').trim()),
    app_base_url_present: Boolean(String(appBaseUrl || '').trim()),
    resend_domain_checked: resendDomain.checked,
    resend_domain_found: resendDomain.domain_found,
    resend_domain_verified: resendDomain.domain_verified,
    resend_domain_status: resendDomain.status,
    resend_pending_dns_records: resendDomain.pending_records,
  };

  const warnings = [];
  if (!authEmail.supabase_url_present || !authEmail.supabase_anon_key_present || !authEmail.supabase_service_role_present) {
    warnings.push('Supabase auth runtime env is incomplete.');
  }
  if (supabaseConnectivity.error) warnings.push(`Supabase connectivity warning: ${supabaseConnectivity.error}`);
  if (!followupEmail.from_email_valid) warnings.push('MARKETING_FROM_EMAIL is missing or invalid.');
  if (!followupEmail.resend_api_key_format_ok) warnings.push('RESEND_API_KEY looks invalid.');
  if (resendDomain.error) warnings.push(`Resend domain check warning: ${resendDomain.error}`);
  if (resendDomain.checked && !resendDomain.domain_found) warnings.push(`Resend domain "${fromDomain}" not found.`);
  if (resendDomain.checked && resendDomain.domain_found && !resendDomain.domain_verified) {
    warnings.push('Resend domain is found but not verified yet. Complete DNS setup.');
  }

  const followupReady =
    followupEmail.resend_api_key_present &&
    followupEmail.resend_api_key_format_ok &&
    followupEmail.from_email_valid &&
    followupEmail.app_base_url_present &&
    followupEmail.resend_domain_found &&
    followupEmail.resend_domain_verified;

  const authPrerequisitesReady =
    authEmail.supabase_url_present &&
    authEmail.supabase_anon_key_present &&
    authEmail.supabase_service_role_present &&
    authEmail.supabase_users_table_access &&
    authEmail.supabase_auth_admin_access;

  return json(res, 200, {
    ok: authPrerequisitesReady && followupReady,
    auth_prerequisites_ready: authPrerequisitesReady,
    followup_email_ready: followupReady,
    health_token_configured: hasConfiguredToken,
    from_email: fromEmail || null,
    from_domain: fromDomain || null,
    checks: {
      auth_email: authEmail,
      followup_email: followupEmail,
      resend_domain: resendDomain,
    },
    warnings,
    timestamp: new Date().toISOString(),
  });
}

export const __private = {
  getDomainFromEmail,
  isDomainVerified,
  isLikelyResendKey,
};
