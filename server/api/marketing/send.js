import { createClient } from '@supabase/supabase-js';
import { checkRateLimitGlobal, getClientIp } from '../_shared/rate-limit.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const DEFAULT_FROM_EMAIL = process.env.MARKETING_FROM_EMAIL || '';
const DEFAULT_FROM_NAME = process.env.MARKETING_FROM_NAME || '';
const PUBLIC_APP_URL = (process.env.PUBLIC_APP_URL || process.env.APP_BASE_URL || '').replace(/\/+$/, '');

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
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

const authedClient = async (req) => {
  if (!url || !anonKey) return { supabase: null, user: null, error: 'Supabase environment not configured' };

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { supabase: null, user: null, error: 'Unauthorized' };

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { supabase: null, user: null, error: 'Unauthorized' };
  return { supabase, user, error: null };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const renderTemplate = (input, vars) => {
  let out = String(input || '');
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ''));
  }
  return out;
};

const buildUnsubscribeUrl = (token) => {
  const base = PUBLIC_APP_URL || 'http://localhost:5173';
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`;
};

const resendSend = async ({ from, to, subject, html, text, replyTo, headers }) => {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
      reply_to: replyTo || undefined,
      headers: headers || undefined,
    }),
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = body?.message || body?.error || 'Failed to send email';
    throw new Error(msg);
  }
  return body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { supabase, user, error } = await authedClient(req);
  if (error) return json(res, error === 'Unauthorized' ? 401 : 500, { error });

  // Protect expensive provider sends from abuse and accidental rapid retries.
  // Limit: 3 send attempts per user per 10 minutes.
  const ip = getClientIp(req);
  const rl = await checkRateLimitGlobal({
    key: `marketing-send:${user?.id || 'anon'}:${ip}`,
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  res.setHeader('X-RateLimit-Store', rl.store || 'memory');
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds));
    return json(res, 429, {
      error: 'Rate limit exceeded. Please wait before sending again.',
      retry_after_seconds: rl.retryAfterSeconds,
    });
  }

  const body = parseBody(req);
  const campaignId = String(body.campaignId || '').trim();
  const tag = body.tag ? String(body.tag).trim().slice(0, 64) : null;

  if (!campaignId) return json(res, 400, { error: 'campaignId is required' });

  // Pull campaign
  const { data: campaign, error: campaignErr } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (campaignErr) return json(res, 500, { error: campaignErr.message });
  if (!campaign) return json(res, 404, { error: 'Campaign not found' });

  const subject = String(campaign.subject || '').trim();
  const fromEmail = String(campaign.from_email || DEFAULT_FROM_EMAIL || '').trim();
  const fromName = String(campaign.from_name || DEFAULT_FROM_NAME || '').trim();
  const replyTo = campaign.reply_to ? String(campaign.reply_to) : null;
  const bodyText = String(campaign.body_text || '').trim();
  const bodyHtml = String(campaign.body_html || '').trim();

  if (!subject) return json(res, 400, { error: 'Campaign subject is empty' });
  if (!fromEmail || !fromEmail.includes('@')) return json(res, 400, { error: 'Valid from email is required' });
  if (!RESEND_API_KEY) return json(res, 400, { error: 'Email provider not configured (missing RESEND_API_KEY)' });

  // Audience (consent-based only)
  let contactsQuery = supabase
    .from('marketing_contacts')
    .select('id,email,first_name,last_name,company,unsubscribe_token,status,unsubscribed_at,tags')
    .eq('user_id', user.id)
    .eq('status', 'subscribed')
    .is('unsubscribed_at', null);

  const finalTag = tag || campaign.audience_tag || null;
  if (finalTag) contactsQuery = contactsQuery.contains('tags', [finalTag]);

  const { data: contacts, error: contactsErr } = await contactsQuery.order('created_at', { ascending: false }).limit(2000);
  if (contactsErr) return json(res, 500, { error: contactsErr.message });

  const audience = contacts || [];
  if (audience.length === 0) return json(res, 200, { success: true, message: 'No subscribed contacts to send to', sent: 0, failed: 0, skipped: 0 });

  // Mark campaign as sending
  await supabase.from('marketing_campaigns').update({ status: 'sending' }).eq('id', campaignId).eq('user_id', user.id);

  // Sending strategy: small batches to keep UI responsive and avoid provider throttles.
  const maxToSend = Math.max(1, Math.min(2000, Number(body.maxToSend || 500)));
  const batchSize = Math.max(1, Math.min(50, Number(body.batchSize || 20)));
  const delayMs = Math.max(0, Math.min(2000, Number(body.delayMs || 150)));

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const selected = audience.slice(0, maxToSend);

  for (let i = 0; i < selected.length; i += batchSize) {
    const batch = selected.slice(i, i + batchSize);

    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.allSettled(
      batch.map(async (c) => {
        const toEmail = String(c.email || '').trim().toLowerCase();
        if (!toEmail || !toEmail.includes('@')) {
          skipped += 1;
          return;
        }

        const unsubscribeUrl = buildUnsubscribeUrl(c.unsubscribe_token);
        const vars = {
          first_name: c.first_name || '',
          last_name: c.last_name || '',
          email: toEmail,
          company: c.company || '',
          unsubscribe_url: unsubscribeUrl,
        };

        const renderedText = bodyText ? renderTemplate(bodyText, vars) : '';
        const renderedHtml = bodyHtml ? renderTemplate(bodyHtml, vars) : '';

        const footerText = `\n\nUnsubscribe: ${unsubscribeUrl}`;
        const finalText = renderedText ? `${renderedText}${footerText}` : `Unsubscribe: ${unsubscribeUrl}`;
        const finalHtml = renderedHtml
          ? `${renderedHtml}<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" /><p style="font-size:12px;color:#64748b">Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>`
          : undefined;

        const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
        const headers = {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
        };

        // Create send log row
        const { data: sendRow, error: sendErr } = await supabase
          .from('marketing_sends')
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            contact_id: c.id,
            to_email: toEmail,
            status: 'queued',
          })
          .select('*')
          .single();
        if (sendErr || !sendRow) throw new Error(sendErr?.message || 'Failed to create send log');

        try {
          const providerResp = await resendSend({
            from,
            to: toEmail,
            subject: renderTemplate(subject, vars),
            html: finalHtml,
            text: finalText,
            replyTo,
            headers,
          });

          await supabase
            .from('marketing_sends')
            .update({
              status: 'sent',
              provider_id: providerResp?.id || null,
              sent_at: new Date().toISOString(),
              error: null,
            })
            .eq('id', sendRow.id)
            .eq('user_id', user.id);

          sent += 1;
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Send failed';
          await supabase
            .from('marketing_sends')
            .update({ status: 'failed', error: message })
            .eq('id', sendRow.id)
            .eq('user_id', user.id);
          failed += 1;
        }
      })
    );

    // If the whole batch failed unexpectedly, count them as failed.
    for (const r of results) {
      if (r.status === 'rejected') failed += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    if (delayMs) await sleep(delayMs);
  }

  const nextStatus = failed > 0 && sent === 0 ? 'failed' : 'sent';
  await supabase
    .from('marketing_campaigns')
    .update({ status: nextStatus, sent_at: new Date().toISOString(), audience_tag: finalTag })
    .eq('id', campaignId)
    .eq('user_id', user.id);

  return json(res, 200, { success: true, sent, failed, skipped, audience_tag: finalTag });
}

