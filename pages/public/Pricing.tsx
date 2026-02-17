import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Pricing: React.FC = () => (
  <PublicPageTemplate
    title="Pricing"
    description="Simple HustleDesk pricing for freelancers with Stripe billing and subscription management."
    heading="Straightforward Pricing"
    intro="Start free, then upgrade when you need advanced operations, billing, and automation."
    bullets={[
      'Single subscription for complete freelancer toolkit',
      'Stripe checkout and billing portal included',
      'No hidden setup or migration fees',
      'Upgrade/downgrade any time',
    ]}
  />
);

export default Pricing;
