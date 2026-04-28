import { createClient } from '@supabase/supabase-js';
import { secureJson, sanitizeError } from '../_shared/security.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/ai/agent-effectiveness — Aggregate agent memory effectiveness metrics
 * 
 * This endpoint answers the critical question: "Do proposals generated WITH
 * agent memory context win more often than those generated WITHOUT?"
 * 
 * Protected by HEALTHCHECK_TOKEN (admin-only).
 * 
 * Returns:
 * - Overall win rates: with vs without agent memory
 * - Win rate by strategy version (does the agent get better over time?)
 * - Win rate by memory signal count (do more signals = better outcomes?)
 * - Platform-level effectiveness
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return secureJson(res, 405, { error: 'Method not allowed' });

  // Admin-only endpoint
  const token = (req.headers['x-healthcheck-token'] || req.query?.token || '').trim();
  const expected = (process.env.HEALTHCHECK_TOKEN || '').trim();
  if (!expected || token !== expected) {
    return secureJson(res, 401, { error: 'Unauthorized' });
  }

  if (!url || !serviceKey) {
    return secureJson(res, 500, { error: 'Server not configured' });
  }

  try {
    const supabase = createClient(url, serviceKey);

    // Fetch all proposal interactions with outcomes
    // Join: interaction logged the proposal → job_id → job has outcome (won/lost)
    const { data: interactions, error: intError } = await supabase
      .from('agent_interactions')
      .select('id,user_id,context,job_id,confidence_score,created_at')
      .eq('interaction_type', 'proposal')
      .order('created_at', { ascending: true })
      .limit(5000);

    if (intError) return secureJson(res, 500, { error: intError.message });
    if (!interactions || interactions.length === 0) {
      return secureJson(res, 200, {
        status: 'insufficient_data',
        message: 'No proposal interactions recorded yet. Generate proposals and record outcomes to see effectiveness metrics.',
        total_proposals: 0,
      });
    }

    // Get all job outcomes for jobs that had proposals generated
    const jobIds = [...new Set(interactions.map(i => i.job_id).filter(Boolean))];
    if (jobIds.length === 0) {
      return secureJson(res, 200, {
        status: 'insufficient_data',
        message: 'Proposals generated but no job IDs linked.',
        total_proposals: interactions.length,
      });
    }

    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id,status,platform,proposed_price,currency')
      .in('id', jobIds.slice(0, 1000));

    if (jobError) return secureJson(res, 500, { error: jobError.message });

    // Build job outcome map
    const jobOutcome = {};
    for (const job of (jobs || [])) {
      if (job.status === 'won' || job.status === 'lost') {
        jobOutcome[job.id] = {
          outcome: job.status,
          platform: job.platform,
          price: Number(job.proposed_price || 0),
        };
      }
    }

    // ─── Analyze: agent_enhanced vs not ───
    let enhancedWins = 0, enhancedLosses = 0;
    let baselineWins = 0, baselineLosses = 0;

    // By strategy version
    const versionStats = {};
    // By memory signal count (bucketed)
    const signalBuckets = { '0': { wins: 0, losses: 0 }, '1-5': { wins: 0, losses: 0 }, '6-15': { wins: 0, losses: 0 }, '16+': { wins: 0, losses: 0 } };
    // By platform
    const platformEffectiveness = {};
    // Per user
    const userStats = {};

    for (const interaction of interactions) {
      const outcome = jobOutcome[interaction.job_id];
      if (!outcome) continue; // Job not decided yet

      const ctx = interaction.context || {};
      const enhanced = Boolean(ctx.agent_enhanced);
      const isWin = outcome.outcome === 'won';
      const version = ctx.strategy_version || 1;
      const signals = ctx.memory_signals_used || 0;
      const platform = outcome.platform || 'other';

      // Enhanced vs baseline
      if (enhanced) {
        if (isWin) enhancedWins++; else enhancedLosses++;
      } else {
        if (isWin) baselineWins++; else baselineLosses++;
      }

      // Version tracking
      if (!versionStats[version]) versionStats[version] = { wins: 0, losses: 0 };
      if (isWin) versionStats[version].wins++; else versionStats[version].losses++;

      // Signal bucket
      const bucket = signals === 0 ? '0' : signals <= 5 ? '1-5' : signals <= 15 ? '6-15' : '16+';
      if (isWin) signalBuckets[bucket].wins++; else signalBuckets[bucket].losses++;

      // Platform
      if (!platformEffectiveness[platform]) platformEffectiveness[platform] = { enhanced_wins: 0, enhanced_losses: 0, baseline_wins: 0, baseline_losses: 0 };
      if (enhanced) {
        if (isWin) platformEffectiveness[platform].enhanced_wins++; else platformEffectiveness[platform].enhanced_losses++;
      } else {
        if (isWin) platformEffectiveness[platform].baseline_wins++; else platformEffectiveness[platform].baseline_losses++;
      }

      // Per user
      const uid = interaction.user_id;
      if (!userStats[uid]) userStats[uid] = { enhanced_wins: 0, enhanced_losses: 0, baseline_wins: 0, baseline_losses: 0, total_proposals: 0 };
      userStats[uid].total_proposals++;
      if (enhanced) {
        if (isWin) userStats[uid].enhanced_wins++; else userStats[uid].enhanced_losses++;
      } else {
        if (isWin) userStats[uid].baseline_wins++; else userStats[uid].baseline_losses++;
      }
    }

    const winRate = (w, l) => (w + l) > 0 ? Math.round((w / (w + l)) * 10000) / 100 : null;

    const decidedTotal = enhancedWins + enhancedLosses + baselineWins + baselineLosses;

    // Get aggregate agent memory stats
    const { data: allMemory } = await supabase
      .from('agent_memory')
      .select('user_id,total_proposals_generated,total_wins,total_losses,current_win_rate,strategy_version')
      .gt('total_proposals_generated', 0);

    return secureJson(res, 200, {
      status: decidedTotal >= 10 ? 'sufficient_data' : 'collecting_data',
      generated_at: new Date().toISOString(),

      summary: {
        total_proposals_tracked: interactions.length,
        total_decided_outcomes: decidedTotal,
        total_undecided: interactions.filter(i => !jobOutcome[i.job_id]).length,
        unique_users_with_proposals: Object.keys(userStats).length,
      },

      // THE KEY METRIC: Does agent memory improve win rates?
      effectiveness: {
        enhanced_proposals: {
          wins: enhancedWins,
          losses: enhancedLosses,
          win_rate: winRate(enhancedWins, enhancedLosses),
          label: 'Proposals generated WITH agent memory context',
        },
        baseline_proposals: {
          wins: baselineWins,
          losses: baselineLosses,
          win_rate: winRate(baselineWins, baselineLosses),
          label: 'Proposals generated WITHOUT agent memory (first proposals, new users)',
        },
        lift: (() => {
          const eRate = winRate(enhancedWins, enhancedLosses);
          const bRate = winRate(baselineWins, baselineLosses);
          if (eRate === null || bRate === null || bRate === 0) return null;
          return Math.round(((eRate - bRate) / bRate) * 100);
        })(),
        lift_label: 'Percentage improvement in win rate from agent memory',
      },

      // Does the agent get better over strategy versions?
      version_progression: Object.entries(versionStats)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([version, stats]) => ({
          strategy_version: Number(version),
          wins: stats.wins,
          losses: stats.losses,
          win_rate: winRate(stats.wins, stats.losses),
        })),

      // Do more signals = better outcomes?
      signal_correlation: Object.entries(signalBuckets).map(([bucket, stats]) => ({
        signal_range: bucket,
        wins: stats.wins,
        losses: stats.losses,
        win_rate: winRate(stats.wins, stats.losses),
      })),

      // Platform-level effectiveness
      platform_effectiveness: Object.entries(platformEffectiveness).map(([platform, stats]) => ({
        platform,
        enhanced_win_rate: winRate(stats.enhanced_wins, stats.enhanced_losses),
        baseline_win_rate: winRate(stats.baseline_wins, stats.baseline_losses),
        enhanced_sample: stats.enhanced_wins + stats.enhanced_losses,
        baseline_sample: stats.baseline_wins + stats.baseline_losses,
      })),

      // Aggregate agent adoption
      agent_adoption: {
        total_agents: (allMemory || []).length,
        agents_with_outcomes: (allMemory || []).filter(m => m.total_wins + m.total_losses > 0).length,
        avg_strategy_version: (allMemory || []).length > 0
          ? Math.round((allMemory || []).reduce((s, m) => s + m.strategy_version, 0) / allMemory.length * 10) / 10
          : 0,
      },
    });
  } catch (error) {
    return secureJson(res, 500, { error: sanitizeError(error) });
  }
}
