import React from 'react';
import {
  Palette,
  Layout,
  Globe,
  Smartphone,
  BarChart3,
  Layers,
  Type,
  Image,
  Blocks,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const PortfolioBuilderPublic: React.FC = () => (
  <PublicPageTemplate
    title="Free Portfolio Builder for Freelancers"
    description="Build a stunning freelance portfolio website in minutes. Choose from professional templates, customize colors and typography, and publish instantly — no coding required."
    path="/portfolio-builder"
    keywords={[
      'freelancer portfolio builder', 'free portfolio website builder',
      'online portfolio for freelancers', 'portfolio website templates',
      'freelance portfolio site', 'personal brand portfolio builder',
    ]}
    badge="Portfolio"
    badgeColor="from-rose-400 to-pink-500"
    heading="Showcase Work That "
    headingAccent="Wins Clients"
    intro="Your portfolio is your resume. GetSoloDesk makes it dead simple to build a professional portfolio site that wins clients — no design skills or coding needed."
    accentFrom="#f43f5e"
    accentTo="#ec4899"
    stats={[
      { value: '5 min', label: 'To publish' },
      { value: 'SSL', label: 'Free security' },
      { value: '100%', label: 'Mobile responsive' },
      { value: '$0', label: 'No hosting fees' },
    ]}
    features={[
      { icon: Layout, title: 'Professional Templates', desc: 'Choose from templates designed for developers, designers, writers, and creatives. Every template is conversion-optimized.' },
      { icon: Palette, title: 'Full Customization', desc: 'Custom colors, typography, layout, and content blocks. Make it truly yours without touching code.' },
      { icon: Globe, title: 'Instant Publishing', desc: 'Publish at your unique URL with SSL and fast loading. Your portfolio is live in minutes, not days.' },
      { icon: Smartphone, title: 'Mobile Responsive', desc: 'Looks perfect on every device. Your portfolio adapts to phones, tablets, and desktops automatically.' },
      { icon: BarChart3, title: 'Built-In Analytics', desc: 'Track who views your work, which projects get the most attention, and where your traffic comes from.' },
      { icon: Layers, title: 'CRM Connected', desc: 'Add portfolio pieces directly from completed jobs in your CRM. No double entry needed.' },
      { icon: Type, title: 'Typography Controls', desc: 'Choose from premium fonts and adjust sizes, weights, and spacing to match your personal brand.' },
      { icon: Image, title: 'Rich Media Support', desc: 'Add images, videos, and embeds to your case studies. Tell the full story of every project.' },
      { icon: Blocks, title: 'Modular Sections', desc: 'Add, remove, and reorder sections like About, Skills, Projects, Testimonials, and Contact.' },
    ]}
    bullets={[
      'Professional templates designed for developers, designers, writers, and creatives',
      'Full customization: colors, typography, layout, and content blocks',
      'Publish instantly at your unique URL with SSL and fast loading',
      'Mobile-responsive — looks perfect on every device',
      'Built-in analytics to track who views your work',
      'Connected to your CRM — add projects directly from completed jobs',
    ]}
    ctaHeading="Your best work deserves a stage."
    ctaSub="Build a portfolio that turns visitors into clients in under 5 minutes."
  />
);

export default PortfolioBuilderPublic;
