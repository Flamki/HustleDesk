import { createClient } from '@supabase/supabase-js';
import { callFireworksChat, hasFireworksConfig } from '../_shared/fireworks.js';
import { secureJson, sanitizeError } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const parseBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
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

const truncate = (value, max = 500) => String(value || '').slice(0, Math.max(0, max)).trim();

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
 * POST /api/ai/agent-learn — Record a win/loss outcome and update agent memory
 * Body: { jobId: string, outcome: 'win' | 'loss', notes?: string }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return secureJson(res, 405, { error: 'Method not allowed' });

  try {
    const { supabase, user, error, status } = await authedClient(req);
    if (error) return secureJson(res, status, { error });

    const body = parseBody(req);
    const jobId = String(body.jobId || '').trim();
    const outcome = String(body.outcome || '').toLowerCase();
    const userNotes = truncate(body.notes, 800);

    if (!jobId) return secureJson(res, 400, { error: 'jobId is required' });
    if (outcome !== 'win' && outcome !== 'loss') {
      return secureJson(res, 400, { error: 'outcome must be "win" or "loss"' });
    }

    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id,title,company,platform,job_description,proposed_price,currency,notes,proposal,status')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (jobError) return secureJson(res, 500, { error: jobError.message });
    if (!job) return secureJson(res, 404, { error: 'Job not found' });

    // Fetch current agent memory (auto-create if missing)
    let { data: memory } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!memory) {
      const { data: created } = await supabase
        .from('agent_memory')
        .insert({ user_id: user.id })
        .select()
        .single();
      memory = created || {
        total_proposals_generated: 0,
        total_wins: 0,
        total_losses: 0,
        current_win_rate: 0,
        current_streak: 0,
        best_win_streak: 0,
        platform_stats: {},
        avg_winning_price: 0,
        avg_losing_price: 0,
        winning_skills: [],
        losing_patterns: [],
        best_performing_tone: 'professional',
        best_performing_length: 'standard',
        tone_stats: {},
        learned_insights: [],
        strategy_version: 1,
      };
    }

    // Fetch profile for skill correlation
    const { data: profile } = await supabase
      .from('freelancer_profiles')
      .select('skills,preferences')
      .eq('user_id', user.id)
      .maybeSingle();

    // ─── Update statistics ───
    const isWin = outcome === 'win';
    const newTotalWins = (memory.total_wins || 0) + (isWin ? 1 : 0);
    const newTotalLosses = (memory.total_losses || 0) + (isWin ? 0 : 1);
    const totalDecided = newTotalWins + newTotalLosses;
    const newWinRate = totalDecided > 0 ? newTotalWins / totalDecided : 0;

    // Streak tracking
    let newStreak = memory.current_streak || 0;
    if (isWin) {
      newStreak = newStreak >= 0 ? newStreak + 1 : 1;
    } else {
      newStreak = newStreak <= 0 ? newStreak - 1 : -1;
    }
    const newBestStreak = Math.max(memory.best_win_streak || 0, isWin ? newStreak : 0);

    // Platform stats
    const platform = (job.platform || 'other').toLowerCase();
    const platformStats = { ...(memory.platform_stats || {}) };
    if (!platformStats[platform]) platformStats[platform] = { wins: 0, losses: 0, avg_price: 0, total_revenue: 0 };
    if (isWin) {
      platformStats[platform].wins += 1;
      platformStats[platform].total_revenue += Number(job.proposed_price || 0);
      platformStats[platform].avg_price = platformStats[platform].total_revenue / platformStats[platform].wins;
    } else {
      platformStats[platform].losses += 1;
    }

    // Pricing analysis
    const proposedPrice = Number(job.proposed_price || 0);
    const prevWinTotal = (memory.avg_winning_price || 0) * (memory.total_wins || 0);
    const prevLossTotal = (memory.avg_losing_price || 0) * (memory.total_losses || 0);
    const newAvgWinPrice = isWin && newTotalWins > 0
      ? (prevWinTotal + proposedPrice) / newTotalWins
      : memory.avg_winning_price || 0;
    const newAvgLossPrice = !isWin && newTotalLosses > 0
      ? (prevLossTotal + proposedPrice) / newTotalLosses
      : memory.avg_losing_price || 0;

    // ─── AI-Powered Learning ───
    let newInsight = null;
    let agentAnalysis = null;

    if (hasFireworksConfig() && totalDecided >= 2) {
      try {
        const prompt = `You are an AI Agent analyzing a freelancer's ${outcome} outcome to learn from it.

Job that was ${outcome === 'win' ? 'WON' : 'LOST'}:
- Title: ${job.title}
- Platform: ${job.platform}
- Company: ${job.company || 'N/A'}
- Proposed Price: ${job.currency || 'USD'} ${proposedPrice}
- Description: ${truncate(job.job_description, 1000)}
${userNotes ? `- User Notes: ${userNotes}` : ''}

Freelancer Stats:
- Win Rate: ${Math.round(newWinRate * 100)}%
- Total Wins: ${newTotalWins}, Losses: ${newTotalLosses}
- Avg Winning Price: ${Math.round(newAvgWinPrice)}
- Avg Losing Price: ${Math.round(newAvgLossPrice)}
- Current Streak: ${newStreak > 0 ? `${newStreak} wins` : `${Math.abs(newStreak)} losses`}
- Skills: ${(profile?.skills || []).join(', ') || 'N/A'}
- Platform Stats: ${JSON.stringify(platformStats)}

Previous Insights: ${JSON.stringify((memory.learned_insights || []).slice(-5))}

Respond with JSON:
{
  "insight": "A single actionable insight (1-2 sentences) based on this outcome.",
  "pattern": "Key pattern identified from this ${outcome}.",
  "recommendation": "What the freelancer should do differently next time.",
  "confidence": 0.0 to 1.0,
  "winning_skill_correlations": ["skill1", "skill2"],
  "risk_factors": ["factor1"]
}`;

        const completion = await callFireworksChat({
          messages: [
            { role: 'system', content: 'You are a data-driven freelance strategy agent. Return valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.25,
          maxTokens: 500,
        });

        agentAnalysis = extractJsonObject(completion.content);
        if (agentAnalysis?.insight) {
          newInsight = {
            type: outcome,
            insight: String(agentAnalysis.insight).slice(0, 300),
            pattern: String(agentAnalysis.pattern || '').slice(0, 200),
            recommendation: String(agentAnalysis.recommendation || '').slice(0, 300),
            confidence: Math.min(1, Math.max(0, Number(agentAnalysis.confidence || 0.5))),
            job_title: job.title,
            platform,
            price: proposedPrice,
            created_at: new Date().toISOString(),
          };
        }
      } catch (aiError) {
        console.error('Agent learning AI analysis failed:', aiError.message);
        // Non-blocking — stats still update even if AI analysis fails
      }
    }

    // ─── Persist updated memory ───
    const updatedInsights = [...(memory.learned_insights || [])];
    if (newInsight) updatedInsights.push(newInsight);
    // Keep max 50 insights (rolling window)
    while (updatedInsights.length > 50) updatedInsights.shift();

    // Update winning skills correlation
    const winningSkills = [...(memory.winning_skills || [])];
    if (isWin && agentAnalysis?.winning_skill_correlations) {
      for (const skill of agentAnalysis.winning_skill_correlations) {
        const existing = winningSkills.find(s => s.skill === skill);
        if (existing) {
          existing.count += 1;
        } else {
          winningSkills.push({ skill, count: 1 });
        }
      }
      winningSkills.sort((a, b) => b.count - a.count);
      while (winningSkills.length > 20) winningSkills.pop();
    }

    const { error: updateError } = await supabase
      .from('agent_memory')
      .upsert({
        user_id: user.id,
        total_wins: newTotalWins,
        total_losses: newTotalLosses,
        current_win_rate: Math.round(newWinRate * 10000) / 10000,
        current_streak: newStreak,
        best_win_streak: newBestStreak,
        platform_stats: platformStats,
        avg_winning_price: Math.round(newAvgWinPrice * 100) / 100,
        avg_losing_price: Math.round(newAvgLossPrice * 100) / 100,
        winning_skills: winningSkills,
        learned_insights: updatedInsights,
        strategy_version: (memory.strategy_version || 1) + 1,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Failed to update agent memory:', updateError.message);
    }

    // ─── Log the interaction ───
    await supabase
      .from('agent_interactions')
      .insert({
        user_id: user.id,
        interaction_type: 'learning',
        context: {
          outcome,
          job_title: job.title,
          platform,
          proposed_price: proposedPrice,
        },
        agent_response: newInsight?.insight || `Recorded ${outcome} for "${job.title}"`,
        outcome,
        job_id: jobId,
        confidence_score: newInsight?.confidence || 0.5,
      })
      .then(() => {})
      .catch((err) => console.error('Failed to log agent interaction:', err.message));

    return secureJson(res, 200, {
      success: true,
      outcome,
      updated_stats: {
        total_wins: newTotalWins,
        total_losses: newTotalLosses,
        win_rate: Math.round(newWinRate * 10000) / 100,
        current_streak: newStreak,
        best_win_streak: newBestStreak,
        strategy_version: (memory.strategy_version || 1) + 1,
      },
      insight: newInsight || null,
      agent_analysis: agentAnalysis || null,
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
