import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const ProposalGenerator: React.FC = () => (
  <PublicPageTemplate
    title="Proposal Generator"
    description="Generate client-ready proposals faster with editable templates in HustleDesk."
    heading="Proposal Generator"
    intro="Turn job details into polished proposals quickly, then customize for each client."
    bullets={[
      'Template-based proposal generation',
      'Override and personalize content per job',
      'Consistent quality across outbound proposals',
      'Faster response time to inbound leads',
    ]}
  />
);

export default ProposalGenerator;
