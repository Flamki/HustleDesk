import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const TimeTracking: React.FC = () => (
  <PublicPageTemplate
    title="Time Tracking"
    description="Track billable time, earnings, and share reports with clients using GetSoloDesk."
    path="/time-tracking"
    keywords={[
      'time tracking for freelancers',
      'billable hours tracker',
      'client time reports',
      'freelance earnings tracker',
    ]}
    heading="Time Tracking and Earnings"
    intro="Capture billable sessions, monitor effective hourly rate, and share trusted reports."
    bullets={[
      'Time entries with durations and earnings',
      'Shareable report links for clients',
      'Summary analytics for productivity and revenue',
      'Optimized workflows for recurring client projects',
    ]}
  />
);

export default TimeTracking;

