import { createClient } from '@supabase/supabase-js';
import { callFireworksChat, hasFireworksConfig } from '../_shared/fireworks.js';
import { secureJson, sanitizeError } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const ALLOWED_TONES = new Set(['professional', 'friendly', 'confident']);
const ALLOWED_LENGTHS = new Set(['concise', 'standard', 'detailed']);

const normalizeJobId = (raw) => {
  const value = String(raw || '');
  if (!value) return '';
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  return decoded
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\/+$/g, '')
    .split(/[?#]/, 1)[0]
    .trim();
};

const truncate = (value, max = 1200) => String(value || '').slice(0, Math.max(0, max)).trim();

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
  const setup =
    safeProfile.preferences &&
    typeof safeProfile.preferences === 'object' &&
    safeProfile.preferences.profileSetup &&
    typeof safeProfile.preferences.profileSetup === 'object'
      ? safeProfile.preferences.profileSetup
      : null;
  const portfolio = safeProfile.portfolioUrl || safeProfile.linkedinUrl || 'Not provided';
  const topSkills = Array.isArray(safeProfile.skills)
    ? safeProfile.skills.map((s) => truncate(s, 40)).filter(Boolean).slice(0, 8)
    : [];
  const projects = Array.isArray(safeProfile.pastProjects) ? safeProfile.pastProjects.slice(0, 2) : [];

  return `
Write an extremely refined, high-converting freelance proposal in a ${tone} tone from my (the freelancer's) first-person perspective.

Rules for the AI Agent:
- You are representing me. Use my exact Profile Data, memory of past projects, and skills to craft this proposal.
- Output ONLY the proposal body text. No markdown, no code fences, no titles, and no explanations.
- Keep it concise, incredibly persuasive, and immediately articulate the specific value I bring.
- Target length: ${lengthGuide.targetWords}.
- Mention relevant skills from my profile and clearly tie them to one concrete delivery outcome for this specific job.
- Do NOT hallucinate experiences I don't have. Only use the provided Freelancer Profile memory.
- Include a strong, professional call-to-action at the end to win the client.

Job Context:
- Title: ${job.title}
- Company: ${job.company || 'Not specified'}
- Platform: ${job.platform}
- Budget: ${job.currency || 'USD'} ${job.budget_min ?? 'N/A'} - ${job.budget_max ?? 'N/A'}
- Description: ${truncate(job.job_description, 3000) || 'N/A'}
- Client Notes: ${truncate(job.notes, 800) || 'N/A'}

Freelancer Profile:
- Full Name: ${truncate(setup?.fullName, 80) || 'Not provided'}
- Professional Status: ${truncate(setup?.professionalStatus, 60) || 'Not provided'}
- Specialization: ${
    setup?.freelancerSpecialization === 'other'
      ? truncate(setup?.specializationOther, 80) || 'Other'
      : truncate(setup?.freelancerSpecialization, 80) || 'Not provided'
  }
- Primary Services: ${truncate(setup?.primaryServices, 500) || 'Not provided'}
- Years Experience: ${safeProfile.yearsExperience ?? 0}
- Hourly Rate: ${safeProfile.hourlyRate ?? 'N/A'}
- Skills: ${topSkills.length ? topSkills.join(', ') : 'Not provided'}
- Bio: ${truncate(safeProfile.bio, 900) || 'Not provided'}
- Communication Style: ${truncate(setup?.communicationStyle || safeProfile.communicationStyle, 80) || 'Professional'}
- Portfolio/LinkedIn: ${portfolio}
- Past Projects: ${
    projects.length
      ? projects
          .map((p, idx) => {
            const tech = Array.isArray(p.technologies)
              ? p.technologies.map((t) => truncate(t, 24)).filter(Boolean).slice(0, 8).join(', ')
              : '';
            return `${idx + 1}. ${truncate(p.name, 80) || 'Project'} | ${tech || 'N/A'} | ${truncate(p.description, 260)}`;
          })
          .join('\n')
      : 'Not provided'
  }
- Requested Highlights: ${highlights.length ? highlights.join(', ') : 'None'}
`.trim();
};

const buildFallbackProposal = ({ job, profile, tone, length }) => {
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const setup =
    safeProfile.preferences &&
    typeof safeProfile.preferences === 'object' &&
    safeProfile.preferences.profileSetup &&
    typeof safeProfile.preferences.profileSetup === 'object'
      ? safeProfile.preferences.profileSetup
      : null;
  const skills = Array.isArray(safeProfile.skills) ? safeProfile.skills.filter(Boolean).slice(0, 4) : [];
  const introByTone = {
    professional: `Hi ${job.company || 'there'},`,
    friendly: `Hello ${job.company || 'there'},`,
    confident: `Hi ${job.company || 'there'} -`,
  };
  const sizeByLength = {
    concise: 2,
    standard: 3,
    detailed: 4,
  };
  const lines = [
    `${introByTone[tone] || introByTone.professional} I can help with your ${job.title} project and deliver a polished outcome quickly.`,
    `I have ${safeProfile.yearsExperience || setup?.yearsExperience || 'relevant'} years of experience${
      skills.length ? ` with ${skills.join(', ')}` : ''
    } and can align the solution to your ${job.platform} requirements.`,
    setup?.primaryServices
      ? `My core services include ${truncate(setup.primaryServices, 220)}, and I tailor each proposal around client goals.`
      : `I tailor each proposal around client goals and expected outcomes.`,
    `Based on your brief, I would focus on clean execution, clear communication, and measurable delivery milestones so you can review progress with confidence.`,
    `If this sounds good, I can start immediately and share a clear execution plan in the first update.`,
  ];
  return lines.slice(0, sizeByLength[length] || 3).join('\n\n');
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
    const jobId = normalizeJobId(body.jobId);
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

    // Fetch job and agent memory in parallel
    const [jobResult, agentMemoryResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('id,title,company,platform,job_description,budget_min,budget_max,currency,notes')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('agent_memory')
        .select('total_wins,total_losses,current_win_rate,avg_winning_price,avg_losing_price,platform_stats,winning_skills,best_performing_tone,best_performing_length,learned_insights,strategy_version')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const { data: job, error: jobError } = jobResult;
    if (jobError) return secureJson(res, 500, { error: jobError.message });
    if (!job) return secureJson(res, 404, { error: 'Job not found' });

    const agentMemory = agentMemoryResult.data;

    // Build agent-enhanced prompt
    const lengthGuide = normalizeLengthGuidance(length);
    let agentContext = '';
    if (agentMemory && (agentMemory.total_wins > 0 || agentMemory.total_losses > 0)) {
      const platformStats = agentMemory.platform_stats || {};
      const currentPlatformStats = platformStats[job.platform] || {};
      const recentInsights = (agentMemory.learned_insights || []).slice(-3);
      const topWinSkills = (agentMemory.winning_skills || []).slice(0, 5).map((s) => s.skill || s).join(', ');

      agentContext = `
Agent Memory (learned from ${agentMemory.total_wins + agentMemory.total_losses} past outcomes):
- Win Rate: ${Math.round((agentMemory.current_win_rate || 0) * 100)}%
- Avg Winning Price: $${Math.round(agentMemory.avg_winning_price || 0)}
- Avg Losing Price: $${Math.round(agentMemory.avg_losing_price || 0)}
- Best Performing Tone: ${agentMemory.best_performing_tone || tone}
- Platform "${job.platform}" stats: ${currentPlatformStats.wins || 0} wins, ${currentPlatformStats.losses || 0} losses
- Skills most correlated with wins: ${topWinSkills || 'Not enough data yet'}
${recentInsights.length ? `- Recent learnings: ${recentInsights.map((i) => i.insight || '').filter(Boolean).join('; ')}` : ''}
- Strategy version: v${agentMemory.strategy_version || 1}

IMPORTANT: Use these learnings to optimize this proposal. Emphasize win-correlated skills, price within winning ranges, and apply the tone that historically performs best.`;
    }

    const basePrompt = buildProposalPrompt({ job, profile, tone, length, highlights });
    const enhancedPrompt = agentContext ? `${basePrompt}\n\n${agentContext}` : basePrompt;

    let proposal = '';
    let provider = 'fireworks';
    let warning = null;
    try {
      const completion = await callFireworksChat({
        messages: [
          {
            role: 'system',
            content:
              'You are the user\'s dedicated AI Digital Twin Agent. You have shared memory of their entire profile, background, past projects, AND performance history (win/loss patterns, pricing insights, platform performance). Your primary directive is to continuously help them win more clients by writing the most refined, personalized, and high-converting proposals possible on their behalf. Use your learned patterns to maximize win probability.',
          },
          { role: 'user', content: enhancedPrompt },
        ],
        temperature: 0.45,
        maxTokens: lengthGuide.maxTokens,
      });

      proposal = sanitizeProposal(completion.content);
      if (!proposal) throw new Error('AI returned an empty proposal');
    } catch (generationError) {
      provider = 'fallback';
      warning = `Fireworks generation failed: ${sanitizeError(generationError)}`;
      proposal = buildFallbackProposal({ job, profile, tone, length });
    }

    // Update agent memory: increment proposals generated
    if (agentMemory) {
      supabase
        .from('agent_memory')
        .update({
          total_proposals_generated: (agentMemory.total_proposals_generated || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .then(() => {})
        .catch(() => {});
    }

    // Log the proposal generation as an agent interaction
    supabase
      .from('agent_interactions')
      .insert({
        user_id: user.id,
        interaction_type: 'proposal',
        context: {
          job_title: job.title,
          platform: job.platform,
          tone,
          length,
          strategy_version: agentMemory?.strategy_version || 1,
        },
        agent_response: `Generated ${length} ${tone} proposal for "${truncate(job.title, 80)}"`,
        job_id: jobId,
        confidence_score: agentMemory ? Math.min(1, (agentMemory.current_win_rate || 0) + 0.2) : 0.3,
      })
      .then(() => {})
      .catch(() => {});

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
      provider,
      warning,
      agent_enhanced: Boolean(agentContext),
      strategy_version: agentMemory?.strategy_version || 1,
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
