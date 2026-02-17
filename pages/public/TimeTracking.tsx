import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const TimeTracking: React.FC = () => (
  <PublicPageTemplate
    title="Time Tracking"
    description="Track billable time, earnings, and share reports with clients using HustleDesk."
    heading="Time Tracking and Earnings"
    intro="Capture billable sessions, monitor effective hourly rate, and share trusted reports."
    bullets={[
      'Time entries with durations and earnings',
      'Shareable report links for clients',
      'Summary analytics for productivity and revenue',
      'Optimized workflows for recurring work',
    ]}
  />
);

export default TimeTracking;
