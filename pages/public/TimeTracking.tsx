import React from 'react';
import {
  Clock,
  Play,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Pause,
  Calendar,
  Layers,
  Share2,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const TimeTracking: React.FC = () => (
  <PublicPageTemplate
    title="Free Time Tracking for Freelancers"
    description="Track billable hours effortlessly with GetSoloDesk's built-in time tracker. One-click timer, project-based tracking, and automatic rate calculations."
    path="/time-tracking"
    keywords={[
      'time tracking for freelancers', 'free time tracker', 'freelance time tracking app',
      'billable hours tracker', 'freelance hour tracker',
      'time tracking software for freelancers', 'project time tracking',
    ]}
    badge="Time Tracker"
    badgeColor="from-blue-400 to-cyan-500"
    heading="Time Tracking Built for "
    headingAccent="Freelancers"
    intro="Stop losing money to untracked hours. GetSoloDesk's time tracker is built into your CRM so every minute connects to a client, project, and invoice."
    accentFrom="#3b82f6"
    accentTo="#06b6d4"
    stats={[
      { value: '1-Click', label: 'Start tracking' },
      { value: '100%', label: 'Accurate billing' },
      { value: '$0', label: 'Free forever' },
      { value: 'Real-time', label: 'Earnings display' },
    ]}
    features={[
      { icon: Play, title: 'One-Click Timer', desc: 'Start tracking instantly from any job or project. No setup, no configuration — just click and go.' },
      { icon: DollarSign, title: 'Automatic Rate Calculations', desc: 'Set your hourly rate and watch earnings calculate in real-time as you work. Multi-currency support included.' },
      { icon: Layers, title: 'Project-Based Entries', desc: 'Organize time by client, project, and task. Add notes and categorize for detailed reporting.' },
      { icon: FileSpreadsheet, title: 'Invoicing Summaries', desc: 'Weekly and monthly summaries formatted for invoicing. Export or connect directly to your billing flow.' },
      { icon: PieChart, title: 'Visual Breakdowns', desc: 'See exactly where your time goes with pie charts and bar graphs. Identify your most profitable work.' },
      { icon: Clock, title: 'Built Into Your CRM', desc: 'No separate app or tab switching. Time tracking lives right next to your jobs, clients, and proposals.' },
      { icon: Pause, title: 'Pause & Resume', desc: 'Take breaks without losing accuracy. Pause the timer and resume when you\'re back. Session integrity guaranteed.' },
      { icon: Calendar, title: 'Manual Entry', desc: 'Forgot to start the timer? No problem. Add time entries manually with date, duration, and project details.' },
      { icon: Share2, title: 'Shareable Sessions', desc: 'Create share links for completed sessions. Send proof-of-work to clients with one click.' },
    ]}
    bullets={[
      'One-click timer — start tracking instantly from any job or project',
      'Automatic rate calculations based on your hourly or project pricing',
      'Project-based time entries with notes and categorization',
      'Weekly and monthly summaries for invoicing and tax reporting',
      'See exactly where your time goes with visual breakdowns',
      'Built into your CRM — no separate app or tab switching needed',
    ]}
    ctaHeading="Every minute counts. Start tracking them."
    ctaSub="Freelancers who track time bill 20% more. Don't leave money on the table."
  />
);

export default TimeTracking;
