import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const LinkInBioPublic: React.FC = () => (
  <PublicPageTemplate
    title="Link in Bio Builder"
    description="Create high-converting link-in-bio pages with templates, social links, and custom branding."
    path="/link-in-bio"
    heading="Link in Bio Builder"
    intro="Build a conversion-focused bio page for social audiences with full customization."
    bullets={[
      'Template selection with live previews',
      'Custom colors, fonts, and social links',
      'Mobile-first public rendering',
      'Lead capture and analytics events',
    ]}
  />
);

export default LinkInBioPublic;
