import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const LinkInBioPublic: React.FC = () => (
  <PublicPageTemplate
    title="Link-in-Bio Builder for Freelancers"
    description="Create a beautiful link-in-bio page to share on Instagram, Twitter, and LinkedIn. Custom branding, social links, lead capture — free for freelancers."
    path="/link-in-bio"
    keywords={[
      'link in bio builder',
      'free link in bio tool',
      'bio link page for freelancers',
      'linktree alternative for freelancers',
      'social media landing page builder',
      'custom link in bio page',
    ]}
    heading="Link-in-Bio — Your Social Hub"
    intro="One link to rule them all. Build a conversion-focused bio page that turns social followers into clients with custom branding and lead capture."
    bullets={[
      'Beautiful templates with live preview — launch in under 5 minutes',
      'Custom colors, fonts, and social media links',
      'Mobile-first design — optimized for Instagram, TikTok, and Twitter traffic',
      'Lead capture forms to collect emails directly from your bio page',
      'Click analytics — see which links get the most engagement',
      'Free Linktree alternative built specifically for freelancers',
    ]}
  />
);

export default LinkInBioPublic;
