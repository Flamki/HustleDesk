import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const ClientPortal: React.FC = () => (
  <PublicPageTemplate
    title="Client Portal for Freelancers"
    description="Share project progress, deliverables, and reports with clients through beautiful, branded portal pages. Build trust and look professional."
    path="/client-portal"
    keywords={[
      'client portal for freelancers',
      'freelancer client dashboard',
      'share project progress with clients',
      'freelance client communication tool',
      'client reporting for freelancers',
    ]}
    heading="Client Portal — Professional Updates Your Clients Love"
    intro="Stop sending messy email chains. Give each client a clean, branded portal where they can see project progress, download deliverables, and stay informed."
    bullets={[
      'Branded share pages that make you look professional and organized',
      'Secure links — control exactly what each client can see',
      'Real-time project status visibility reduces "any update?" messages',
      'Engagement tracking — see when clients view your updates',
      'Lightning-fast pages served from the edge (Vercel CDN)',
      'Works on mobile — clients can check progress from anywhere',
    ]}
  />
);

export default ClientPortal;
