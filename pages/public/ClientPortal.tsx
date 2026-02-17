import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const ClientPortal: React.FC = () => (
  <PublicPageTemplate
    title="Client Portal"
    description="Share progress, reports, and selected deliverables with clients using public portal pages."
    path="/client-portal"
    heading="Client Portal Experience"
    intro="Publish clear project visibility with secure share links and public-facing pages."
    bullets={[
      'Public share pages for approved data',
      'Track engagement through site analytics',
      'Professional presentation for client trust',
      'Fast loading pages on Vercel edge',
    ]}
  />
);

export default ClientPortal;
