import React, { useEffect, useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Trophy,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Flame,
  Shield,
  RefreshCcw,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useAgent } from '../../context/AgentContext';

// ═══════════════════════════════════════════════════════════
// Agent Insights Panel — Dashboard component showing agent
// learning state, performance metrics, and AI coaching
// ═══════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  initializing: {
    label: 'Initializing',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    pulse: true,
    description: 'Your agent is getting ready. Add jobs to start training.',
  },
  learning: {
    label: 'Learning',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    pulse: true,
    description: 'Your agent is analyzing patterns from your activity.',
  },
  optimizing: {
    label: 'Optimizing',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    pulse: false,
    description: 'Your agent is actively improving your win rate.',
  },
};

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  strength: <Shield size={14} className="text-emerald-500" />,
  weakness: <AlertTriangle size={14} className="text-amber-500" />,
  opportunity: <Lightbulb size={14} className="text-blue-500" />,
  trend: <TrendingUp size={14} className="text-purple-500" />,
};

const INSIGHT_COLORS: Record<string, string> = {
  strength: 'border-emerald-500/20 bg-emerald-500/5',
  weakness: 'border-amber-500/20 bg-amber-500/5',
  opportunity: 'border-blue-500/20 bg-blue-500/5',
  trend: 'border-purple-500/20 bg-purple-500/5',
};

const formatStreak = (streak: number): string => {
  if (streak === 0) return 'No streak';
  if (streak > 0) return `🔥 ${streak} win${streak > 1 ? 's' : ''}`;
  return `${Math.abs(streak)} loss${Math.abs(streak) > 1 ? 'es' : ''}`;
};

const formatPlatform = (platform: string): string => {
  const map: Record<string, string> = { upwork: 'Upwork', fiverr: 'Fiverr', linkedin: 'LinkedIn', other: 'Other' };
  return map[platform] || platform;
};

export const AgentInsightsPanel: React.FC = () => {
  const {
    agentContext,
    coaching,
    status,
    confidence,
    agentStatusLabel,
    winRate,
    currentStreak,
    refreshAgent,
    refreshInsights,
    insightsLoading,
  } = useAgent();

  const [showInsights, setShowInsights] = useState(false);
  const [hasLoadedInsights, setHasLoadedInsights] = useState(false);

  const statusConfig = STATUS_CONFIG[agentStatusLabel as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.initializing;
  const stats = agentContext?.stats;
  const memory = agentContext?.agent?.memory;
  const recentInsights = memory?.learned_insights?.slice(-3) || [];

  const handleLoadInsights = async () => {
    if (!hasLoadedInsights) {
      await refreshInsights();
      setHasLoadedInsights(true);
    }
    setShowInsights(!showInsights);
  };

  // If agent isn't loaded yet, show minimal skeleton
  if (status === 'loading' && !agentContext) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Brain size={20} />
              </div>
              {statusConfig.pulse && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                Your AI Agent
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                  {statusConfig.label}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {statusConfig.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refreshAgent()}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh agent"
          >
            <RefreshCcw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Confidence bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Agent Confidence
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {confidence}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800">
          <div className="bg-white dark:bg-slate-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={12} className="text-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Win Rate</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {winRate > 0 ? `${winRate}%` : '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame size={12} className="text-orange-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Streak</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatStreak(currentStreak)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Wins</span>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {stats.total_wins}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown size={12} className="text-red-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Losses</span>
            </div>
            <p className="text-lg font-bold text-red-500 dark:text-red-400">
              {stats.total_losses}
            </p>
          </div>
        </div>
      )}

      {/* Platform Performance */}
      {agentContext?.platform_breakdown && Object.keys(agentContext.platform_breakdown).length > 0 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart3 size={12} />
            Platform Performance
          </h4>
          <div className="space-y-2">
            {Object.entries(agentContext.platform_breakdown).map(([platform, data]) => {
              const total = data.wins + data.losses;
              const platformWinRate = total > 0 ? Math.round((data.wins / total) * 100) : 0;
              return (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {formatPlatform(platform)}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-emerald-600 font-semibold">{data.wins}W</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-red-500 font-semibold">{data.losses}L</span>
                    </div>
                    {total > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        platformWinRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {platformWinRate}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Agent Insights */}
      {recentInsights.length > 0 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={12} />
            Recent Agent Learnings
          </h4>
          <div className="space-y-2">
            {recentInsights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs ${
                  insight.type === 'win'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-start gap-2">
                  {insight.type === 'win' ? (
                    <Trophy size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {insight.insight}
                    </p>
                    {insight.recommendation && (
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coaching Button */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleLoadInsights}
          disabled={insightsLoading}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 border border-indigo-500/10 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {insightsLoading ? 'Analyzing your data...' : showInsights ? 'Hide AI Coaching' : 'Get AI Coaching'}
            </span>
          </div>
          <ChevronRight
            size={14}
            className={`text-indigo-400 transition-transform ${showInsights ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
          />
        </button>

        {/* Coaching Panel */}
        {showInsights && coaching && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {coaching.coaching.summary}
              </p>
              {coaching.coaching.next_action && (
                <div className="mt-2 flex items-start gap-2">
                  <Target size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    {coaching.coaching.next_action}
                  </p>
                </div>
              )}
            </div>

            {/* Detailed Insights */}
            {coaching.insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${INSIGHT_COLORS[insight.type] || 'border-slate-200 bg-slate-50'}`}
              >
                <div className="flex items-start gap-2">
                  {INSIGHT_ICONS[insight.type] || <Lightbulb size={14} className="text-slate-400" />}
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {insight.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {insight.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Advice cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {coaching.coaching.pricing_advice && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">💰 Pricing</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{coaching.coaching.pricing_advice}</p>
                </div>
              )}
              {coaching.coaching.platform_advice && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">🎯 Platform</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{coaching.coaching.platform_advice}</p>
                </div>
              )}
              {coaching.coaching.skill_advice && (
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1">⚡ Skills</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{coaching.coaching.skill_advice}</p>
                </div>
              )}
              {coaching.coaching.weekly_goal && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">🎯 Weekly Goal</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{coaching.coaching.weekly_goal}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
