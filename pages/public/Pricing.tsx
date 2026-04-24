import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Pricing: React.FC = () => (
  <PublicPageTemplate
    title="Pricing — Free Plan Available"
    description="GetSoloDesk is free for freelancers. Start with all core features at no cost. Upgrade only when you need advanced automation, analytics, and unlimited AI proposals."
    path="/pricing"
    keywords={[
      'freelancer crm pricing',
      'free freelancer tools',
      'freelance crm free plan',
      'freelancer software subscription',
      'affordable freelance management tool',
      'getsolodesk pricing',
    ]}
    heading="Simple, Fair Pricing"
    intro="Start free with everything you need to manage your freelance business. Upgrade when your business grows and you need advanced features."
    bullets={[
      'Free plan includes: job tracking, AI proposals, time tracking, templates, and portfolio builder',
      'No credit card required — sign up with Google and start in 30 seconds',
      'Pro plan unlocks: unlimited AI proposals, advanced analytics, priority support',
      'Razorpay checkout with international card, UPI, and wallet support',
      'No hidden fees, no setup costs, cancel anytime',
      'Solo freelancer friendly — built for one person, priced for one person',
    ]}
  />
);

export default Pricing;
