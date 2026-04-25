import React from 'react';
import {
  Users,
  Link2,
  Eye,
  Shield,
  Smartphone,
  Zap,
  FileDown,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const ClientPortal: React.FC = () => (
  <PublicPageTemplate
    title="Client Portal for Freelancers"
    description="Share project progress, deliverables, and reports with clients through beautiful, branded portal pages. Build trust and look professional."
    path="/client-portal"
    keywords={[
      'client portal for freelancers', 'freelancer client dashboard',
      'share project progress with clients', 'freelance client communication tool',
      'client reporting for freelancers',
    ]}
    badge="Client Portal"
    badgeColor="from-amber-400 to-orange-500"
    heading="Client Updates They'll Actually "
    headingAccent="Love"
    intro="Stop sending messy email chains. Give each client a clean, branded portal where they can see project progress, download deliverables, and stay informed."
    accentFrom="#f59e0b"
    accentTo="#f97316"
    stats={[
      { value: '80%', label: 'Fewer "any update?" emails' },
      { value: '1-Click', label: 'Share with clients' },
      { value: 'CDN', label: 'Edge-served globally' },
      { value: '100%', label: 'Mobile responsive' },
    ]}
    features={[
      { icon: Users, title: 'Branded Share Pages', desc: 'Professional portal pages with your branding that make you look organized and trustworthy. First impressions matter.' },
      { icon: Link2, title: 'Secure Share Links', desc: 'Control exactly what each client can see. Generate links with custom expiration dates and revoke access anytime.' },
      { icon: Eye, title: 'Engagement Tracking', desc: 'See when clients view your updates, which sections they read, and how often they check in. Data-driven client management.' },
      { icon: Shield, title: 'Access Control', desc: 'Toggle what\'s visible per share link — show time entries with or without task descriptions. Full privacy control.' },
      { icon: Smartphone, title: 'Mobile-First Design', desc: 'Clients can check progress from their phone, tablet, or desktop. Responsive design that works everywhere.' },
      { icon: Zap, title: 'Lightning Fast', desc: 'Pages served from the edge via Vercel CDN. Sub-second load times anywhere in the world.' },
      { icon: FileDown, title: 'Downloadable Reports', desc: 'Clients can download summaries, time logs, and deliverables directly from their portal.' },
      { icon: MessageSquare, title: 'Reduce Back-and-Forth', desc: 'Real-time project status visibility means fewer status update meetings and email threads.' },
      { icon: BarChart3, title: 'Progress Visualization', desc: 'Visual timelines and progress bars that show clients exactly where their project stands.' },
    ]}
    bullets={[
      'Branded share pages that make you look professional and organized',
      'Secure links — control exactly what each client can see',
      'Real-time project status visibility reduces "any update?" messages',
      'Engagement tracking — see when clients view your updates',
      'Lightning-fast pages served from the edge (Vercel CDN)',
      'Works on mobile — clients can check progress from anywhere',
    ]}
    ctaHeading="Look professional. Build trust. Win repeat clients."
    ctaSub="Freelancers with client portals have 40% higher retention rates."
  />
);

export default ClientPortal;
