import React from 'react';
import {
  Sparkles,
  Kanban,
  Bell,
  Clock,
  Bot,
  Briefcase,
  LinkIcon,
  BarChart3,
  FileText,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Features: React.FC = () => (
  <PublicPageTemplate
    title="All Features — Freelancer CRM, AI Proposals & More"
    description="Every tool a solo freelancer needs: AI proposal generator, job pipeline tracker, time tracking, portfolio builder, link-in-bio, analytics, and personalized AI coaching."
    path="/features"
    keywords={[
      'freelancer crm features', 'freelancer productivity tools',
      'freelance management software', 'proposal and time tracking software',
      'freelancer dashboard', 'freelance automation tools', 'all in one freelancer tool',
    ]}
    badge="Platform"
    badgeColor="from-indigo-400 to-violet-500"
    heading="Everything You Need to "
    headingAccent="Win"
    intro="GetSoloDesk replaces 5+ tools with one purpose-built platform. No bloat. No enterprise complexity. Just the features that help you find clients, close deals, and get paid."
    accentFrom="#6366f1"
    accentTo="#8b5cf6"
    stats={[
      { value: '6+', label: 'Core products' },
      { value: '36+', label: 'Proven templates' },
      { value: '$0', label: 'Free forever plan' },
      { value: '1', label: 'Platform, everything' },
    ]}
    features={[
      { icon: Sparkles, title: 'AI Proposal Generator', desc: 'Write winning proposals in seconds, not hours. AI learns from your wins and adapts to your style.' },
      { icon: Kanban, title: 'Job Pipeline', desc: 'Visual Kanban board to track every opportunity from lead to payment. Drag-and-drop simplicity.' },
      { icon: Bell, title: 'Automated Follow-Ups', desc: 'Never miss a deal-closing moment again. Smart reminders based on deal stage and contact timing.' },
      { icon: Clock, title: 'Time Tracking', desc: 'One-click timer connected to projects and invoicing. Track hours, calculate earnings, bill accurately.' },
      { icon: Bot, title: 'Personal AI Agent', desc: 'Learns from your wins and coaches you to improve. Your AI co-pilot for freelancing success.' },
      { icon: Briefcase, title: 'Portfolio Builder', desc: 'Publish a professional portfolio site with your best work. Templates, customization, instant publishing.' },
      { icon: LinkIcon, title: 'Link-in-Bio', desc: 'Share your brand, links, and CTAs in one conversion-focused page. Built for social traffic.' },
      { icon: BarChart3, title: 'Analytics Dashboard', desc: 'See win rates, earnings, platform performance, and growth trends at a glance.' },
      { icon: FileText, title: '36+ Proven Templates', desc: 'Proposals, outreach, follow-ups, and negotiations — battle-tested templates for every situation.' },
    ]}
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
    ctaHeading="One platform. Every tool you need."
    ctaSub="Stop paying for 5 different apps. GetSoloDesk has it all — and it's free."
  />
);

export default Features;
