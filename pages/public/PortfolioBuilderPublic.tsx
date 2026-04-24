import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const PortfolioBuilderPublic: React.FC = () => (
  <PublicPageTemplate
    title="Free Portfolio Builder for Freelancers"
    description="Build a stunning freelance portfolio website in minutes. Choose from professional templates, customize colors and typography, and publish instantly — no coding required."
    path="/portfolio-builder"
    keywords={[
      'freelancer portfolio builder',
      'free portfolio website builder',
      'online portfolio for freelancers',
      'portfolio website templates',
      'freelance portfolio site',
      'personal brand portfolio builder',
    ]}
    heading="Portfolio Builder — Showcase Your Best Work"
    intro="Your portfolio is your resume. GetSoloDesk makes it dead simple to build a professional portfolio site that wins clients — no design skills or coding needed."
    bullets={[
      'Professional templates designed for developers, designers, writers, and creatives',
      'Full customization: colors, typography, layout, and content blocks',
      'Publish instantly at your unique URL with SSL and fast loading',
      'Mobile-responsive — looks perfect on every device',
      'Built-in analytics to track who views your work',
      'Connected to your CRM — add projects directly from completed jobs',
    ]}
  />
);

export default PortfolioBuilderPublic;
