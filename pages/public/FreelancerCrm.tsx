import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const FreelancerCrm: React.FC = () => (
  <PublicPageTemplate
    title="Freelancer CRM"
    description="Track leads, manage job pipeline, and convert opportunities with GetSoloDesk Freelancer CRM."
    path="/freelancer-crm"
    keywords={[
      'freelancer crm',
      'crm for solo freelancers',
      'lead tracking for freelancers',
      'job pipeline software',
    ]}
    heading="Freelancer CRM That Closes More Clients"
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

