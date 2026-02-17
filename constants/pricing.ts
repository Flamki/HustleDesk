/**
 * Pricing Tiers and Feature Gates
 * Central configuration for monetization
 */

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

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
    customDomain: false,
    clientPortal: true,
    timeTracking: true,
    invoicing: true,
    analytics: true,
    advancedReports: false,
    apiAccess: false,
    webhooks: false,
    ssoLogin: false,
    prioritySupport: false,
    whitelabel: false,
    teamMembers: 1,
    clientUsers: 3,
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
    teamMembers: 5,
    clientUsers: 20,
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
    customDomain: true,
    clientPortal: true,
    timeTracking: true,
    invoicing: true,
    analytics: true,
    advancedReports: true,
    apiAccess: true,
    webhooks: true,
    ssoLogin: true,
    prioritySupport: true,
    whitelabel: true,
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
    id: 'starter',
    name: 'Starter',
    description: 'For growing freelancers',
    price: {
      monthly: 2900, // $29/mo
      yearly: 29000, // $290/yr (save $58)
    },
    stripePriceIds: {
      monthly: process.env.VITE_STRIPE_PRICE_ID_STARTER_MONTHLY || '',
      yearly: process.env.VITE_STRIPE_PRICE_ID_STARTER_YEARLY || '',
    },
    features: PLAN_FEATURES.starter,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For established freelancers',
    price: {
      monthly: 7900, // $79/mo
      yearly: 79000, // $790/yr (save $158)
    },
    stripePriceIds: {
      monthly: process.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || '',
      yearly: process.env.VITE_STRIPE_PRICE_ID_PRO_YEARLY || '',
    },
    features: PLAN_FEATURES.pro,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and agencies',
    price: {
      monthly: 29900, // $299/mo
      yearly: 299000, // $2990/yr (save $598)
    },
    stripePriceIds: {
      monthly: process.env.VITE_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY || '',
      yearly: process.env.VITE_STRIPE_PRICE_ID_ENTERPRISE_YEARLY || '',
    },
    features: PLAN_FEATURES.enterprise,
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
