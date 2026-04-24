import { createClient } from '@supabase/supabase-js';
import { secureJson } from '../_shared/security.js';
import { extractBearerToken } from '../_shared/auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.MARKETING_FROM_EMAIL || 'noreply@getsolodesk.com';
const FROM_NAME = process.env.MARKETING_FROM_NAME || 'GetSoloDesk';
const APP_URL = (process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || 'https://getsolodesk.com').replace(/\/+$/, '');

// ═══════════════════════════════════════════════════════════
// Welcome Email — sent once when a user first creates an account.
// Uses a flag in the users table to ensure it's only sent once.
// ═══════════════════════════════════════════════════════════

const buildWelcomeHtml = ({ name, email }) => {
  const displayName = name || email?.split('@')[0] || 'there';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to GetSoloDesk</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%);padding:48px 40px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <span style="font-size:32px;">🚀</span>
              </div>
              <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px 0;letter-spacing:-0.5px;">
                Welcome to GetSoloDesk
              </h1>
              <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;font-weight:500;">
                Your AI-powered freelancing command center
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:18px;color:#1e293b;margin:0 0 20px 0;font-weight:600;">
                Hey ${displayName}! 👋
              </p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px 0;">
                You just unlocked the most powerful toolkit for freelancers. GetSoloDesk combines AI proposal generation, smart job tracking, and personalized coaching — all designed to help you <strong style="color:#1e293b;">win more clients and earn more</strong>.
              </p>

              <!-- Feature Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;background:#f0f9ff;border-radius:12px;border-left:4px solid #6366f1;margin-bottom:12px;">
                    <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#4338ca;">🧠 Your Personal AI Agent</p>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">A dedicated AI that learns your wins, losses, and style to write better proposals every time.</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:16px 20px;background:#f0fdf4;border-radius:12px;border-left:4px solid #22c55e;">
                    <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#15803d;">📊 Smart Job Pipeline</p>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Track every application from Saved → Applied → Won. Never miss a follow-up again.</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:16px 20px;background:#fef3c7;border-radius:12px;border-left:4px solid #f59e0b;">
                    <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#b45309;">⚡ AI Proposal Generator</p>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Generate tailored, high-converting proposals in seconds — personalized to each job.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="${APP_URL}/app/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
                      Open Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick Start Steps -->
              <div style="background:#f8fafc;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
                <p style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 16px 0;">
                  🎯 Get started in 3 steps:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:24px;height:24px;background:#6366f1;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:12px;">1</span>
                      <span style="font-size:14px;color:#334155;"><strong>Complete your profile</strong> — Let the AI learn about you</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:24px;height:24px;background:#8b5cf6;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:12px;">2</span>
                      <span style="font-size:14px;color:#334155;"><strong>Add your first job</strong> — Paste a job description to track</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:24px;height:24px;background:#a855f7;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:12px;">3</span>
                      <span style="font-size:14px;color:#334155;"><strong>Generate a proposal</strong> — Watch your AI agent create magic</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="font-size:14px;color:#64748b;line-height:1.7;margin:24px 0 0 0;">
                Questions? Just reply to this email — we read every message.
              </p>
              <p style="font-size:14px;color:#475569;margin:16px 0 0 0;font-weight:600;">
                Let's win some clients! 🏆<br />
                <span style="font-weight:400;color:#64748b;">— The GetSoloDesk Team</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="font-size:12px;color:#94a3b8;margin:0 0 8px 0;">
                You're receiving this because you signed up at <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">getsolodesk.com</a>
              </p>
              <p style="font-size:12px;color:#94a3b8;margin:0;">
                © ${year} GetSoloDesk. Built for freelancers who want to win.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendWelcomeEmail = async ({ to, name }) => {
  const from = FROM_NAME ? `${FROM_NAME} <${FROM_EMAIL}>` : FROM_EMAIL;
  const html = buildWelcomeHtml({ name, email: to });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Welcome to GetSoloDesk — Your AI Freelancing Agent is Ready 🚀',
      html,
      text: `Welcome to GetSoloDesk! Your AI-powered freelancing command center is ready. Open your dashboard: ${APP_URL}/app/dashboard`,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.message || body?.error || `Resend error ${response.status}`);
  }
  return body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return secureJson(res, 405, { error: 'Method not allowed' });

  if (!RESEND_API_KEY) {
    return secureJson(res, 503, { error: 'Email provider not configured' });
  }

  const token = extractBearerToken(req);
  if (!token) return secureJson(res, 401, { error: 'Unauthorized' });

  try {
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) return secureJson(res, 401, { error: 'Unauthorized' });

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if welcome email was already sent (idempotency)
    const { data: userRow } = await adminClient
      .from('users')
      .select('id,email,welcome_email_sent')
      .eq('id', user.id)
      .maybeSingle();

    if (userRow?.welcome_email_sent) {
      return secureJson(res, 200, { success: true, already_sent: true });
    }

    const email = user.email || userRow?.email;
    if (!email) {
      return secureJson(res, 400, { error: 'No email address found for user' });
    }

    // Get user name from metadata if available
    const name = user.user_metadata?.full_name || user.user_metadata?.name || '';

    await sendWelcomeEmail({ to: email, name });

    // Mark welcome email as sent
    await adminClient
      .from('users')
      .update({ welcome_email_sent: true })
      .eq('id', user.id);

    return secureJson(res, 200, { success: true, sent_to: email });
  } catch (err) {
    console.error('Welcome email error:', err);
    return secureJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to send welcome email' });
  }
}
