import { createClient } from '@supabase/supabase-js';
import { callFireworksChat, hasFireworksConfig } from '../_shared/fireworks.js';
import { secureJson, sanitizeError } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const ALLOWED_TONES = new Set(['professional', 'friendly', 'confident']);
const ALLOWED_LENGTHS = new Set(['concise', 'standard', 'detailed']);

const parseBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const authedClient = async (req) => {
  if (!url || !anonKey) return { supabase: null, user: null, error: 'Supabase environment not configured', status: 500 };

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { supabase: null, user: null, error: 'Unauthorized', status: 401 };

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { supabase: null, user: null, error: 'Unauthorized', status: 401 };
  return { supabase, user, error: null, status: 200 };
};

const sanitizeProposal = (text) => {
  const cleaned = String(text || '')
    .replace(/^```[a-zA-Z]*\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (!cleaned) return '';
  return cleaned;
};

const normalizeLengthGuidance = (length) => {
  if (length === 'concise') {
    return { targetWords: '120-170 words', maxTokens: 420 };
  }
  if (length === 'detailed') {
    return { targetWords: '260-360 words', maxTokens: 950 };
  }
  return { targetWords: '180-250 words', maxTokens: 700 };
};

const buildProposalPrompt = ({ job, profile, tone, length, highlights }) => {
  const lengthGuide = normalizeLengthGuidance(length);
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const portfolio = safeProfile.portfolioUrl || safeProfile.linkedinUrl || 'Not provided';
  const topSkills = Array.isArray(safeProfile.skills) ? safeProfile.skills.slice(0, 8) : [];
  const projects = Array.isArray(safeProfile.pastProjects) ? safeProfile.pastProjects.slice(0, 2) : [];

  return `
Write a client-ready freelance proposal in ${tone} tone.

Rules:
- Output only the proposal body text. No markdown, no code fences, no titles.
- Keep it concise and persuasive with clear value.
- Target length: ${lengthGuide.targetWords}.
- Mention relevant skills and one concrete delivery outcome.
- Include a short call-to-action at the end.

Job Context:
- Title: ${job.title}
- Company: ${job.company || 'Not specified'}
- Platform: ${job.platform}
- Budget: ${job.currency || 'USD'} ${job.budget_min ?? 'N/A'} - ${job.budget_max ?? 'N/A'}
- Description: ${job.job_description || 'N/A'}
- Client Notes: ${job.notes || 'N/A'}

Freelancer Profile:
- Years Experience: ${safeProfile.yearsExperience ?? 0}
- Hourly Rate: ${safeProfile.hourlyRate ?? 'N/A'}
- Skills: ${topSkills.length ? topSkills.join(', ') : 'Not provided'}
- Bio: ${safeProfile.bio || 'Not provided'}
- Portfolio/LinkedIn: ${portfolio}
- Past Projects: ${
    projects.length
      ? projects
          .map((p, idx) => `${idx + 1}. ${p.name || 'Project'} | ${(p.technologies || []).join(', ')} | ${p.description || ''}`)
          .join('\n')
      : 'Not provided'
  }
- Requested Highlights: ${highlights.length ? highlights.join(', ') : 'None'}
`.trim();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return secureJson(res, 405, { error: 'Method not allowed' });
  if (!hasFireworksConfig()) {
    return secureJson(res, 503, { error: 'FIREWORKS_API_KEY is not configured on the server' });
  }

  try {
    const { supabase, user, error, status } = await authedClient(req);
    if (error) return secureJson(res, status, { error });

    const body = parseBody(req);
    const jobId = String(body.jobId || '').trim();
    if (!jobId) return secureJson(res, 400, { error: 'jobId is required' });

    const tone = ALLOWED_TONES.has(String(body?.settings?.tone || ''))
      ? String(body.settings.tone)
      : 'professional';
    const length = ALLOWED_LENGTHS.has(String(body?.settings?.length || ''))
      ? String(body.settings.length)
      : 'standard';
    const highlights = Array.isArray(body?.settings?.highlights)
      ? body.settings.highlights.map((h) => String(h || '').trim()).filter(Boolean).slice(0, 6)
      : [];
    const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id,title,company,platform,job_description,budget_min,budget_max,currency,notes')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (jobError) return secureJson(res, 500, { error: jobError.message });
    if (!job) return secureJson(res, 404, { error: 'Job not found' });

    const lengthGuide = normalizeLengthGuidance(length);
    const prompt = buildProposalPrompt({ job, profile, tone, length, highlights });
    const completion = await callFireworksChat({
      messages: [
        {
          role: 'system',
          content:
            'You are an elite freelancer proposal strategist. Write practical, personalized proposals that win client replies.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.45,
      maxTokens: lengthGuide.maxTokens,
    });

    const proposal = sanitizeProposal(completion.content);
    if (!proposal) return secureJson(res, 502, { error: 'AI returned an empty proposal' });

    let creditsRemaining = 0;
    const { data: usageRow } = await supabase
      .from('users')
      .select('ai_credits_limit,ai_credits_used')
      .eq('id', user.id)
      .maybeSingle();

    if (usageRow) {
      const limit = Number(usageRow.ai_credits_limit || 0);
      const used = Number(usageRow.ai_credits_used || 0);
      creditsRemaining = Math.max(0, limit - used - 1);
    }

    return secureJson(res, 200, {
      proposal,
      creditsRemaining,
      provider: 'fireworks',
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
