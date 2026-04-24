import { createClient } from '@supabase/supabase-js';
import { callFireworksChat, hasFireworksConfig } from '../_shared/fireworks.js';
import { secureJson, sanitizeError } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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

const extractJsonObject = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : raw;
  try { return JSON.parse(candidate); } catch { /* continue */ }
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(candidate.slice(start, end + 1)); } catch { return null; }
  }
  return null;
};

/**
 * GET /api/ai/agent-insights — Get AI-powered strategic insights from agent memory
 * Returns personalized coaching advice based on the user's complete performance history
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return secureJson(res, 405, { error: 'Method not allowed' });
  if (!hasFireworksConfig()) {
    return secureJson(res, 503, { error: 'FIREWORKS_API_KEY is not configured on the server' });
  }

  try {
    const { supabase, user, error, status } = await authedClient(req);
    if (error) return secureJson(res, status, { error });

    // Fetch agent data in parallel
    const [memoryResult, profileResult, jobsResult, timeResult] = await Promise.all([
      supabase.from('agent_memory').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('freelancer_profiles').select('skills,experience_level,years_experience,hourly_rate,bio,preferences').eq('user_id', user.id).maybeSingle(),
      supabase.from('jobs').select('id,title,platform,status,proposed_price,currency,created_at,closed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('time_entries').select('client,project,duration_seconds,hourly_rate,earnings').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);

    const memory = memoryResult.data;
    const profile = profileResult.data;
    const jobs = jobsResult.data || [];
    const timeEntries = timeResult.data || [];

    if (!memory && jobs.length === 0) {
      return secureJson(res, 200, {
        insights: [],
        coaching: {
          summary: 'Your AI Agent is getting ready. Start by adding jobs and generating proposals to activate learning.',
          next_action: 'Add your first job from the Jobs page to begin training your agent.',
          confidence: 0,
        },
        agent_status: 'initializing',
      });
    }

    // Compute stats for AI context
    const wins = jobs.filter(j => j.status === 'won');
    const losses = jobs.filter(j => j.status === 'lost');
    const totalDecided = wins.length + losses.length;
    const winRate = totalDecided > 0 ? wins.length / totalDecided : 0;
    const totalTrackedHours = timeEntries.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / 3600;
    const totalEarnings = timeEntries.reduce((sum, t) => sum + Number(t.earnings || 0), 0);
    const effectiveRate = totalTrackedHours > 0 ? totalEarnings / totalTrackedHours : 0;

    // Top clients by hours
    const clientHours = {};
    for (const entry of timeEntries) {
      const key = entry.client || 'Unknown';
      clientHours[key] = (clientHours[key] || 0) + (entry.duration_seconds || 0) / 3600;
    }

    const prompt = `You are a dedicated AI Agent for a freelancer. Based on their complete performance data, provide strategic coaching.

Freelancer Profile:
- Skills: ${(profile?.skills || []).join(', ') || 'Not specified'}
- Experience: ${profile?.years_experience || 0} years (${profile?.experience_level || 'Entry'})
- Hourly Rate Target: $${profile?.hourly_rate || 0}/hr
- Bio: ${(profile?.bio || '').slice(0, 300) || 'Not set'}

Performance Stats:
- Total Jobs Tracked: ${jobs.length}
- Wins: ${wins.length}, Losses: ${losses.length}
- Win Rate: ${Math.round(winRate * 100)}%
- Avg Winning Price: $${Math.round(memory?.avg_winning_price || 0)}
- Avg Losing Price: $${Math.round(memory?.avg_losing_price || 0)}
- Current Streak: ${memory?.current_streak || 0}
- Best Win Streak: ${memory?.best_win_streak || 0}
- Proposals Generated: ${memory?.total_proposals_generated || 0}
- Platform Stats: ${JSON.stringify(memory?.platform_stats || {})}

Time Tracking:
- Total Hours Tracked: ${Math.round(totalTrackedHours)}
- Total Earnings: $${Math.round(totalEarnings)}
- Effective Hourly Rate: $${Math.round(effectiveRate)}/hr
- Top Clients: ${JSON.stringify(clientHours)}

Past Insights: ${JSON.stringify((memory?.learned_insights || []).slice(-10))}
Winning Skills: ${JSON.stringify(memory?.winning_skills || [])}

Respond with JSON:
{
  "summary": "2-3 sentence overall assessment of the freelancer's trajectory",
  "next_action": "The single most impactful next step they should take",
  "insights": [
    {
      "type": "strength|weakness|opportunity|trend",
      "title": "Short title",
      "detail": "1-2 sentence detail",
      "priority": "high|medium|low",
      "confidence": 0.0 to 1.0
    }
  ],
  "pricing_advice": "Specific pricing recommendation based on win/loss data",
  "platform_advice": "Which platform to focus on and why",
  "skill_advice": "Skills to highlight or develop",
  "weekly_goal": "A specific measurable goal for this week"
}`;

    const completion = await callFireworksChat({
      messages: [
        { role: 'system', content: 'You are a world-class freelance strategy AI agent. Return valid JSON only. Be specific and data-driven.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 900,
    });

    const analysis = extractJsonObject(completion.content);
    if (!analysis) {
      return secureJson(res, 200, {
        insights: [],
        coaching: {
          summary: 'Your agent is analyzing your data. Keep adding more jobs and proposals to improve analysis.',
          next_action: 'Continue applying to jobs and tracking outcomes.',
          confidence: Math.min(100, jobs.length * 5),
        },
        agent_status: jobs.length < 5 ? 'learning' : 'optimizing',
      });
    }

    // Log the insight generation
    await supabase
      .from('agent_interactions')
      .insert({
        user_id: user.id,
        interaction_type: 'insight',
        context: { job_count: jobs.length, win_rate: winRate },
        agent_response: analysis.summary || 'Generated insights',
        confidence_score: 0.8,
      })
      .catch(() => {});

    return secureJson(res, 200, {
      insights: Array.isArray(analysis.insights) ? analysis.insights.slice(0, 8) : [],
      coaching: {
        summary: String(analysis.summary || '').slice(0, 500),
        next_action: String(analysis.next_action || '').slice(0, 300),
        pricing_advice: String(analysis.pricing_advice || '').slice(0, 300),
        platform_advice: String(analysis.platform_advice || '').slice(0, 300),
        skill_advice: String(analysis.skill_advice || '').slice(0, 300),
        weekly_goal: String(analysis.weekly_goal || '').slice(0, 300),
        confidence: Math.min(100, Math.round(winRate * 60 + Math.min(40, jobs.length * 2))),
      },
      agent_status: jobs.length < 5 ? 'learning' : 'optimizing',
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
