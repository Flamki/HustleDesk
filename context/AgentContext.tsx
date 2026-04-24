import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import type {
  AgentContextResponse,
  AgentLearnResult,
  AgentCoachingResponse,
} from '../services/supabaseService';
import * as service from '../services/supabaseService';

// ═══════════════════════════════════════════════════════════
// Agent Context — provides per-user AI agent state app-wide
// ═══════════════════════════════════════════════════════════

export type AgentStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AgentContextType {
  /** Full agent context including memory, stats, and recent data */
  agentContext: AgentContextResponse | null;
  /** Agent coaching insights */
  coaching: AgentCoachingResponse | null;
  /** Loading state for the agent context */
  status: AgentStatus;
  /** Error message if agent failed to load */
  errorMessage: string | null;
  /** Refresh agent context from server */
  refreshAgent: () => Promise<void>;
  /** Record a win or loss for agent learning */
  recordOutcome: (jobId: string, outcome: 'win' | 'loss', notes?: string) => Promise<AgentLearnResult | null>;
  /** Fetch fresh AI coaching insights */
  refreshInsights: () => Promise<void>;
  /** Whether insights are currently loading */
  insightsLoading: boolean;
  /** Agent confidence score (0-100) */
  confidence: number;
  /** Agent status label */
  agentStatusLabel: string;
  /** Win rate as percentage */
  winRate: number;
  /** Current streak */
  currentStreak: number;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const AGENT_CACHE_KEY = 'agent_context_cache_v1';
const AGENT_CACHE_TTL_MS = 60_000; // 1 minute

const readCachedAgent = (): AgentContextResponse | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AGENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: AgentContextResponse; ts: number };
    if (!parsed?.data || Date.now() - parsed.ts > AGENT_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCachedAgent = (data: AgentContextResponse): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AGENT_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // noop
  }
};

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [agentContext, setAgentContext] = useState<AgentContextResponse | null>(() => readCachedAgent());
  const [coaching, setCoaching] = useState<AgentCoachingResponse | null>(null);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const fetchedRef = useRef(false);

  const refreshAgent = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    setErrorMessage(null);

    try {
      const { data, error } = await service.getAgentContext();
      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }
      if (data) {
        setAgentContext(data);
        writeCachedAgent(data);
      }
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load agent');
      setStatus('error');
    }
  }, [user]);

  const recordOutcome = useCallback(async (
    jobId: string,
    outcome: 'win' | 'loss',
    notes?: string
  ): Promise<AgentLearnResult | null> => {
    const { data, error } = await service.recordAgentOutcome(jobId, outcome, notes);
    if (error) {
      console.error('Agent learn error:', error.message);
      return null;
    }
    // Refresh agent context after learning
    void refreshAgent();
    return data;
  }, [refreshAgent]);

  const refreshInsights = useCallback(async () => {
    if (!user) return;
    setInsightsLoading(true);
    try {
      const { data } = await service.getAgentInsights();
      if (data) setCoaching(data);
    } catch {
      // non-blocking
    } finally {
      setInsightsLoading(false);
    }
  }, [user]);

  // Auto-fetch agent context when user logs in
  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchedRef.current = true;
      void refreshAgent();
    }
    if (!user) {
      fetchedRef.current = false;
      setAgentContext(null);
      setCoaching(null);
      setStatus('idle');
    }
  }, [user, refreshAgent]);

  const confidence = agentContext?.agent?.confidence ?? 0;
  const agentStatusLabel = agentContext?.agent?.status ?? 'initializing';
  const winRate = agentContext?.stats?.live_win_rate ?? 0;
  const currentStreak = agentContext?.stats?.current_streak ?? 0;

  return (
    <AgentContext.Provider
      value={{
        agentContext,
        coaching,
        status,
        errorMessage,
        refreshAgent,
        recordOutcome,
        refreshInsights,
        insightsLoading,
        confidence,
        agentStatusLabel,
        winRate,
        currentStreak,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
