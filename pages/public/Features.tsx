import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Features: React.FC = () => (
  <PublicPageTemplate
    title="Features"
    description="Explore HustleDesk features for freelancers: CRM, proposals, time tracking, analytics, and website builder."
    path="/features"
    heading="Features Built for Freelancers"
    intro="Run client acquisition and delivery from one workspace designed for solo operators and small teams."
    bullets={[
      'Job pipeline with status tracking and reminders',
      'Proposal generation with reusable templates',
      'Time tracking and earnings summary',
      'Client analytics and performance insights',
      'Portfolio and link-in-bio builder with publishing',
    ]}
  />
);

export default Features;
