import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const PortfolioBuilderPublic: React.FC = () => (
  <PublicPageTemplate
    title="Portfolio Builder"
    description="Build and publish your portfolio site with customizable templates, typography, and palettes."
    heading="Portfolio Builder"
    intro="Launch a branded portfolio quickly with templates designed for different creator styles."
    bullets={[
      'Template library with full preview',
      'Custom palette and typography controls',
      'Editable content blocks and links',
      'Publish to /w/:slug with analytics tracking',
    ]}
  />
);

export default PortfolioBuilderPublic;
