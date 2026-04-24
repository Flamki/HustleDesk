import { createClient } from '@supabase/supabase-js';
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

/**
 * GET  /api/ai/agent-context — Fetch complete agent context for the current user
 * Returns agent memory, recent interactions, profile, job stats — everything the agent knows.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return secureJson(res, 405, { error: 'Method not allowed' });

  try {
    const { supabase, user, error, status } = await authedClient(req);
    if (error) return secureJson(res, status, { error });

    // Fetch all agent data in parallel for performance
    const [
      memoryResult,
      profileResult,
      recentInteractionsResult,
      jobStatsResult,
      recentWinsResult,
      recentLossesResult,
    ] = await Promise.all([
      // Agent memory
      supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),

      // Freelancer profile
      supabase
        .from('freelancer_profiles')
        .select('skills,experience_level,years_experience,bio,portfolio_url,linkedin_url,hourly_rate,past_projects,communication_style,completed_onboarding,preferences')
        .eq('user_id', user.id)
        .maybeSingle(),

      // Recent agent interactions (last 20)
      supabase
        .from('agent_interactions')
        .select('id,interaction_type,context,agent_response,outcome,confidence_score,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),

      // Job statistics
      supabase
        .from('jobs')
        .select('id,status,platform,proposed_price,currency,created_at,closed_at')
        .eq('user_id', user.id)
        .in('status', ['won', 'lost', 'applied', 'replied']),

      // Recent wins for pattern analysis
      supabase
        .from('jobs')
        .select('id,title,company,platform,job_description,proposed_price,currency,notes,proposal,created_at,closed_at')
        .eq('user_id', user.id)
        .eq('status', 'won')
        .order('closed_at', { ascending: false })
        .limit(10),

      // Recent losses for pattern analysis
      supabase
        .from('jobs')
        .select('id,title,company,platform,job_description,proposed_price,currency,notes,created_at,closed_at')
        .eq('user_id', user.id)
        .eq('status', 'lost')
        .order('closed_at', { ascending: false })
        .limit(10),
    ]);

    // Auto-create agent memory if it doesn't exist
    let agentMemory = memoryResult.data;
    if (!agentMemory && !memoryResult.error) {
      const { data: newMemory } = await supabase
        .from('agent_memory')
        .insert({ user_id: user.id })
        .select()
        .single();
      agentMemory = newMemory;
    }

    // Compute live stats from job data
    const allJobs = jobStatsResult.data || [];
    const wins = allJobs.filter(j => j.status === 'won');
    const losses = allJobs.filter(j => j.status === 'lost');
    const applied = allJobs.filter(j => j.status === 'applied' || j.status === 'replied');

    const liveWinRate = (wins.length + losses.length) > 0
      ? wins.length / (wins.length + losses.length)
      : 0;

    // Platform breakdown
    const platformBreakdown = {};
    for (const job of allJobs) {
      const p = job.platform || 'other';
      if (!platformBreakdown[p]) platformBreakdown[p] = { wins: 0, losses: 0, applied: 0, total_revenue: 0 };
      if (job.status === 'won') {
        platformBreakdown[p].wins += 1;
        platformBreakdown[p].total_revenue += Number(job.proposed_price || 0);
      }
      if (job.status === 'lost') platformBreakdown[p].losses += 1;
      if (job.status === 'applied' || job.status === 'replied') platformBreakdown[p].applied += 1;
    }

    // Calculate best platform
    let bestPlatform = null;
    let bestPlatformWinRate = 0;
    for (const [platform, stats] of Object.entries(platformBreakdown)) {
      const total = stats.wins + stats.losses;
      if (total >= 2) {
        const rate = stats.wins / total;
        if (rate > bestPlatformWinRate) {
          bestPlatformWinRate = rate;
          bestPlatform = platform;
        }
      }
    }

    // Average pricing analysis
    const avgWinPrice = wins.length > 0
      ? wins.reduce((sum, j) => sum + Number(j.proposed_price || 0), 0) / wins.length
      : 0;
    const avgLossPrice = losses.length > 0
      ? losses.reduce((sum, j) => sum + Number(j.proposed_price || 0), 0) / losses.length
      : 0;

    // Agent confidence score (based on data volume + win rate)
    const dataVolume = Math.min(1, allJobs.length / 20); // normalized 0-1
    const performanceScore = liveWinRate;
    const agentConfidence = Math.round(((dataVolume * 0.4) + (performanceScore * 0.6)) * 100);

    // Build response
    return secureJson(res, 200, {
      agent: {
        memory: agentMemory || null,
        confidence: agentConfidence,
        strategy_version: agentMemory?.strategy_version || 1,
        status: allJobs.length === 0 ? 'initializing' : allJobs.length < 5 ? 'learning' : 'optimizing',
      },
      profile: profileResult.data || null,
      stats: {
        total_proposals: agentMemory?.total_proposals_generated || 0,
        total_wins: wins.length,
        total_losses: losses.length,
        active_applications: applied.length,
        live_win_rate: Math.round(liveWinRate * 10000) / 100,
        avg_winning_price: Math.round(avgWinPrice * 100) / 100,
        avg_losing_price: Math.round(avgLossPrice * 100) / 100,
        best_platform: bestPlatform,
        best_platform_win_rate: Math.round(bestPlatformWinRate * 10000) / 100,
        current_streak: agentMemory?.current_streak || 0,
        best_win_streak: agentMemory?.best_win_streak || 0,
      },
      platform_breakdown: platformBreakdown,
      recent_wins: (recentWinsResult.data || []).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        platform: j.platform,
        proposed_price: j.proposed_price,
        currency: j.currency,
        closed_at: j.closed_at,
      })),
      recent_losses: (recentLossesResult.data || []).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        platform: j.platform,
        proposed_price: j.proposed_price,
        currency: j.currency,
        closed_at: j.closed_at,
      })),
      recent_interactions: recentInteractionsResult.data || [],
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
