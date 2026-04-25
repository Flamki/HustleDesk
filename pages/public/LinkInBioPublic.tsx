import React from 'react';
import {
  Link as LinkIconLucide,
  Palette,
  Smartphone,
  Users,
  BarChart3,
  MousePointer2,
  Instagram,
  Mail,
  Sparkles,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const LinkInBioPublic: React.FC = () => (
  <PublicPageTemplate
    title="Link-in-Bio Builder for Freelancers"
    description="Create a beautiful link-in-bio page to share on Instagram, Twitter, and LinkedIn. Custom branding, social links, lead capture — free for freelancers."
    path="/link-in-bio"
    keywords={[
      'link in bio builder', 'free link in bio tool', 'bio link page for freelancers',
      'linktree alternative for freelancers', 'social media landing page builder',
      'custom link in bio page',
    ]}
    badge="Link in Bio"
    badgeColor="from-sky-400 to-indigo-500"
    heading="One Link. "
    headingAccent="Infinite Reach."
    intro="One link to rule them all. Build a conversion-focused bio page that turns social followers into clients with custom branding and lead capture."
    accentFrom="#0ea5e9"
    accentTo="#6366f1"
    stats={[
      { value: '< 5 min', label: 'To launch' },
      { value: '100%', label: 'Mobile optimized' },
      { value: 'Free', label: 'Linktree alternative' },
      { value: 'Real-time', label: 'Click analytics' },
    ]}
    features={[
      { icon: Sparkles, title: 'Beautiful Templates', desc: 'Professionally designed templates with live preview. Choose a style that matches your personal brand and launch instantly.' },
      { icon: Palette, title: 'Custom Branding', desc: 'Custom colors, fonts, and social media links. Your bio page, your rules — fully branded to you.' },
      { icon: Smartphone, title: 'Mobile-First Design', desc: 'Optimized for Instagram, TikTok, and Twitter traffic. Thumb-friendly layout that converts mobile visitors.' },
      { icon: Mail, title: 'Lead Capture Forms', desc: 'Collect emails directly from your bio page. Build your list and turn followers into clients.' },
      { icon: BarChart3, title: 'Click Analytics', desc: 'See which links get the most engagement, where visitors come from, and what converts best.' },
      { icon: LinkIconLucide, title: 'Unlimited Links', desc: 'Add as many links as you need — portfolio, social profiles, booking page, latest project, whatever matters.' },
      { icon: Instagram, title: 'Social Integration', desc: 'Connect all your social profiles. Visitors can find you on every platform from one place.' },
      { icon: Users, title: 'CRM Connected', desc: 'Leads captured from your bio page flow directly into your CRM. No manual data entry needed.' },
      { icon: MousePointer2, title: 'Call-To-Action Buttons', desc: 'Add prominent CTAs like "Hire Me", "Book a Call", or "View Portfolio" that drive action.' },
    ]}
    bullets={[
      'Beautiful templates with live preview — launch in under 5 minutes',
      'Custom colors, fonts, and social media links',
      'Mobile-first design — optimized for Instagram, TikTok, and Twitter traffic',
      'Lead capture forms to collect emails directly from your bio page',
      'Click analytics — see which links get the most engagement',
      'Free Linktree alternative built specifically for freelancers',
    ]}
    ctaHeading="Your social bio deserves better than Linktree."
    ctaSub="Built for freelancers who want to convert followers into paying clients."
  />
);

export default LinkInBioPublic;
