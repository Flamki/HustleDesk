import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const APP_BASE_URL = (process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || '').replace(/\/+$/, '');
const FROM_EMAIL = process.env.MARKETING_FROM_EMAIL || '';
const FROM_NAME = process.env.MARKETING_FROM_NAME || 'HustleDesk';

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

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const renderReminderText = ({ title, company, platform, followupAt }) => {
  const dueLabel = followupAt ? new Date(followupAt).toLocaleString() : 'now';
  const place = company ? `${company} (${platform})` : platform;
  const appUrl = APP_BASE_URL || 'http://localhost:5173';

  return [
    `Reminder: follow up on "${title}"`,
    '',
    `Client/platform: ${place}`,
    `Reminder time: ${dueLabel}`,
    '',
    `Open jobs: ${appUrl}/app/jobs`,
    '',
    'Stay consistent. Follow-ups close deals.',
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
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.message || body?.error || 'Failed to send reminder email');
  }
  return body;
};

const isAuthorizedCronCall = (req) => {
  const expected = process.env.CRON_SECRET || process.env.HEALTHCHECK_TOKEN || '';
  const authHeader = getHeader(req, 'authorization');
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (expected) return token === expected;

  // Fallback for environments without secret configured.
  const vercelCronHeader = getHeader(req, 'x-vercel-cron');
  return Boolean(vercelCronHeader);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  if (!isAuthorizedCronCall(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'Supabase environment not configured' });
  }
  if (!RESEND_API_KEY) {
    return json(res, 500, { error: 'RESEND_API_KEY is required' });
  }
  if (!FROM_EMAIL || !isEmail(FROM_EMAIL)) {
    return json(res, 500, { error: 'MARKETING_FROM_EMAIL must be a valid email' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();

  const { data: dueJobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id,user_id,title,company,platform,status,followup_at,followup_last_reminder_at,deleted_at')
    .eq('status', 'applied')
    .is('deleted_at', null)
    .not('followup_at', 'is', null)
    .lte('followup_at', nowIso)
    .order('followup_at', { ascending: true })
    .limit(200);

  if (jobsError) return json(res, 500, { error: jobsError.message });

  const candidates = (dueJobs || []).filter((job) => {
    if (!job.followup_at) return false;
    if (!job.followup_last_reminder_at) return true;
    return new Date(job.followup_last_reminder_at).getTime() < new Date(job.followup_at).getTime();
  });

  if (candidates.length === 0) {
    return json(res, 200, { success: true, scanned: dueJobs?.length || 0, due: 0, sent: 0, skipped: 0, failed: 0 });
  }

  const userIds = [...new Set(candidates.map((j) => j.user_id))];

  const [{ data: users, error: usersError }, { data: settingsRows, error: settingsError }] = await Promise.all([
    supabase.from('users').select('id,email').in('id', userIds),
    supabase.from('notification_settings').select('user_id,followup_reminders').in('user_id', userIds),
  ]);

  if (usersError) return json(res, 500, { error: usersError.message });
  if (settingsError) return json(res, 500, { error: settingsError.message });

  const userEmailById = new Map((users || []).map((u) => [u.id, u.email]));
  const reminderPrefByUser = new Map((settingsRows || []).map((s) => [s.user_id, Boolean(s.followup_reminders)]));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of candidates) {
    const userEmail = userEmailById.get(job.user_id);
    const remindersEnabled = reminderPrefByUser.has(job.user_id) ? reminderPrefByUser.get(job.user_id) : true;

    if (!remindersEnabled || !isEmail(userEmail)) {
      skipped += 1;
      continue;
    }

    try {
      const subject = `Follow-up reminder: ${job.title}`;
      const text = renderReminderText({
        title: job.title,
        company: job.company,
        platform: job.platform,
        followupAt: job.followup_at,
      });

      await sendEmail({
        to: userEmail,
        subject,
        text,
      });

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ followup_last_reminder_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) {
        failed += 1;
        continue;
      }

      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return json(res, 200, {
    success: true,
    scanned: dueJobs?.length || 0,
    due: candidates.length,
    sent,
    skipped,
    failed,
    timestamp: nowIso,
  });
}
