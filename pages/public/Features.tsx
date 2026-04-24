import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Features: React.FC = () => (
  <PublicPageTemplate
    title="All Features — Freelancer CRM, AI Proposals & More"
    description="Every tool a solo freelancer needs: AI proposal generator, job pipeline tracker, time tracking, portfolio builder, link-in-bio, analytics, and personalized AI coaching."
    path="/features"
    keywords={[
      'freelancer crm features',
      'freelancer productivity tools',
      'freelance management software',
      'proposal and time tracking software',
      'freelancer dashboard',
      'freelance automation tools',
      'all in one freelancer tool',
    ]}
    heading="Everything You Need to Win as a Freelancer"
    intro="GetSoloDesk replaces 5+ tools with one purpose-built platform. No bloat. No enterprise complexity. Just the features that help you find clients, close deals, and get paid."
    bullets={[
      'AI Proposal Generator — write winning proposals in seconds, not hours',
      'Job Pipeline — visual board to track every opportunity from lead to payment',
      'Automated Follow-ups — never miss a deal-closing moment again',
      'Time Tracking — one-click timer connected to projects and invoicing',
      'Personal AI Agent — learns from your wins and coaches you to improve',
      'Portfolio Builder — publish a professional site with your best work',
      'Link-in-Bio — share your brand, links, and CTAs in one page',
      'Analytics Dashboard — see win rates, earnings, and performance trends',
      '36 Proven Templates — proposals, outreach, follow-ups, and negotiations',
    ]}
  />
);

export default Features;
