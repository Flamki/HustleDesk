import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const APP_BASE_URL = (process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || '').replace(/\/+$/, '');
const FROM_EMAIL = process.env.MARKETING_FROM_EMAIL || '';
const FROM_NAME = process.env.MARKETING_FROM_NAME || 'GetSoloDesk';
const isSchemaCompatibilityError = (message = '') =>
  /relation .* does not exist|column .* does not exist|Could not find .* in the schema cache/i.test(message);

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const getHeader = (req, name) => {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

const parseBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return {};
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const resolveUserEmail = async (supabase, userId) => {
  let email = '';

  try {
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (userError && !isSchemaCompatibilityError(userError.message || '')) {
      throw new Error(userError.message);
    }
    email = userRow?.email || '';
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to resolve destination user email');
  }

  if (isEmail(email)) return email;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) return email;
    return data?.user?.email || email;
  } catch {
    return email;
  }
};

const isAuthorizedCall = (req) => {
  const expected = process.env.CRON_SECRET || process.env.HEALTHCHECK_TOKEN || '';
  const authHeader = getHeader(req, 'authorization');
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return Boolean(expected && token === expected);
};

const renderReminderText = ({ title, company, platform, followupAt }) => {
  const dueLabel = followupAt ? new Date(followupAt).toLocaleString() : 'now';
  const place = company ? `${company} (${platform})` : platform;
  const appUrl = APP_BASE_URL || 'http://localhost:5173';

  return [
    `Test reminder: follow up on "${title}"`,
    '',
    `Client/platform: ${place}`,
    `Reminder time: ${dueLabel}`,
    '',
    `Open jobs: ${appUrl}/app/jobs`,
    '',
    'This is a manual test reminder email.',
  ].join('\n');
};

const sendEmail = async ({ to, subject, text }) => {
  const from = FROM_NAME ? `${FROM_NAME} <${FROM_EMAIL}>` : FROM_EMAIL;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.message || body?.error || 'Failed to send reminder email');
  }
  return body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!isAuthorizedCall(req)) return json(res, 401, { error: 'Unauthorized' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }
  if (!RESEND_API_KEY) return json(res, 500, { error: 'RESEND_API_KEY is required' });
  if (!FROM_EMAIL || !isEmail(FROM_EMAIL)) {
    return json(res, 500, { error: 'MARKETING_FROM_EMAIL must be a valid email' });
  }

  const body = parseBody(req);
  const requestedJobId = body.jobId ? String(body.jobId).trim() : '';
  const emailOverride = body.email ? String(body.email).trim() : '';
  const markAsSent = Boolean(body.markAsSent);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let jobQuery = supabase
    .from('jobs')
    .select('id,user_id,title,company,platform,status,followup_at,deleted_at')
    .eq('status', 'applied')
    .is('deleted_at', null)
    .not('followup_at', 'is', null);

  if (requestedJobId) {
    jobQuery = jobQuery.eq('id', requestedJobId);
  } else {
    jobQuery = jobQuery.order('followup_at', { ascending: true }).limit(1);
  }

  const { data: jobs, error: jobError } = await jobQuery;
  if (jobError) return json(res, 500, { error: jobError.message });

  const job = (jobs || [])[0];
  if (!job) {
    return json(res, 404, { error: 'No eligible applied job with follow-up time found' });
  }

  let targetEmail = emailOverride;
  if (!targetEmail) {
    try {
      targetEmail = await resolveUserEmail(supabase, job.user_id);
    } catch (err) {
      return json(res, 500, { error: err instanceof Error ? err.message : 'Failed to resolve destination email' });
    }
  }

  if (!isEmail(targetEmail)) {
    return json(res, 400, { error: 'No valid destination email found for this test' });
  }

  try {
    const subject = `[TEST] Follow-up reminder: ${job.title}`;
    const text = renderReminderText({
      title: job.title,
      company: job.company,
      platform: job.platform,
      followupAt: job.followup_at,
    });

    const provider = await sendEmail({ to: targetEmail, subject, text });

    if (markAsSent) {
      await supabase
        .from('jobs')
        .update({ followup_last_reminder_at: new Date().toISOString() })
        .eq('id', job.id);
    }

    return json(res, 200, {
      success: true,
      message: 'Test follow-up reminder sent',
      to: targetEmail,
      job_id: job.id,
      provider_id: provider?.id || null,
      marked_as_sent: markAsSent,
    });
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : 'Failed to send test reminder' });
  }
}

