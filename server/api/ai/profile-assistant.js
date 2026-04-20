import { createClient } from '@supabase/supabase-js';
import { callFireworksChat, hasFireworksConfig } from '../_shared/fireworks.js';
import { secureJson, sanitizeError } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const EXPERIENCE_LEVELS = new Set(['Entry', 'Intermediate', 'Expert']);

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

const isSafeText = (value, maxLength = 3000) => {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text || text.length > maxLength) return false;
  if (/<script|javascript:|onerror=|onload=/gi.test(text)) return false;
  return true;
};

const parseUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return undefined;
  try {
    const u = new URL(text);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
};

const normalizeProfilePatch = (patch) => {
  if (!patch || typeof patch !== 'object') return {};
  const out = {};

  if (Array.isArray(patch.skills)) {
    const skills = patch.skills
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 20);
    if (skills.length) out.skills = [...new Set(skills)];
  }

  if (Number.isFinite(Number(patch.yearsExperience))) {
    out.yearsExperience = Math.max(0, Math.min(60, Number(patch.yearsExperience)));
  }

  if (Number.isFinite(Number(patch.hourlyRate))) {
    out.hourlyRate = Math.max(0, Math.min(10000, Number(patch.hourlyRate)));
  }

  if (typeof patch.bio === 'string') {
    const bio = patch.bio.trim().slice(0, 1500);
    if (bio) out.bio = bio;
  }

  const portfolioUrl = parseUrl(patch.portfolioUrl);
  if (portfolioUrl) out.portfolioUrl = portfolioUrl;

  const linkedinUrl = parseUrl(patch.linkedinUrl);
  if (linkedinUrl) out.linkedinUrl = linkedinUrl;

  if (typeof patch.completedOnboarding === 'boolean') {
    out.completedOnboarding = patch.completedOnboarding;
  }

  if (typeof patch.experienceLevel === 'string' && EXPERIENCE_LEVELS.has(patch.experienceLevel)) {
    out.experienceLevel = patch.experienceLevel;
  }

  if (Array.isArray(patch.pastProjects)) {
    const projects = patch.pastProjects
      .slice(0, 4)
      .map((project) => {
        if (!project || typeof project !== 'object') return null;
        const name = String(project.name || '').trim().slice(0, 120);
        const description = String(project.description || '').trim().slice(0, 600);
        const technologies = Array.isArray(project.technologies)
          ? [...new Set(project.technologies.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 8))]
          : [];
        if (!name && !description) return null;
        return {
          name: name || 'Project',
          description: description || '',
          technologies,
          link: parseUrl(project.link),
        };
      })
      .filter(Boolean);
    if (projects.length) out.pastProjects = projects;
  }

  return out;
};

const deriveExperienceLevel = (years) => {
  if (years >= 8) return 'Expert';
  if (years >= 3) return 'Intermediate';
  return 'Entry';
};

const buildFallback = (message, profile, context) => {
  const patch = {};
  const replyParts = [];
  const stepId = String(context?.currentStepId || '').toLowerCase();
  const nextPrompt = context?.nextStepPrompt ? ` ${context.nextStepPrompt}` : '';
  const wantsSkip = /^(skip|none|n\/a|na|nope|no)$/i.test(String(message || '').trim());

  const urls = String(message).match(/https?:\/\/[^\s)]+/gi) || [];
  for (const rawUrl of urls) {
    const safeUrl = parseUrl(rawUrl);
    if (!safeUrl) continue;
    if (safeUrl.includes('linkedin.com')) {
      patch.linkedinUrl = safeUrl;
    } else {
      patch.portfolioUrl = safeUrl;
    }
  }

  const yearsMatch = String(message).match(/(\d{1,2})\s*(?:\+?\s*)?(?:years?|yrs?)/i);
  if (yearsMatch) {
    const years = Math.max(0, Math.min(60, Number(yearsMatch[1])));
    patch.yearsExperience = years;
    patch.experienceLevel = deriveExperienceLevel(years);
  }

  const rateMatch = String(message).match(/\$?\s*(\d{2,4})(?:\s*\/?\s*(?:hr|hour))/i);
  if (rateMatch) {
    patch.hourlyRate = Math.max(0, Math.min(10000, Number(rateMatch[1])));
  }

  if (/bio/i.test(message)) {
    patch.bio = String(message).slice(0, 600);
  }

  const skillHints = ['react', 'typescript', 'node', 'next', 'seo', 'figma', 'python', 'aws', 'supabase'];
  const matchedSkills = skillHints
    .filter((skill) => new RegExp(`\\b${skill}\\b`, 'i').test(message))
    .map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1));
  if (matchedSkills.length) {
    patch.skills = [...new Set([...(profile?.skills || []), ...matchedSkills])].slice(0, 20);
  }

  if (stepId === 'project' && String(message || '').trim().length >= 40) {
    patch.pastProjects = [
      {
        name: 'Client Project',
        description: String(message).slice(0, 500),
        technologies: matchedSkills.slice(0, 8),
      },
    ];
  }

  if (Object.keys(patch).length > 0) {
    replyParts.push(`I updated your profile with what I could confidently extract.${nextPrompt}`.trim());
    return {
      reply: replyParts.join(' '),
      profilePatch: patch,
    };
  }

  if (wantsSkip) return { reply: `No problem, I can skip this part.${nextPrompt}`.trim(), profilePatch: {} };

  if (stepId === 'intro') {
    return {
      reply: 'Tell me your services as a short list, for example: React development, UI design, API integrations.',
      profilePatch: {},
    };
  }
  if (stepId === 'experience') {
    return { reply: 'Please share years of experience as a number, like 4 years.', profilePatch: {} };
  }
  if (stepId === 'portfolio') {
    return { reply: 'Please share your portfolio/GitHub/LinkedIn URL, or say skip.', profilePatch: {} };
  }
  if (stepId === 'project') {
    return {
      reply: 'Share one project with what you built and the tech stack you used.',
      profilePatch: {},
    };
  }
  if (stepId === 'rate') {
    return { reply: 'What is your target hourly rate in USD? Example: $35/hr.', profilePatch: {} };
  }
  if (stepId === 'bio') {
    return {
      reply: 'Write 2-3 lines about your strengths and the outcomes you deliver for clients.',
      profilePatch: {},
    };
  }

  return {
    reply: 'I captured that context. Tell me a specific field to update, like skills, hourly rate, years of experience, bio, or portfolio link.',
    profilePatch: {},
  };
};

const extractJsonObject = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : raw;
  try {
    return JSON.parse(candidate);
  } catch {
    // Continue to bracket extraction fallback.
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return secureJson(res, 405, { error: 'Method not allowed' });
  if (!hasFireworksConfig()) {
    return secureJson(res, 503, { error: 'FIREWORKS_API_KEY is not configured on the server' });
  }

  try {
    const { error, status } = await authedClient(req);
    if (error) return secureJson(res, status, { error });

    const body = parseBody(req);
    const message = String(body.message || '').trim();
    if (!isSafeText(message, 3000)) {
      return secureJson(res, 400, { error: 'A valid message is required' });
    }

    const profile = body.profile && typeof body.profile === 'object' ? body.profile : {};
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const history = Array.isArray(body.history)
      ? body.history
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: String(item.content || '').trim(),
          }))
          .filter((item) => item.content && item.content.length <= 2000)
          .slice(-10)
      : [];

    const prompt = `
You are the user's dedicated AI Digital Twin Agent. Your job right now is to converse with the user to thoroughly understand their background, gather their precise skills, and build their complete Freelancer Profile memory. You will actively use this memory later to write highly refined, winning client proposals on their behalf.

Actively guide them. Make them feel they are training a powerful personalized AI agent.
Respond with strict JSON only, no markdown content outside of the JSON payload.

Output schema:
{
  "assistant_reply": "string",
  "profile_patch": {
    "skills": ["string"],
    "yearsExperience": number,
    "experienceLevel": "Entry|Intermediate|Expert",
    "hourlyRate": number,
    "bio": "string",
    "portfolioUrl": "https://...",
    "linkedinUrl": "https://...",
    "completedOnboarding": boolean,
    "pastProjects": [
      {"name":"string","description":"string","technologies":["string"],"link":"https://..."}
    ]
  }
}

Rules:
- Include only fields that should change.
- Keep "assistant_reply" actionable and concise (1-3 sentences).
- Do not invent unknown achievements. Infer minimally.
- Respect the current conversation mode: ${context.mode || 'default'}.
- Current step id: ${context.currentStepId || 'n/a'}.
- Suggested next prompt: ${context.nextStepPrompt || 'n/a'}.

Current profile snapshot:
${JSON.stringify(profile)}

Recent conversation:
${JSON.stringify(history)}

Latest user message:
${message}
`.trim();

    const completion = await callFireworksChat({
      messages: [
        {
          role: 'system',
          content:
            'You are a structured data assistant. You always return valid JSON exactly as requested.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      maxTokens: 700,
    });

    const parsed = extractJsonObject(completion.content);
    if (!parsed || typeof parsed !== 'object') {
      const fallback = buildFallback(message, profile, context);
      return secureJson(res, 200, { ...fallback, provider: 'fireworks-fallback' });
    }

    const assistantReply =
      typeof parsed.assistant_reply === 'string' && parsed.assistant_reply.trim()
        ? parsed.assistant_reply.trim().slice(0, 1200)
        : 'I updated your profile context based on your message.';
    const profilePatch = normalizeProfilePatch(parsed.profile_patch);

    return secureJson(res, 200, {
      reply: assistantReply,
      profilePatch,
      provider: 'fireworks',
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
