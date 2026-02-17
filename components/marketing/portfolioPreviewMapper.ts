import type { PortfolioBuilderState } from '../builder/builderTypes';
import type { PortfolioPreviewDraft, PortfolioPreviewOverrides } from './PortfolioDesignKit';

const parseList = (value: unknown, splitter = ',') =>
  String(value ?? '')
    .split(splitter)
    .map((v) => v.trim())
    .filter(Boolean);

const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

export const mapBuilderStateToPreview = (
  state: PortfolioBuilderState
): { draft: Partial<PortfolioPreviewDraft>; overrides: PortfolioPreviewOverrides } => {
  const c = state.content;
  const socialLinks = Object.entries(state.socials)
    .map(([label, url]) => ({ label, url: String(url || '').trim() }))
    .filter((row) => row.url.length > 0);

  return {
    draft: {
      name: c.fullName,
      role: c.professionalTitle,
      heroLabel: c.heroLabel,
      heroHeadline: c.heroHeadline,
      heroSubheadline: c.heroSubheadline,
      bio: c.bio,
      location: c.location,
      availability: c.availability,
      yearsExperience: c.yearsExperience,
      email: c.email,
      phone: c.phone,
      profileImageUrl: c.profileImageUrl,
      heroImageUrl: c.heroImageUrl,
      aboutTitle: c.aboutTitle,
      aboutBody: c.aboutBody,
      stats: c.stats,
      services: c.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        tags: parseList(s.tags),
      })),
      skills: c.skills,
      projects: c.projects.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        client: p.client,
        year: p.year,
        description: p.description,
        outcome: p.outcome,
        tags: parseList(p.tags),
        imageUrl: p.imageUrl,
        url: p.link,
      })),
      experience: c.experience.map((e) => ({
        id: e.id,
        role: e.role,
        company: e.company,
        period: e.period,
        location: e.location,
        employmentType: e.employmentType,
        description: e.description,
        achievements: parseList(e.achievements, '|'),
        technologies: parseList(e.technologies),
      })),
      education: c.education,
      testimonials: c.testimonials,
      contactTitle: c.contactTitle,
      contactDescription: c.contactDescription,
      contactFormEnabled: c.contactFormEnabled,
      contactFormTitle: c.contactFormTitle,
      contactFormSuccessMessage: c.contactFormSuccessMessage,
      footerText: c.footerText,
    },
    overrides: {
      palette: {
        core: state.palette.background,
        primary: state.palette.primary,
        secondary: state.palette.secondary,
        tertiary: state.palette.text,
        accent: state.palette.accent,
      },
      typography: {
        heading: state.typography.heading,
        text: state.typography.body,
        button: state.typography.button,
      },
      socialLinks,
      links: state.links,
      ctaLabel: c.primaryCtaLabel,
      ctaUrl: c.primaryCtaUrl,
      secondaryCtaLabel: c.secondaryCtaLabel,
      secondaryCtaUrl: c.secondaryCtaUrl,
      contactEmail: c.email,
      contactPhone: c.phone,
      contactLocation: c.location,
    },
  };
};

type PublicSite = {
  name?: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  primary_color?: string;
  accent_color?: string;
  config?: unknown;
};

type PublicPortfolioItem = {
  id: string;
  title?: string;
  description?: string;
  url?: string | null;
  tags?: string[];
};

export const mapPublicSiteToPreview = (
  site: PublicSite,
  portfolioItems: PublicPortfolioItem[]
): { draft: Partial<PortfolioPreviewDraft>; overrides: PortfolioPreviewOverrides } => {
  const cfg = asObject(site.config);
  const nested = asObject(cfg.content);
  const content = Object.keys(nested).length > 0 ? nested : cfg;
  const palette = asObject(cfg.palette);
  const typography = asObject(cfg.typography);
  const socials = asObject(cfg.socials);
  const links = Array.isArray(cfg.links) ? cfg.links : [];

  const socialLinks = Object.entries(socials)
    .map(([label, url]) => ({ label, url: String(url || '').trim() }))
    .filter((s) => s.url.length > 0);

  const projectsFromConfig = Array.isArray(content.projects)
    ? content.projects
        .map((p: any, idx: number) => ({
          id: String(p?.id || `project-${idx + 1}`),
          title: String(p?.title || `Project ${idx + 1}`),
          category: String(p?.category || ''),
          client: String(p?.client || ''),
          year: String(p?.year || ''),
          description: String(p?.description || ''),
          outcome: String(p?.outcome || ''),
          tags: parseList(p?.tags),
          imageUrl: String(p?.imageUrl || ''),
          url: String(p?.link || p?.url || '#'),
        }))
        .filter((p: { title: string }) => p.title.length > 0)
    : null;

  const projectsFromTable = (portfolioItems || []).slice(0, 8).map((p) => ({
    id: p.id,
    title: String(p.title || 'Project'),
    category: '',
    client: '',
    year: '',
    description: String(p.description || ''),
    outcome: '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    imageUrl: '',
    url: String(p.url || '#'),
  }));

  const mappedLinks = links
    .map((row: any, idx: number) => ({
      label: String(row?.label || `Link ${idx + 1}`),
      url: String(row?.url || '').trim() || '#',
    }))
    .filter((row: { label: string }) => row.label.length > 0);

  return {
    draft: {
      name: String(content.fullName || site.name || 'Your Name'),
      role: String(content.professionalTitle || site.headline || 'Freelance Professional'),
      heroLabel: String(content.heroLabel || 'Portfolio'),
      heroHeadline: String(content.heroHeadline || site.headline || 'Building digital experiences'),
      heroSubheadline: String(content.heroSubheadline || site.subheadline || 'Results-focused strategy, design, and delivery.'),
      bio: String(content.bio || site.subheadline || 'I build high-quality work with measurable outcomes for ambitious clients.'),
      location: String(content.location || ''),
      availability: String(content.availability || ''),
      yearsExperience: String(content.yearsExperience || ''),
      email: String(content.email || ''),
      phone: String(content.phone || ''),
      profileImageUrl: String(content.profileImageUrl || ''),
      heroImageUrl: String(content.heroImageUrl || ''),
      aboutTitle: String(content.aboutTitle || 'About'),
      aboutBody: String(content.aboutBody || content.bio || site.subheadline || ''),
      projects: projectsFromConfig ?? projectsFromTable,
      skills: Array.isArray(content.skills)
        ? content.skills.map((s: any, idx: number) => ({
            id: String(s?.id || `skill-${idx + 1}`),
            name: String(s?.name || ''),
            level: Number(s?.level || 0),
          }))
        : [],
      stats: Array.isArray(content.stats)
        ? content.stats.map((s: any, idx: number) => ({
            id: String(s?.id || `stat-${idx + 1}`),
            label: String(s?.label || ''),
            value: String(s?.value || ''),
          }))
        : [],
      services: Array.isArray(content.services)
        ? content.services.map((s: any, idx: number) => ({
            id: String(s?.id || `service-${idx + 1}`),
            title: String(s?.title || ''),
            description: String(s?.description || ''),
            tags: parseList(s?.tags),
          }))
        : [],
      experience: Array.isArray(content.experience)
        ? content.experience.map((e: any, idx: number) => ({
            id: String(e?.id || `exp-${idx + 1}`),
            role: String(e?.role || ''),
            company: String(e?.company || ''),
            period: String(e?.period || ''),
            location: String(e?.location || ''),
            employmentType: String(e?.employmentType || ''),
            description: String(e?.description || ''),
            achievements: parseList(e?.achievements, '|'),
            technologies: parseList(e?.technologies),
          }))
        : [],
      education: Array.isArray(content.education)
        ? content.education.map((e: any, idx: number) => ({
            id: String(e?.id || `edu-${idx + 1}`),
            degree: String(e?.degree || ''),
            institution: String(e?.institution || ''),
            period: String(e?.period || ''),
            details: String(e?.details || ''),
          }))
        : [],
      testimonials: Array.isArray(content.testimonials)
        ? content.testimonials.map((t: any, idx: number) => ({
            id: String(t?.id || `test-${idx + 1}`),
            name: String(t?.name || ''),
            role: String(t?.role || ''),
            company: String(t?.company || ''),
            quote: String(t?.quote || ''),
          }))
        : [],
      contactTitle: String(content.contactTitle || 'Get in touch'),
      contactDescription: String(content.contactDescription || 'Ready to discuss your project?'),
      contactFormEnabled: Boolean(content.contactFormEnabled ?? true),
      contactFormTitle: String(content.contactFormTitle || 'Send a message'),
      contactFormSuccessMessage: String(content.contactFormSuccessMessage || "Thanks for your message. I'll get back to you soon."),
      footerText: String(content.footerText || 'All rights reserved.'),
    },
    overrides: {
      palette: {
        core: String(palette.core || ''),
        primary: String(palette.primary || site.primary_color || ''),
        secondary: String(palette.secondary || ''),
        tertiary: String(palette.tertiary || ''),
        accent: String(palette.accent || site.accent_color || ''),
      },
      typography: {
        heading: String(typography.heading || ''),
        text: String(typography.text || ''),
        button: String(typography.button || ''),
      },
      socialLinks,
      links: mappedLinks,
      ctaLabel: String(content.primaryCtaLabel || site.cta_text || 'Hire me'),
      ctaUrl: String(content.primaryCtaUrl || '#projects'),
      secondaryCtaLabel: String(content.secondaryCtaLabel || 'Contact'),
      secondaryCtaUrl: String(content.secondaryCtaUrl || '#contact'),
      contactEmail: String(content.email || ''),
      contactPhone: String(content.phone || ''),
      contactLocation: String(content.location || ''),
    },
  };
};
