/**
 * Feature Gating Utilities
 * Provides hooks and utilities for checking feature access based on plan tier
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PlanTier, 
  PlanFeatures, 
  getPlanFeatures, 
  hasFeature as checkFeature,
  isLimitReached as checkLimitReached 
} from '../constants/pricing';

/**
 * Hook to check if user has access to a feature
 */
export function useFeatureAccess(feature: keyof PlanFeatures): boolean {
  const { user } = useAuth();
  const tier = (user?.plan || 'free') as PlanTier;
  return checkFeature(tier, feature);
}

/**
 * Hook to get feature limits for current plan
 */
export function useFeatureLimits(): PlanFeatures {
  const { user } = useAuth();
  const tier = (user?.plan || 'free') as PlanTier;
  return getPlanFeatures(tier);
}

/**
 * Hook to check if a numeric limit has been reached
 */
export function useIsLimitReached(
  feature: keyof PlanFeatures,
  currentUsage: number
): boolean {
  const { user } = useAuth();
  const tier = (user?.plan || 'free') as PlanTier;
  return checkLimitReached(tier, feature, currentUsage);
}

/**
 * Hook to get limit info for a feature
 */
export function useLimitInfo(feature: keyof PlanFeatures, currentUsage: number) {
  const limits = useFeatureLimits();
  const limit = limits[feature];
  
  if (typeof limit !== 'number') {
    return { hasLimit: false, limit: 0, usage: currentUsage, remaining: 0, isUnlimited: false };
  }
  
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - currentUsage);
  const isReached = !isUnlimited && currentUsage >= limit;
  
  return {
    hasLimit: true,
    limit: isUnlimited ? Infinity : limit,
    usage: currentUsage,
    remaining,
    isUnlimited,
    isReached,
    percentUsed: isUnlimited ? 0 : Math.min(100, (currentUsage / limit) * 100),
  };
}

/**
 * Get formatted limit display text
 */
export function getLimitDisplayText(limit: number): string {
  if (limit === -1) return 'Unlimited';
  return limit.toLocaleString();
}

/**
 * Component wrapper for feature gating
 */
interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const hasAccess = useFeatureAccess(feature);
  
  if (!hasAccess) {
    return fallback || null;
  }
  
  return <>{children}</>;
}

/**
 * Component for displaying upgrade prompt
 */
interface UpgradePromptProps {
  feature: string;
  requiredPlan?: PlanTier;
  className?: string;
}

export function UpgradePrompt({ feature, requiredPlan = 'pro', className = '' }: UpgradePromptProps) {
  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Upgrade to unlock {feature}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            This feature is available on the {requiredPlan} plan and above.
          </p>
          <a
            href="/app/settings?tab=billing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
          >
            View Plans
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Component for displaying limit reached message
 */
interface LimitReachedProps {
  feature: string;
  limit: number;
  className?: string;
}

export function LimitReached({ feature, limit, className = '' }: LimitReachedProps) {
  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {feature} Limit Reached
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            You've reached your limit of {getLimitDisplayText(limit)}. Upgrade to continue.
          </p>
          <a
            href="/app/settings?tab=billing"
            className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Upgrade Plan
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
