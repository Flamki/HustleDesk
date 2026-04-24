import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const TimeTracking: React.FC = () => (
  <PublicPageTemplate
    title="Free Time Tracking for Freelancers"
    description="Track billable hours effortlessly with GetSoloDesk's built-in time tracker. One-click timer, project-based tracking, and automatic rate calculations."
    path="/time-tracking"
    keywords={[
      'time tracking for freelancers',
      'free time tracker',
      'freelance time tracking app',
      'billable hours tracker',
      'freelance hour tracker',
      'time tracking software for freelancers',
      'project time tracking',
    ]}
    heading="Time Tracking Built for Freelancers"
    intro="Stop losing money to untracked hours. GetSoloDesk's time tracker is built into your CRM so every minute connects to a client, project, and invoice."
    bullets={[
      'One-click timer — start tracking instantly from any job or project',
      'Automatic rate calculations based on your hourly or project pricing',
      'Project-based time entries with notes and categorization',
      'Weekly and monthly summaries for invoicing and tax reporting',
      'See exactly where your time goes with visual breakdowns',
      'Built into your CRM — no separate app or tab switching needed',
    ]}
  />
);

export default TimeTracking;
