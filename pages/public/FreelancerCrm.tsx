import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const FreelancerCrm: React.FC = () => (
  <PublicPageTemplate
    title="Freelancer CRM"
    description="Track leads, manage job pipeline, and convert opportunities with HustleDesk Freelancer CRM."
    heading="Freelancer CRM That Closes More Work"
    intro="Organize leads, follow-ups, and active deals so nothing slips through."
    bullets={[
      'Lead and opportunity tracking',
      'Stage-based job pipeline',
      'Search and filtering for faster operations',
      'Dashboard metrics for conversion visibility',
    ]}
  />
);

export default FreelancerCrm;
