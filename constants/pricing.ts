/**
 * Pricing Tiers and Feature Gates
 * Central configuration for monetization
 */

export type PlanTier = 'free' | 'pro';

export interface PlanFeatures {
  // Core limits
  jobs: number; // -1 = unlimited
  clients: number;
  timeEntries: number; // per month
  proposals: number; // per month
  
  // AI features
  aiCredits: number; // per month
  aiProposalGeneration: boolean;
  
  // Marketing
  emailCampaigns: number; // per month
  emailContacts: number;
  marketingWebsites: number;
  portfolioSites: number;
  linkInBioSites: number;
  customDomain: boolean;
  
  // Advanced features
  clientPortal: boolean;
  timeTracking: boolean;
  invoicing: boolean;
  analytics: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  ssoLogin: boolean;
  prioritySupport: boolean;
  whitelabel: boolean;
  
  // Collaboration
  teamMembers: number;
  clientUsers: number;
}

export interface PricingPlan {
  id: PlanTier;
  name: string;
  description: string;
  price: {
    monthly: number; // in cents
    yearly: number; // in cents (usually discounted)
  };
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
  features: PlanFeatures;
  popular?: boolean;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
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
    customDomain: false,
    clientPortal: false,
    timeTracking: true,
    invoicing: false,
    analytics: false,
    advancedReports: false,
    apiAccess: false,
    webhooks: false,
    ssoLogin: false,
    prioritySupport: false,
    whitelabel: false,
    teamMembers: 1,
    clientUsers: 0,
  },
  pro: {
    jobs: -1, // unlimited
    clients: -1,
    timeEntries: -1,
    proposals: -1,
    aiCredits: 1000,
    aiProposalGeneration: true,
    emailCampaigns: -1,
    emailContacts: -1,
    marketingWebsites: -1,
    portfolioSites: -1,
    linkInBioSites: -1,
    customDomain: true,
    clientPortal: true,
    timeTracking: true,
    invoicing: true,
    analytics: true,
    advancedReports: true,
    apiAccess: true,
    webhooks: true,
    ssoLogin: false,
    prioritySupport: true,
    whitelabel: false,
    teamMembers: -1,
    clientUsers: -1,
  },
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: {
      monthly: 0,
      yearly: 0,
    },
    stripePriceIds: {
      monthly: '',
      yearly: '',
    },
    features: PLAN_FEATURES.free,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Complete freelancer toolkit',
    price: {
      monthly: 900, // $9/mo
      yearly: 9000, // $90/yr (save $18)
    },
    stripePriceIds: {
      monthly: process.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || '',
      yearly: process.env.VITE_STRIPE_PRICE_ID_PRO_YEARLY || '',
    },
    features: PLAN_FEATURES.pro,
    popular: true,
  },
];

/**
 * Get formatted limit display text
 */
export function getLimitDisplayText(limit: number): string {
  if (limit === -1) return 'Unlimited';
  return limit.toLocaleString();
}

/**
 * Get plan configuration by tier
 */
export function getPlanFeatures(tier: PlanTier): PlanFeatures {
  return PLAN_FEATURES[tier] || PLAN_FEATURES.free;
}

/**
 * Get pricing plan by tier
 */
export function getPricingPlan(tier: PlanTier): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.id === tier);
}

/**
 * Check if feature is available for plan
 */
export function hasFeature(tier: PlanTier, feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(tier);
  const value = features[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0 || value === -1;
  
  return false;
}

/**
 * Check if limit is reached for a numeric feature
 */
export function isLimitReached(
  tier: PlanTier,
  feature: keyof PlanFeatures,
  currentUsage: number
): boolean {
  const features = getPlanFeatures(tier);
  const limit = features[feature];
  
  if (typeof limit !== 'number') return false;
  if (limit === -1) return false; // unlimited
  
  return currentUsage >= limit;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Calculate savings for yearly plan
 */
export function calculateYearlySavings(plan: PricingPlan): number {
  const monthlyTotal = plan.price.monthly * 12;
  return monthlyTotal - plan.price.yearly;
}
