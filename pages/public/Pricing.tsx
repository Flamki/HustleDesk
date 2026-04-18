import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Pricing: React.FC = () => (
  <PublicPageTemplate
    title="Pricing"
    description="Simple GetSoloDesk pricing for freelancers with Razorpay billing and international checkout."
    path="/pricing"
    keywords={[
      'freelancer crm pricing',
      'freelancer software subscription',
      'proposal and time tracking pricing',
    ]}
    heading="Straightforward Pricing"
    intro="Start free, then upgrade when you need advanced operations, billing, and automation."
    bullets={[
      'Single subscription for complete freelancer toolkit',
      'Razorpay checkout with international card support',
      'No hidden setup or migration fees',
      'Upgrade/downgrade any time',
    ]}
  />
);

export default Pricing;

