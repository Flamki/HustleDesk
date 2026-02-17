export type PortfolioBuilderStep = 'template' | 'palette' | 'typography' | 'content' | 'socials' | 'review';

export type TemplateCategory = 'all' | 'creative' | 'professional' | 'technical' | 'modern' | 'academic';

export type PortfolioTemplateId =
  | 'creative_bold'
  | 'minimal_pro'
  | 'tech_developer'
  | 'artistic_visual'
  | 'modern_gradient'
  | 'classic_elegant'
  | 'vibrant_creative'
  | 'academic_research';

export type PaletteId =
  | 'monochrome'
  | 'ocean_blue'
  | 'forest_green'
  | 'warm_earth'
  | 'royal_elegance'
  | 'sunset_warm'
  | 'modern_dark'
  | 'soft_pastel'
  | 'industrial_grey'
  | 'crimson_bold'
  | 'custom';

export type TypographyId = 'modern_sans' | 'elegant_serif' | 'tech_mono' | 'creative_mix' | 'bold_display' | 'professional_classic';

export interface TemplateMeta {
  id: PortfolioTemplateId;
  name: string;
  category: Exclude<TemplateCategory, 'all'>;
  description: string;
  previewImage: string;
}

export interface PaletteMeta {
  id: PaletteId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface TypographyMeta {
  id: TypographyId;
  name: string;
  heading: string;
  body: string;
  button: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  tags: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  client: string;
  year: string;
  outcome: string;
  link: string;
  description: string;
  imageUrl: string;
  tags: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  employmentType: string;
  description: string;
  achievements: string;
  technologies: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  period: string;
  details: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
}

export interface PortfolioContent {
  fullName: string;
  professionalTitle: string;
  heroLabel: string;
  heroHeadline: string;
  heroSubheadline: string;
  bio: string;
  aboutTitle: string;
  aboutBody: string;
  availability: string;
  yearsExperience: string;
  email: string;
  phone: string;
  location: string;
  profileImageUrl: string;
  heroImageUrl: string;
  stats: StatItem[];
  services: ServiceItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  testimonials: TestimonialItem[];
  contactTitle: string;
  contactDescription: string;
  contactFormTitle: string;
  contactFormEnabled: boolean;
  contactFormSuccessMessage: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  footerText: string;
}

export interface PortfolioSocials {
  github: string;
  linkedin: string;
  twitter: string;
  dribbble: string;
  behance: string;
  instagram: string;
  facebook: string;
  youtube: string;
}

export interface PortfolioLinkItem {
  id: string;
  label: string;
  url: string;
}

export interface PortfolioBuilderState {
  templateId: PortfolioTemplateId;
  category: TemplateCategory;
  paletteId: PaletteId;
  palette: PaletteMeta;
  typographyId: TypographyId;
  typography: TypographyMeta;
  content: PortfolioContent;
  socials: PortfolioSocials;
  links: PortfolioLinkItem[];
}
