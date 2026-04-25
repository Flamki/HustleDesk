import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Bell,
  Users,
  BarChart3,
  Bot,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const FreelancerCrm: React.FC = () => (
  <PublicPageTemplate
    title="Best CRM for Freelancers — Free"
    description="The only CRM built for solo freelancers. Track jobs, manage clients, automate follow-ups, and get AI-powered insights — completely free."
    path="/freelancer-crm"
    keywords={[
      'freelancer crm', 'best crm for freelancers', 'crm for freelancers free',
      'freelance client management software', 'solo freelancer crm',
      'freelance job tracker', 'freelance pipeline management',
    ]}
    badge="CRM"
    badgeColor="from-emerald-400 to-teal-500"
    heading="The CRM Built for "
    headingAccent="Freelancers"
    intro="Enterprise CRMs are overkill. Spreadsheets are chaos. GetSoloDesk is the sweet spot — a lightweight CRM designed specifically for solo freelancers who want to win more and stress less."
    accentFrom="#10b981"
    accentTo="#14b8a6"
    stats={[
      { value: '10x', label: 'Faster pipeline setup' },
      { value: '73%', label: 'Win rate improvement' },
      { value: '$0', label: 'Forever free' },
      { value: '2 min', label: 'To get started' },
    ]}
    features={[
      { icon: Kanban, title: 'Visual Job Pipeline', desc: 'Track every opportunity from Saved → Applied → Replied → Won. Drag-and-drop Kanban board built for freelance workflows.' },
      { icon: Bell, title: 'Smart Follow-Up Reminders', desc: 'Never miss a follow-up again. Automated reminders trigger based on deal stage and days since last contact.' },
      { icon: Users, title: 'Client Management', desc: 'Full contact history, project context, and relationship health scores for every client in one place.' },
      { icon: BarChart3, title: 'Per-Platform Analytics', desc: 'See your win rate on Upwork, Fiverr, LinkedIn, and direct outreach. Know where to focus your energy.' },
      { icon: Bot, title: 'AI Agent Coach', desc: 'Your personal AI agent learns your patterns, identifies your strengths, and coaches you to improve with every application.' },
      { icon: Search, title: 'Smart Search & Filters', desc: 'Find any job, client, or note instantly. Filter by platform, status, date range, and revenue.' },
      { icon: Target, title: 'Goal Tracking', desc: 'Set monthly revenue targets and track progress in real-time. Visualize your growth trajectory.' },
      { icon: TrendingUp, title: 'Revenue Dashboard', desc: 'See total revenue, average deal size, and monthly trends at a glance. Data-driven freelancing.' },
      { icon: LayoutDashboard, title: 'Unified Dashboard', desc: 'Everything in one view — active deals, follow-ups due, AI coaching tips, and performance metrics.' },
    ]}
    bullets={[
      'Visual job pipeline: track every opportunity from Saved → Applied → Won',
      'Automated follow-up reminders so you never miss a deal-closing moment',
      'Client management with full contact history and project context',
      'Per-platform analytics: see your win rate on Upwork, Fiverr, LinkedIn, and more',
      'AI agent that learns your patterns and coaches you to improve',
      'Free forever plan with all core features — no credit card required',
    ]}
    ctaHeading="Stop losing deals to disorganization."
    ctaSub="GetSoloDesk replaces your spreadsheets, sticky notes, and scattered inboxes with one powerful command center."
  />
);

export default FreelancerCrm;
