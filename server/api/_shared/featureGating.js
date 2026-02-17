// Shared utility for feature gating and limit enforcement
// Uses same pricing configuration as frontend

// Plan features configuration - sync with constants/pricing.ts
const PLAN_FEATURES = {
  free: {
    jobs: 10,
    clients: 5,
    timeEntries: 50,
    proposals: 2,
    aiCredits: 5,
    aiProposalGeneration: false,
    emailCampaigns: 0,
    emailContacts: 0,
    marketingWebsites: 0,
    portfolioSites: 1,
    linkInBioSites: 1,
  },
  starter: {
    jobs: 50,
    clients: 25,
    timeEntries: 500,
    proposals: 20,
    aiCredits: 100,
    aiProposalGeneration: true,
    emailCampaigns: 5,
    emailContacts: 500,
    marketingWebsites: 1,
    portfolioSites: 1,
    linkInBioSites: 1,
  },
  pro: {
    jobs: -1, // unlimited
    clients: -1,
    timeEntries: -1,
    proposals: -1,
    aiCredits: 1000,
    aiProposalGeneration: true,
    emailCampaigns: 50,
    emailContacts: 5000,
    marketingWebsites: 3,
    portfolioSites: 3,
    linkInBioSites: 3,
  },
  enterprise: {
    jobs: -1,
    clients: -1,
    timeEntries: -1,
    proposals: -1,
    aiCredits: 10000,
    aiProposalGeneration: true,
    emailCampaigns: -1,
    emailContacts: -1,
    marketingWebsites: -1,
    portfolioSites: -1,
    linkInBioSites: -1,
  },
};

/**
 * Get plan features for a tier
 */
export const getPlanFeatures = (tier) => {
  return PLAN_FEATURES[tier] || PLAN_FEATURES.free;
};

/**
 * Check if a feature is available for a plan tier
 */
export const hasFeature = (tier, feature) => {
  const features = getPlanFeatures(tier);
  const value = features[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0 || value === -1;
  
  return false;
};

/**
 * Check if limit is reached for a numeric feature
 */
export const isLimitReached = (tier, feature, currentUsage) => {
  const features = getPlanFeatures(tier);
  const limit = features[feature];
  
  if (typeof limit !== 'number') return false;
  if (limit === -1) return false; // unlimited
  
  return currentUsage >= limit;
};

/**
 * Get current usage count for a feature from user profile
 */
export const getCurrentUsage = async (supabase, userId, feature) => {
  const counterField = `${feature}_count`;
  
  const { data } = await supabase
    .from('users')
    .select(counterField)
    .eq('id', userId)
    .maybeSingle();
  
  return data ? (data[counterField] || 0) : 0;
};

/**
 * Check if user can perform action based on plan limits
 * Returns { allowed: boolean, reason?: string, upgradeRequired?: boolean }
 */
export const checkLimit = async (supabase, userId, feature) => {
  // Get user's plan tier
  const { data: user } = await supabase
    .from('users')
    .select('plan_tier')
    .eq('id', userId)
    .maybeSingle();
  
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }
  
  const tier = user.plan_tier || 'free';
  const currentUsage = await getCurrentUsage(supabase, userId, feature);
  
  if (isLimitReached(tier, feature, currentUsage)) {
    return {
      allowed: false,
      reason: `You've reached your plan limit for ${feature}`,
      upgradeRequired: true,
      currentUsage,
      limit: getPlanFeatures(tier)[feature],
    };
  }
  
  return { allowed: true, currentUsage };
};
