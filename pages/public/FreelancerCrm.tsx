import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const FreelancerCrm: React.FC = () => (
  <PublicPageTemplate
    title="Best CRM for Freelancers — Free"
    description="The only CRM built for solo freelancers. Track jobs, manage clients, automate follow-ups, and get AI-powered insights — completely free."
    path="/freelancer-crm"
    keywords={[
      'freelancer crm',
      'best crm for freelancers',
      'crm for freelancers free',
      'freelance client management software',
      'solo freelancer crm',
      'freelance job tracker',
      'freelance pipeline management',
      'client relationship management freelance',
    ]}
    heading="The CRM Built for Freelancers"
    intro="Enterprise CRMs are overkill. Spreadsheets are chaos. GetSoloDesk is the sweet spot — a lightweight CRM designed specifically for solo freelancers who want to win more and stress less."
    bullets={[
      'Visual job pipeline: track every opportunity from Saved → Applied → Won',
      'Automated follow-up reminders so you never miss a deal-closing moment',
      'Client management with full contact history and project context',
      'Per-platform analytics: see your win rate on Upwork, Fiverr, LinkedIn, and more',
      'AI agent that learns your patterns and coaches you to improve',
      'Free forever plan with all core features — no credit card required',
    ]}
  />
);

export default FreelancerCrm;
