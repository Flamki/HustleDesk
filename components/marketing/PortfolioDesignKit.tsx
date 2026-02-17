import React from 'react';
import { Dribbble, Facebook, Github, Globe, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

export type PortfolioThemeId =
  | 'designer_canvas'
  | 'developer_casefiles'
  | 'writer_editorial'
  | 'photographer_grid'
  | 'consultant_trust'
  | 'agency_impact'
  | 'product_story'
  | 'architect_form'
  | 'marketer_funnel'
  | 'motion_neon';

export interface PortfolioPreviewProject { id: string; title: string; category?: string; client?: string; year?: string; description: string; outcome?: string; tags?: string[]; imageUrl?: string; url?: string; }
export interface PortfolioPreviewSkill { id: string; name: string; level: number; }
export interface PortfolioPreviewStat { id: string; label: string; value: string; }
export interface PortfolioPreviewService { id: string; title: string; description: string; tags?: string[]; }
export interface PortfolioPreviewExperience { id: string; role: string; company: string; period: string; location?: string; employmentType?: string; description?: string; achievements?: string[]; technologies?: string[]; }
export interface PortfolioPreviewEducation { id: string; degree: string; institution: string; period: string; details?: string; }
export interface PortfolioPreviewTestimonial { id: string; name: string; role: string; company?: string; quote: string; }

export interface PortfolioPreviewDraft {
  name: string;
  role: string;
  heroLabel?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  bio: string;
  location?: string;
  availability?: string;
  yearsExperience?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  heroImageUrl?: string;
  aboutTitle?: string;
  aboutBody?: string;
  stats?: PortfolioPreviewStat[];
  services?: PortfolioPreviewService[];
  skills?: PortfolioPreviewSkill[];
  projects: PortfolioPreviewProject[];
  experience?: PortfolioPreviewExperience[];
  education?: PortfolioPreviewEducation[];
  testimonials?: PortfolioPreviewTestimonial[];
  contactTitle?: string;
  contactDescription?: string;
  contactFormEnabled?: boolean;
  contactFormTitle?: string;
  contactFormSuccessMessage?: string;
  footerText?: string;
}

export interface PortfolioPreviewOverrides {
  palette?: { core?: string; primary?: string; secondary?: string; tertiary?: string; accent?: string };
  typography?: { heading?: string; text?: string; button?: string };
  socialLinks?: Array<{ label: string; url: string }>;
  links?: Array<{ label: string; url?: string }>;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLocation?: string;
}

const defaults: PortfolioPreviewDraft = {
  name: 'Alex Rivera',
  role: 'Creative Developer & Designer',
  heroLabel: 'Creative Developer & Designer',
  heroHeadline: 'Building Digital Experiences',
  heroSubheadline: 'I craft beautiful, functional, and user-centered digital experiences.',
  bio: 'Passionate about creating beautiful and functional digital experiences.',
  location: 'San Francisco, CA',
  yearsExperience: '8+',
  aboutTitle: 'Turning Vision Into Reality',
  aboutBody: 'I help businesses bring ideas to life with design and engineering excellence.',
  contactTitle: 'Ready to start your next project?',
  contactDescription: 'Share your project goals and timeline and I will get back quickly.',
  contactFormEnabled: true,
  contactFormTitle: 'Project inquiry',
  contactFormSuccessMessage: "Thanks for your message. I'll get back to you soon.",
  footerText: 'All rights reserved.',
  stats: [
    { id: 's1', label: 'Years Experience', value: '8+' },
    { id: 's2', label: 'Projects Completed', value: '150+' },
    { id: 's3', label: 'Happy Clients', value: '50+' },
    { id: 's4', label: 'Awards Won', value: '15' },
  ],
  services: [
    { id: 'v1', title: 'UI/UX Design', description: 'Creating intuitive and beautiful user interfaces.', tags: ['Figma', 'Research'] },
    { id: 'v2', title: 'Frontend Development', description: 'Building responsive and performant web apps.', tags: ['React', 'TypeScript'] },
    { id: 'v3', title: 'Backend Development', description: 'Designing scalable APIs and data models.', tags: ['Node.js', 'PostgreSQL'] },
  ],
  skills: [],
  projects: [
    { id: 'p1', title: 'E-Commerce Platform', category: 'Web Application', description: 'A full-stack e-commerce solution.', tags: ['React', 'Node.js'] },
    { id: 'p2', title: 'Fitness Tracking App', category: 'Mobile App', description: 'Cross-platform app with analytics.', tags: ['React Native', 'Firebase'] },
  ],
};

export const PORTFOLIO_THEME_PRESETS: Array<{ id: PortfolioThemeId; name: string; industry: string; description: string }> = [
  { id: 'designer_canvas', name: 'Alex Rivera - Creative Portfolio', industry: 'Creative', description: 'Exact creative portfolio template from library with editable content.' },
  { id: 'developer_casefiles', name: 'Kenji Takeda - Samurai Developer', industry: 'Technical', description: 'Ink-inspired technical portfolio with philosophy, mastery, works, and timeline sections.' },
  { id: 'writer_editorial', name: 'Luna Evergreen - Organic Studio', industry: 'Creative', description: 'Nature-inspired editorial layout with soft tones, organic sections, and calm visual rhythm.' },
  { id: 'motion_neon', name: 'Nova Chen - Neon Architect', industry: 'Technology', description: 'Cyberpunk neon template with glowing sections, grid visuals, and high-impact presentation.' },
  { id: 'consultant_trust', name: 'Arabella Saint-Claire - Digital Atelier', industry: 'Luxury', description: 'Elegant luxury layout with editorial typography, gold accents, and curated atelier presentation.' },
];

export type PortfolioPreviewViewport = 'desktop' | 'mobile' | 'tablet';
type Props = { themeId: PortfolioThemeId; draft?: Partial<PortfolioPreviewDraft>; overrides?: PortfolioPreviewOverrides; viewport?: PortfolioPreviewViewport };

type Prepared = {
  draft: PortfolioPreviewDraft;
  stats: PortfolioPreviewStat[];
  services: PortfolioPreviewService[];
  skills: PortfolioPreviewSkill[];
  projects: PortfolioPreviewProject[];
  experience: PortfolioPreviewExperience[];
  testimonials: PortfolioPreviewTestimonial[];
  socialLinks: Array<{ label: string; url: string }>;
  links: Array<{ label: string; url?: string }>;
};

const pickIcon = (label: string) => {
  const v = label.toLowerCase();
  if (v.includes('linkedin')) return Linkedin;
  if (v.includes('github')) return Github;
  if (v.includes('instagram')) return Instagram;
  if (v.includes('dribbble')) return Dribbble;
  if (v.includes('facebook')) return Facebook;
  if (v.includes('youtube')) return Youtube;
  if (v.includes('behance')) return Globe;
  return Twitter;
};

const prepare = (draft?: Partial<PortfolioPreviewDraft>, overrides?: PortfolioPreviewOverrides): Prepared => {
  const d: PortfolioPreviewDraft = { ...defaults, ...draft };
  return {
    draft: d,
    stats: d.stats && d.stats.length > 0 ? d.stats : defaults.stats || [],
    services: d.services && d.services.length > 0 ? d.services : defaults.services || [],
    skills: d.skills && d.skills.length > 0 ? d.skills : [],
    projects: d.projects && d.projects.length > 0 ? d.projects : defaults.projects,
    experience: d.experience || [],
    testimonials: d.testimonials || [],
    socialLinks: overrides?.socialLinks || [],
    links: (overrides?.links || []).filter((link) => String(link?.label || '').trim().length > 0),
  };
};

const handleInternalAnchorClick = (event: React.MouseEvent<HTMLElement>) => {
  const target = event.target as HTMLElement;
  const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
  if (!anchor) return;

  const href = anchor.getAttribute('href') || '';
  if (!href.startsWith('#')) return;

  event.stopPropagation();
  event.preventDefault();
  const id = href.slice(1);
  if (!id) return;

  const root =
    (anchor.closest('[data-portfolio-preview-root="true"]') as HTMLElement | null) ||
    (event.currentTarget as HTMLElement);
  const safeId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id;
  const section = root.querySelector<HTMLElement>(`#${safeId}`);
  if (section) {
    const previewScrollContainer = root.closest('[data-template-preview-scroll="true"]') as HTMLElement | null;
    if (previewScrollContainer) {
      const sectionRect = section.getBoundingClientRect();
      const containerRect = previewScrollContainer.getBoundingClientRect();
      const top = previewScrollContainer.scrollTop + (sectionRect.top - containerRect.top) - 16;
      previewScrollContainer.scrollTo({ top, behavior: 'smooth' });
      return;
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const MobileSectionNav: React.FC<{
  links: Array<{ href: string; label: string }>;
  borderColor: string;
  textColor: string;
  forceShow?: boolean;
}> = ({ links, borderColor, textColor, forceShow = false }) => (
  <div className={`${forceShow ? 'block' : 'md:hidden'} mt-3`}>
    <details className="relative">
      <summary
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-[11px] uppercase tracking-[0.14em] cursor-pointer select-none list-none"
        style={{ borderColor, color: textColor }}
      >
        Sections
      </summary>
      <div className="absolute left-0 top-full mt-2 min-w-[200px] z-20 rounded-xl border bg-white shadow-lg p-2" style={{ borderColor }}>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block px-3 py-2 rounded-lg text-xs uppercase tracking-[0.12em]"
            style={{ color: textColor }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </details>
  </div>
);

const ProfileMeta: React.FC<{ availability?: string; yearsExperience?: string }> = ({ availability, yearsExperience }) => {
  const items = [availability ? `Availability: ${availability}` : '', yearsExperience ? `Experience: ${yearsExperience}` : ''].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span key={`${item}-${idx}`} className="px-3 py-1 rounded-full text-xs border border-current/30">
          {item}
        </span>
      ))}
    </div>
  );
};
const CreativeTemplate: React.FC<{ data: Prepared; overrides?: PortfolioPreviewOverrides; forceMobile?: boolean }> = ({ data, overrides, forceMobile = false }) => {
  const d = data.draft;
  const palette = {
    primary: overrides?.palette?.primary || '#0a0a0a',
    secondary: overrides?.palette?.core || '#f5f5f0',
    accent: overrides?.palette?.accent || '#ff6b35',
    accentSecondary: overrides?.palette?.secondary || '#004e89',
    text: overrides?.palette?.tertiary || '#1a1a1a',
  };
  const headingFont = overrides?.typography?.heading || 'Playfair Display, Georgia, serif';
  const bodyFont = overrides?.typography?.text || 'Work Sans, Segoe UI, sans-serif';

  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      style={{ background: palette.secondary, color: palette.text, fontFamily: bodyFont }}
      data-portfolio-preview-root="true"
      onClickCapture={handleInternalAnchorClick}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Work+Sans:wght@300;400;500;600&display=swap');@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-20px) rotate(10deg)}}`}</style>
      <nav className="sticky top-0 z-10 px-4 sm:px-6 md:px-12 py-4 md:py-5" style={{ background: 'rgba(245,245,240,.95)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center justify-between">
        <div className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>{String(d.name || 'AR').split(' ').map((part) => part[0] || '').slice(0, 2).join('').toUpperCase()}</div>
        <ul className={`${forceMobile ? 'hidden' : 'hidden md:flex'} items-center gap-8 text-sm`}><li><a href="#home">Home</a></li><li><a href="#about">About</a></li><li><a href="#skills">Skills</a></li><li><a href="#projects">Projects</a></li><li><a href="#experience">Experience</a></li><li><a href="#contact">Contact</a></li></ul>
        </div>
        <MobileSectionNav links={[{ href: '#home', label: 'Home' }, { href: '#about', label: 'About' }, { href: '#skills', label: 'Skills' }, { href: '#projects', label: 'Projects' }, { href: '#contact', label: 'Contact' }]} borderColor={palette.primary} textColor={palette.primary} forceShow={forceMobile} />
      </nav>
      <section id="home" className="relative min-h-[85vh] px-4 sm:px-6 md:px-12 py-14 md:py-20 flex items-center overflow-hidden">
        <div className="absolute right-10 top-10 w-52 h-52 rounded-full opacity-10" style={{ background: palette.accent, animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute left-6 bottom-14 w-32 h-32 opacity-10 rounded-[30%_70%_70%_30%/30%_30%_70%_70%]" style={{ background: palette.accentSecondary, animation: 'float 6s ease-in-out infinite 2s' }} />
        <div className="relative z-10 max-w-5xl">
          <div className="uppercase tracking-[0.3em] text-xs md:text-sm font-semibold" style={{ color: palette.accent }}>{d.heroLabel}</div>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black leading-tight" style={{ fontFamily: headingFont }}>Hi, I'm {d.name}<span className="block" style={{ color: palette.accent }}>{d.heroHeadline}</span></h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-600">{d.heroSubheadline}</p>
          <ProfileMeta availability={d.availability} yearsExperience={d.yearsExperience} />
          <div className="mt-8 flex flex-wrap gap-3"><a href={overrides?.ctaUrl || '#projects'} className="px-6 py-3 rounded-full font-semibold text-white" style={{ background: palette.accent }}>{overrides?.ctaLabel || 'View My Work'}</a><a href={overrides?.secondaryCtaUrl || '#contact'} className="px-6 py-3 rounded-full font-semibold border-2" style={{ borderColor: palette.primary, color: palette.primary }}>{overrides?.secondaryCtaLabel || 'Get In Touch'}</a></div>
        </div>
      </section>
      <section className="px-6 md:px-12 py-14" style={{ background: palette.primary, color: palette.secondary }}><div className={`max-w-6xl mx-auto grid ${forceMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-6`}>{data.stats.map((s) => (<div key={s.id} className="text-center"><div className="text-4xl font-black" style={{ color: palette.accent, fontFamily: headingFont }}>{s.value}</div><div className="mt-1 text-xs uppercase tracking-[0.15em] opacity-80">{s.label}</div></div>))}</div></section>
      <section id="about" className="px-6 md:px-12 py-16 max-w-6xl mx-auto"><div className="uppercase tracking-[0.25em] text-xs font-semibold" style={{ color: palette.accent }}>About Me</div><h2 className="mt-2 text-3xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>{d.aboutTitle}</h2><div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8 items-center`}><p className="text-slate-600 leading-8 whitespace-pre-line">{d.aboutBody || d.bio}</p><div className="rounded-2xl overflow-hidden shadow-2xl h-80 bg-gradient-to-br from-indigo-400 to-purple-500">{d.heroImageUrl || d.profileImageUrl ? <img loading="lazy" decoding="async" src={d.heroImageUrl || d.profileImageUrl} alt={d.name} className="w-full h-full object-cover" /> : null}</div></div></section>
      <section id="skills" className="px-6 md:px-12 py-16 bg-gradient-to-br from-indigo-50 to-purple-50"><div className="max-w-6xl mx-auto"><div className="uppercase tracking-[0.25em] text-xs font-semibold" style={{ color: palette.accent }}>What I Do</div><h2 className="mt-2 text-3xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>My Expertise</h2><div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-5`}>{data.services.map((service) => (<div key={service.id} className="bg-white rounded-2xl p-6 shadow-lg"><h3 className="text-2xl font-bold" style={{ fontFamily: headingFont }}>{service.title}</h3><p className="mt-3 text-slate-600">{service.description}</p><div className="mt-4 flex flex-wrap gap-2">{(service.tags || []).map((tag, idx) => (<span key={`${service.id}-${idx}`} className="px-3 py-1 rounded-full text-xs bg-slate-100">{tag}</span>))}</div></div>))}</div>{data.skills.length > 0 ? <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>{data.skills.map((skill) => (<div key={skill.id} className="rounded-2xl bg-white p-4 shadow"><div className="flex items-center justify-between text-sm font-semibold"><span>{skill.name}</span><span>{skill.level}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, skill.level))}%`, background: palette.accent }} /></div></div>))}</div> : null}</div></section>
      <section id="projects" className="px-6 md:px-12 py-16 max-w-6xl mx-auto"><div className="uppercase tracking-[0.25em] text-xs font-semibold" style={{ color: palette.accent }}>Portfolio</div><h2 className="mt-2 text-3xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Featured Projects</h2><div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>{data.projects.map((p) => (<div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-lg"><div className="h-56 bg-gradient-to-br from-indigo-400 to-purple-500">{p.imageUrl ? <img loading="lazy" decoding="async" src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" /> : null}</div><div className="p-6"><div className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: palette.accent }}>{p.category || 'Project'}</div><h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: headingFont }}>{p.title}</h3><p className="mt-3 text-slate-600">{p.description}</p>{p.tags && p.tags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{p.tags.map((t, idx) => <span key={`${p.id}-${idx}`} className="px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-800">{t}</span>)}</div> : null}</div></div>))}</div></section>
      <section id="contact" className="px-6 md:px-12 py-16 max-w-6xl mx-auto"><div className="uppercase tracking-[0.25em] text-xs font-semibold" style={{ color: palette.accent }}>Get In Touch</div><h2 className="mt-2 text-3xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Let's Work Together</h2><div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8`}><div><h3 className="text-2xl font-bold" style={{ fontFamily: headingFont }}>{d.contactTitle}</h3><p className="mt-3 text-slate-600">{d.contactDescription}</p><div className="mt-4 space-y-2 text-slate-700">{(overrides?.contactEmail || d.email) ? <div>Email: {overrides?.contactEmail || d.email}</div> : null}{(overrides?.contactPhone || d.phone) ? <div>Phone: {overrides?.contactPhone || d.phone}</div> : null}{(overrides?.contactLocation || d.location) ? <div>Location: {overrides?.contactLocation || d.location}</div> : null}</div><div className="mt-4 flex gap-2">{(data.socialLinks.length > 0 ? data.socialLinks : [{ label: 'linkedin', url: '#' }, { label: 'github', url: '#' }]).map((s, idx) => { const Icon = pickIcon(s.label); return <a key={`${s.label}-${idx}`} href={s.url} className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Icon size={16} /></a>; })}</div>{data.links.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{data.links.map((link, idx) => <a key={`${link.label}-${idx}`} href={link.url || '#'} className="px-3 py-1.5 rounded-full border text-xs" style={{ borderColor: palette.primary }}>{link.label}</a>)}</div> : null}</div>{d.contactFormEnabled ? <div className="bg-white rounded-2xl p-6 shadow-lg"><div className="font-semibold mb-3">{d.contactFormTitle}</div><div className="space-y-2"><input className="w-full rounded-lg border px-3 py-2" placeholder="Your name" readOnly /><input className="w-full rounded-lg border px-3 py-2" placeholder="your.email@example.com" readOnly /><input className="w-full rounded-lg border px-3 py-2" placeholder="Project inquiry" readOnly /><textarea className="w-full rounded-lg border px-3 py-2 h-24" placeholder="Tell me about your project" readOnly /><button className="w-full rounded-lg py-2 font-semibold text-white" style={{ background: palette.accent }}>Send Message</button><p className="text-xs text-slate-500">{d.contactFormSuccessMessage}</p></div></div> : null}</div></section>
      <footer className="px-6 md:px-12 py-8 text-center text-white" style={{ background: palette.primary }}><p>© {new Date().getFullYear()} {d.name}. {d.footerText}</p></footer>
    </div>
  );
};
const SamuraiTemplate: React.FC<{ data: Prepared; overrides?: PortfolioPreviewOverrides; forceMobile?: boolean }> = ({ data, overrides, forceMobile = false }) => {
  const d = data.draft;
  const palette = {
    ink: overrides?.palette?.primary || '#0a0a0a',
    paper: overrides?.palette?.core || '#f8f7f0',
    mist: overrides?.palette?.secondary || '#d4d4d4',
    text: overrides?.palette?.tertiary || '#1a1a1a',
    accent: overrides?.palette?.accent || '#8b0000',
  };
  const headingFont = overrides?.typography?.heading || 'Noto Serif JP, serif';
  const bodyFont = overrides?.typography?.text || 'Cormorant Garamond, Georgia, serif';
  const contactEmail = overrides?.contactEmail || d.email;
  const contactPhone = overrides?.contactPhone || d.phone;
  const contactLocation = overrides?.contactLocation || d.location;

  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: palette.paper, color: palette.text, fontFamily: bodyFont }}
      data-portfolio-preview-root="true"
      onClickCapture={handleInternalAnchorClick}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;400;700;900&family=Cormorant+Garamond:wght@300;400;600;700&display=swap');`}</style>
      <header className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 md:pt-8"><div className="flex items-center justify-between gap-4"><div className="border-2 px-3 md:px-4 py-2 text-2xl md:text-3xl font-black" style={{ borderColor: palette.ink, fontFamily: headingFont }}>{String(d.name || 'KT').slice(0, 1).toUpperCase()}</div><nav className={`${forceMobile ? 'hidden' : 'hidden md:flex'} items-center gap-7 text-sm tracking-[0.2em]`}><a href="#home">HOME</a><a href="#philosophy">WAY</a><a href="#skills">SKILL</a><a href="#works">WORK</a><a href="#journey">PATH</a><a href="#contact">CONTACT</a></nav></div><MobileSectionNav links={[{ href: '#home', label: 'Home' }, { href: '#philosophy', label: 'Way' }, { href: '#skills', label: 'Skill' }, { href: '#works', label: 'Work' }, { href: '#journey', label: 'Path' }, { href: '#contact', label: 'Contact' }]} borderColor={palette.ink} textColor={palette.ink} forceShow={forceMobile} /></header>
      <section id="home" className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16 lg:py-24 grid ${forceMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-10 items-center`}><div><div className="text-xs sm:text-sm tracking-[0.28em] md:tracking-[0.35em] font-semibold" style={{ color: palette.accent }}>{d.heroLabel || d.role}</div><h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95]" style={{ fontFamily: headingFont }}>{d.name}</h1><div className="mt-4 text-xl md:text-3xl tracking-[0.14em] md:tracking-[0.2em] text-slate-700">{d.role}</div><p className="mt-6 text-base md:text-xl leading-8 md:leading-9 text-slate-700 max-w-2xl">{d.heroSubheadline || d.bio}</p><ProfileMeta availability={d.availability} yearsExperience={d.yearsExperience} /></div><div className="border-4 p-4 md:p-5 bg-white" style={{ borderColor: palette.ink, boxShadow: `8px 8px 0 ${palette.ink}` }}><div className="h-[320px] md:h-[420px] bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">{d.heroImageUrl || d.profileImageUrl ? <img loading="lazy" decoding="async" src={d.heroImageUrl || d.profileImageUrl} alt={d.name} className="w-full h-full object-cover opacity-85" /> : null}</div></div></section>
      <section id="philosophy" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16"><div className="text-sm tracking-[0.3em]" style={{ color: palette.accent }}>01 / PHILOSOPHY</div><h2 className="mt-2 text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>{d.aboutTitle || 'The Way'}</h2><p className="mt-4 text-xl text-slate-700 max-w-4xl whitespace-pre-line">{d.aboutBody || d.bio}</p><div className={`mt-10 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'} gap-5`}>{data.services.slice(0, 6).map((service) => (<article key={service.id} className="border-2 bg-white p-6" style={{ borderColor: palette.ink }}><div className="text-3xl font-black" style={{ color: palette.accent, fontFamily: headingFont }}>{(service.title || 'X').slice(0, 1).toUpperCase()}</div><h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: headingFont }}>{service.title}</h3><p className="mt-3 text-slate-700 leading-8">{service.description}</p></article>))}</div></section>
      <section id="skills" className="py-16" style={{ background: palette.ink, color: palette.paper }}><div className="max-w-[1400px] mx-auto px-6 lg:px-12"><div className="text-sm tracking-[0.3em] text-slate-300">02 / ARSENAL</div><h2 className="mt-2 text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Mastery</h2><div className={`mt-10 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-0 border-2`} style={{ borderColor: palette.paper }}>{(data.services.length > 0 ? data.services.slice(0, 4) : defaults.services || []).map((service) => (<div key={`samurai-skill-${service.id}`} className="p-8 border" style={{ borderColor: 'rgba(255,255,255,.4)' }}><h3 className="text-3xl font-bold" style={{ fontFamily: headingFont }}>{service.title}</h3><ul className="mt-4 space-y-2 text-slate-300">{(service.tags || []).map((tag, idx) => <li key={`${service.id}-${idx}`}>- {tag}</li>)}</ul></div>))}</div>{data.skills.length > 0 ? <div className={`mt-6 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>{data.skills.map((skill) => (<div key={skill.id} className="border p-4" style={{ borderColor: 'rgba(255,255,255,.4)' }}><div className="flex justify-between text-sm"><span>{skill.name}</span><span>{skill.level}%</span></div><div className="mt-2 h-2 bg-white/20 rounded-full"><div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, skill.level))}%`, background: palette.accent }} /></div></div>))}</div> : null}</div></section>
      <section id="works" className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16"><div className="text-sm tracking-[0.3em]" style={{ color: palette.accent }}>03 / WORKS</div><h2 className="mt-2 text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Masterworks</h2><div className={`mt-10 grid ${forceMobile ? 'grid-cols-1' : 'xl:grid-cols-2'} gap-6`}>{data.projects.map((project, idx) => (<article key={project.id} className="border-2 bg-white overflow-hidden" style={{ borderColor: palette.ink }}><div className="h-64 md:h-80 bg-gradient-to-br from-slate-700 to-slate-900 relative">{project.imageUrl ? <img loading="lazy" decoding="async" src={project.imageUrl} alt={project.title} className="w-full h-full object-cover opacity-85" /> : null}<div className="absolute left-5 top-4 text-6xl font-black text-white/20" style={{ fontFamily: headingFont }}>{String(idx + 1).padStart(2, '0')}</div></div><div className="p-7"><div className="text-xs tracking-[0.18em] uppercase" style={{ color: palette.accent }}>{project.category || 'Case Study'}</div><h3 className="mt-2 text-3xl font-black" style={{ fontFamily: headingFont }}>{project.title}</h3><p className="mt-3 text-slate-700 leading-8">{project.description}</p></div></article>))}</div></section>
      {data.experience.length > 0 ? <section id="journey" className="py-16" style={{ background: palette.ink, color: palette.paper }}><div className="max-w-[1200px] mx-auto px-6 lg:px-12"><div className="text-sm tracking-[0.3em] text-slate-300">04 / JOURNEY</div><h2 className="mt-2 text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Path</h2><div className="mt-10 space-y-6">{data.experience.map((item) => (<article key={item.id} className="border-2 p-6" style={{ borderColor: palette.paper }}><div className="text-4xl font-black" style={{ color: palette.accent, fontFamily: headingFont }}>{item.period}</div><h3 className="mt-2 text-3xl font-bold" style={{ fontFamily: headingFont }}>{item.role}</h3><div className="text-xl" style={{ color: palette.accent }}>{item.company}</div></article>))}</div></div></section> : null}
      <section id="contact" className="py-16" style={{ background: palette.ink, color: palette.paper }}><div className="max-w-[1000px] mx-auto px-6 lg:px-12"><div className="text-sm tracking-[0.3em] text-slate-300">06 / CONTACT</div><h2 className="mt-2 text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>{d.contactTitle || 'Begin Your Journey'}</h2><div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-4`}>{contactEmail ? <div className="border p-5" style={{ borderColor: palette.paper }}>Email<br />{contactEmail}</div> : null}{contactPhone ? <div className="border p-5" style={{ borderColor: palette.paper }}>Phone<br />{contactPhone}</div> : null}{contactLocation ? <div className="border p-5" style={{ borderColor: palette.paper }}>Location<br />{contactLocation}</div> : null}</div><div className="mt-6 flex gap-2">{(data.socialLinks.length > 0 ? data.socialLinks : [{ label: 'linkedin', url: '#' }, { label: 'github', url: '#' }]).map((s, idx) => { const Icon = pickIcon(s.label); return <a key={`${s.label}-${idx}`} href={s.url} className="w-10 h-10 rounded-md border flex items-center justify-center" style={{ borderColor: palette.paper }}><Icon size={16} /></a>; })}</div>{data.links.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{data.links.map((link, idx) => <a key={`${link.label}-${idx}`} href={link.url || '#'} className="px-3 py-1.5 rounded border text-xs" style={{ borderColor: palette.paper }}>{link.label}</a>)}</div> : null}</div></section>
      <footer className="px-6 lg:px-12 py-8 text-center" style={{ background: palette.ink, color: palette.mist, borderTop: `2px solid ${palette.paper}` }}><p>© {new Date().getFullYear()} {d.name}. {d.footerText}</p></footer>
    </div>
  );
};

export const PortfolioDesignPreview: React.FC<Props> = ({ themeId, draft, overrides, viewport = 'desktop' }) => {
  const data = prepare(draft, overrides);
  const forceMobile = viewport === 'mobile';
  if (themeId === 'writer_editorial') {
    const d = data.draft;
    const organic = {
      sage: overrides?.palette?.secondary || '#8a9a7f',
      moss: overrides?.palette?.primary || '#3e5436',
      cream: overrides?.palette?.core || '#faf8f3',
      earth: overrides?.palette?.tertiary || '#8b7355',
      accent: overrides?.palette?.accent || '#d4845c',
      sand: '#e8dcc8',
    };
    const headingFont = overrides?.typography?.heading || 'Josefin Sans, sans-serif';
    const bodyFont = overrides?.typography?.text || 'Lora, Georgia, serif';

    return (
      <div
        className="w-full overflow-hidden"
        style={{ background: organic.cream, color: organic.moss, fontFamily: bodyFont }}
        data-portfolio-preview-root="true"
        onClickCapture={handleInternalAnchorClick}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');`}</style>

        <nav className="sticky top-0 z-10 px-4 sm:px-6 md:px-10 py-4 md:py-5 border-b" style={{ background: 'rgba(250,248,243,.95)', borderColor: organic.sand }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-2xl font-light tracking-[0.14em]" style={{ fontFamily: headingFont }}>
              {(d.name || 'Luna Evergreen').toLowerCase()}
            </div>
            <div className={`${forceMobile ? 'hidden' : 'hidden md:flex'} gap-6 text-sm uppercase tracking-[0.12em]`}>
              <a href="#home">Home</a><a href="#values">Values</a><a href="#services">Services</a><a href="#portfolio">Portfolio</a><a href="#journey">Journey</a><a href="#contact">Contact</a>
            </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <MobileSectionNav links={[{ href: '#home', label: 'Home' }, { href: '#values', label: 'Values' }, { href: '#services', label: 'Services' }, { href: '#portfolio', label: 'Portfolio' }, { href: '#journey', label: 'Journey' }, { href: '#contact', label: 'Contact' }]} borderColor={organic.moss} textColor={organic.moss} forceShow={forceMobile} />
          </div>
        </nav>

        <section id="home" className={`px-4 sm:px-6 md:px-10 py-12 md:py-24 max-w-7xl mx-auto grid ${forceMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-8 items-center`}>
          <div>
            <div className="text-sm tracking-[0.2em] uppercase" style={{ color: organic.sage }}>{d.heroLabel || 'hello, I am'}</div>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl font-light leading-tight" style={{ fontFamily: headingFont }}>
              {d.name}
              <span className="block italic" style={{ color: organic.accent }}>{d.role}</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-8 max-w-2xl" style={{ color: organic.earth }}>{d.heroSubheadline || d.bio}</p>
            <ProfileMeta availability={d.availability} yearsExperience={d.yearsExperience} />
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={overrides?.ctaUrl || '#portfolio'} className="px-6 py-3 rounded-full border-2 text-sm tracking-[0.12em] uppercase" style={{ background: organic.sage, borderColor: organic.sage, color: organic.cream }}>{overrides?.ctaLabel || 'View Work'}</a>
              <a href={overrides?.secondaryCtaUrl || '#contact'} className="px-6 py-3 rounded-full border-2 text-sm tracking-[0.12em] uppercase" style={{ borderColor: organic.moss }}>{overrides?.secondaryCtaLabel || "Let's Connect"}</a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[34%_66%_45%_55%/55%_45%_55%_45%]" style={{ background: `linear-gradient(135deg, ${organic.sage}, ${organic.accent})` }}>
              {(d.heroImageUrl || d.profileImageUrl) ? <img loading="lazy" decoding="async" src={d.heroImageUrl || d.profileImageUrl} alt={d.name} className="w-full h-full object-cover rounded-[34%_66%_45%_55%/55%_45%_55%_45%] opacity-80" /> : null}
            </div>
          </div>
        </section>

        <section id="values" className="px-6 md:px-10 py-16" style={{ background: organic.sand }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-light" style={{ fontFamily: headingFont }}>{d.aboutTitle || 'Core Values'}</h2>
            <p className="mt-3 max-w-3xl italic" style={{ color: organic.earth }}>{d.aboutBody || d.bio}</p>
            <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-5`}>
              {(data.services.slice(0, 3).length > 0 ? data.services.slice(0, 3) : []).map((item, idx) => (
                <article key={item.id} className="bg-white rounded-3xl p-6 border" style={{ borderColor: organic.sand }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: organic.sage, color: organic.cream }}>
                    {['??', '??', '??'][idx % 3]}
                  </div>
                  <h3 className="mt-3 text-2xl font-normal" style={{ fontFamily: headingFont }}>{item.title}</h3>
                  <p className="mt-2" style={{ color: organic.earth }}>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light" style={{ fontFamily: headingFont }}>Services</h2>
          <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
            {data.services.map((service, idx) => (
              <article key={service.id} className="rounded-3xl p-6 border-2 bg-white" style={{ borderColor: organic.sand }}>
                <div className="text-4xl opacity-30" style={{ color: organic.sage, fontFamily: headingFont }}>{String(idx + 1).padStart(2, '0')}</div>
                <h3 className="mt-2 text-2xl font-normal" style={{ fontFamily: headingFont }}>{service.title}</h3>
                <p className="mt-2" style={{ color: organic.earth }}>{service.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">{(service.tags || []).map((tag, i) => <span key={`${service.id}-${i}`} className="px-3 py-1 rounded-full text-xs" style={{ background: organic.sand }}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="px-6 md:px-10 py-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-light" style={{ fontFamily: headingFont }}>Portfolio</h2>
            <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
              {data.projects.map((p) => (
                <article key={p.id} className="rounded-3xl overflow-hidden">
                  <div className="h-56" style={{ background: `linear-gradient(135deg, ${organic.sage}, ${organic.accent})` }}>
                    {p.imageUrl ? <img loading="lazy" decoding="async" src={p.imageUrl} alt={p.title} className="w-full h-full object-cover opacity-85" /> : null}
                  </div>
                  <div className="p-5 bg-white border border-t-0" style={{ borderColor: organic.sand }}>
                    <div className="text-xs uppercase tracking-[0.15em]" style={{ color: organic.sage }}>{p.category || 'Project'}</div>
                    <h3 className="mt-1 text-2xl font-normal" style={{ fontFamily: headingFont }}>{p.title}</h3>
                    <p className="mt-2" style={{ color: organic.earth }}>{p.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {data.experience.length > 0 ? (
          <section id="journey" className="px-6 md:px-10 py-16" style={{ background: organic.sand }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-light" style={{ fontFamily: headingFont }}>Journey</h2>
              <div className="mt-8 space-y-5">
                {data.experience.map((e) => (
                  <article key={e.id} className={`grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-[120px_1fr]'} gap-4`}>
                    <div className="w-20 h-20 rounded-full grid place-items-center text-sm font-semibold" style={{ background: organic.sage, color: organic.cream }}>{e.period}</div>
                    <div className="bg-white rounded-3xl p-5">
                      <h3 className="text-2xl font-normal" style={{ fontFamily: headingFont }}>{e.role}</h3>
                      <div style={{ color: organic.sage }}>{e.company}</div>
                      {e.description ? <p className="mt-2" style={{ color: organic.earth }}>{e.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="contact" className="px-6 md:px-10 py-16" style={{ background: organic.sand }}>
          <div className={`max-w-7xl mx-auto grid ${forceMobile ? 'grid-cols-1' : 'lg:grid-cols-[1fr_1.3fr]'} gap-8`}>
            <div>
              <h2 className="text-4xl font-light" style={{ fontFamily: headingFont }}>{d.contactTitle || "Let's Grow Together"}</h2>
              <p className="mt-3 italic" style={{ color: organic.earth }}>{d.contactDescription}</p>
              <div className="mt-5 space-y-2">
                {(overrides?.contactEmail || d.email) ? <div>Email: {overrides?.contactEmail || d.email}</div> : null}
                {(overrides?.contactPhone || d.phone) ? <div>Phone: {overrides?.contactPhone || d.phone}</div> : null}
                {(overrides?.contactLocation || d.location) ? <div>Location: {overrides?.contactLocation || d.location}</div> : null}
              </div>
              {data.links.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{data.links.map((link, idx) => <a key={`${link.label}-${idx}`} href={link.url || '#'} className="px-3 py-1.5 rounded-full text-xs border" style={{ borderColor: organic.moss }}>{link.label}</a>)}</div> : null}
            </div>
            {d.contactFormEnabled ? (
              <div className="bg-white rounded-3xl p-6">
                <input className="w-full mb-2 rounded-full px-4 py-2 border" style={{ borderColor: organic.sand, background: organic.sand }} placeholder="Your name" readOnly />
                <input className="w-full mb-2 rounded-full px-4 py-2 border" style={{ borderColor: organic.sand, background: organic.sand }} placeholder="Email address" readOnly />
                <textarea className="w-full rounded-2xl px-4 py-3 border h-24" style={{ borderColor: organic.sand, background: organic.sand }} placeholder="Project details" readOnly />
                <button className="mt-3 w-full rounded-full py-2 font-semibold uppercase text-xs tracking-[0.12em]" style={{ background: organic.sage, color: organic.cream }}>Send Message</button>
                <p className="mt-2 text-xs" style={{ color: organic.earth }}>{d.contactFormSuccessMessage}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    );
  }
  if (themeId === 'consultant_trust') {
    const d = data.draft;
    const lux = {
      gold: overrides?.palette?.accent || '#d4af37',
      dark: overrides?.palette?.primary || '#0f1419',
      cream: overrides?.palette?.core || '#faf8f3',
      text: overrides?.palette?.tertiary || '#2a2e35',
      emerald: overrides?.palette?.secondary || '#2d5f5d',
    };
    const headingFont = overrides?.typography?.heading || 'Bodoni Moda, Georgia, serif';
    const bodyFont = overrides?.typography?.text || 'Montserrat, Segoe UI, sans-serif';

    return (
      <div
        className="w-full overflow-hidden"
        style={{ background: lux.cream, color: lux.text, fontFamily: bodyFont }}
        data-portfolio-preview-root="true"
        onClickCapture={handleInternalAnchorClick}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;600;700;900&family=Montserrat:wght@300;400;500;600;700&display=swap');`}</style>

        <nav className="sticky top-0 z-10 px-4 sm:px-6 md:px-10 py-4 md:py-5 border-b" style={{ borderColor: `${lux.gold}55`, background: 'rgba(250,248,243,.95)', backdropFilter: 'blur(14px)' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-3xl font-black tracking-[0.14em]" style={{ fontFamily: headingFont }}>
              {String(d.name || 'ASC').split(' ').map((part) => (part[0] || '')).slice(0, 3).join('').toUpperCase()}
            </div>
            <div className={`${forceMobile ? 'hidden' : 'hidden md:flex'} gap-7 text-xs uppercase tracking-[0.2em]`}>
              <a href="#home">Home</a><a href="#philosophy">Philosophy</a><a href="#services">Services</a><a href="#portfolio">Portfolio</a><a href="#experience">Experience</a><a href="#contact">Contact</a>
            </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <MobileSectionNav links={[{ href: '#home', label: 'Home' }, { href: '#philosophy', label: 'Philosophy' }, { href: '#services', label: 'Services' }, { href: '#portfolio', label: 'Portfolio' }, { href: '#experience', label: 'Experience' }, { href: '#contact', label: 'Contact' }]} borderColor={lux.gold} textColor={lux.dark} forceShow={forceMobile} />
          </div>
        </nav>

        <section id="home" className={`px-4 sm:px-6 md:px-10 py-12 md:py-24 max-w-7xl mx-auto grid ${forceMobile ? 'grid-cols-1' : 'lg:grid-cols-[1.2fr_1fr]'} gap-8 items-center`}>
          <div>
            <div className="text-xs uppercase tracking-[0.35em] font-semibold" style={{ color: lux.gold }}>{d.heroLabel || d.role}</div>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl font-black leading-[1.04]" style={{ fontFamily: headingFont }}>
              {String(d.name || '').split(' ')[0] || d.name}
              <span className="block italic" style={{ color: lux.gold }}>{d.heroHeadline || String(d.name || '').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-8 max-w-2xl">{d.heroSubheadline || d.bio}</p>
            <ProfileMeta availability={d.availability} yearsExperience={d.yearsExperience} />
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={overrides?.ctaUrl || '#portfolio'} className="px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold border-2" style={{ background: lux.gold, color: lux.dark, borderColor: lux.gold }}>{overrides?.ctaLabel || 'View Portfolio'}</a>
              <a href={overrides?.secondaryCtaUrl || '#contact'} className="px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold border-2" style={{ borderColor: lux.dark, color: lux.dark }}>{overrides?.secondaryCtaLabel || 'Collaborate'}</a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[3/4] bg-gradient-to-br from-slate-700 to-slate-900 p-5">
              <div className="w-full h-full border-2 relative overflow-hidden" style={{ borderColor: lux.gold }}>
                {d.heroImageUrl || d.profileImageUrl ? <img loading="lazy" decoding="async" src={d.heroImageUrl || d.profileImageUrl} alt={d.name} className="w-full h-full object-cover opacity-85" /> : null}
              </div>
            </div>
            <div className={`${forceMobile ? 'hidden' : 'absolute -bottom-8 -right-2'} text-8xl md:text-[11rem] font-black opacity-10`} style={{ fontFamily: headingFont, color: lux.gold }}>{(d.name || 'A')[0]}</div>
          </div>
        </section>

        <section id="philosophy" className="px-6 md:px-10 py-16" style={{ background: lux.dark, color: lux.cream }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Philosophy</h2>
            <p className="mt-3 max-w-3xl opacity-80 leading-8">{d.aboutBody || d.bio}</p>
            <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-5`}>
              {(data.services.slice(0, 3).length > 0 ? data.services.slice(0, 3) : [{ id: 'p1', title: 'Elegance', description: 'Timeless form with precise execution.' }, { id: 'p2', title: 'Excellence', description: 'Uncompromising quality, every detail refined.' }, { id: 'p3', title: 'Evolution', description: 'Innovation guided by lasting principles.' }]).map((item, idx) => (
                <article key={item.id} className="p-6 border" style={{ borderColor: `${lux.gold}50`, background: 'rgba(250,248,243,.04)' }}>
                  <div className="text-5xl font-black opacity-30" style={{ fontFamily: headingFont, color: lux.gold }}>{String(idx + 1).padStart(2, '0')}</div>
                  <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: headingFont }}>{item.title}</h3>
                  <p className="mt-2 opacity-80">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Services</h2>
          <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
            {data.services.map((service, idx) => (
              <article key={service.id} className="p-6 border bg-white" style={{ borderColor: `${lux.gold}66` }}>
                <div className="text-5xl font-black opacity-25" style={{ color: lux.gold, fontFamily: headingFont }}>{String(idx + 1).padStart(2, '0')}</div>
                <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: headingFont }}>{service.title}</h3>
                <p className="mt-3 leading-8">{service.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">{(service.tags || []).map((tag, i) => <span key={`${service.id}-${i}`} className="px-2.5 py-1 border text-xs uppercase tracking-wider" style={{ borderColor: lux.gold, color: lux.gold }}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
          {data.skills.length > 0 ? <div className={`mt-6 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>{data.skills.map((skill) => <div key={skill.id} className="p-4 border bg-white" style={{ borderColor: `${lux.gold}66` }}><div className="flex justify-between text-sm"><span>{skill.name}</span><span>{skill.level}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, skill.level))}%`, background: lux.gold }} /></div></div>)}</div> : null}
        </section>

        <section id="portfolio" className="px-6 md:px-10 py-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Selected Works</h2>
            <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
              {data.projects.map((p, idx) => (
                <article key={p.id} className="overflow-hidden group">
                  <div className="h-64 relative" style={{ background: `linear-gradient(135deg, ${lux.emerald}, ${lux.dark})` }}>
                    {p.imageUrl ? <img loading="lazy" decoding="async" src={p.imageUrl} alt={p.title} className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" /> : null}
                  </div>
                  <div className="p-5 border border-t-0" style={{ borderColor: `${lux.gold}66` }}>
                    <div className="text-xs uppercase tracking-[0.16em]" style={{ color: lux.gold }}>{p.category || `Work ${idx + 1}`}</div>
                    <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: headingFont }}>{p.title}</h3>
                    <p className="mt-2">{p.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {data.experience.length > 0 ? (
          <section id="experience" className="px-6 md:px-10 py-16" style={{ background: '#f7e7ce' }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Experience</h2>
              <div className="mt-8 space-y-5">
                {data.experience.map((e) => (
                  <article key={e.id} className={`grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-[180px_1fr]'} gap-4`}>
                    <div className="text-4xl font-black" style={{ fontFamily: headingFont, color: lux.gold }}>{e.period}</div>
                    <div className="border-l-2 pl-4" style={{ borderColor: `${lux.gold}80` }}>
                      <h3 className="text-2xl font-bold" style={{ fontFamily: headingFont }}>{e.role}</h3>
                      <div className="font-semibold" style={{ color: lux.gold }}>{e.company}</div>
                      {e.description ? <p className="mt-2">{e.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {data.testimonials.length > 0 ? (
          <section className="px-6 md:px-10 py-16 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: headingFont }}>Testimonials</h2>
              <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                {data.testimonials.map((t) => (
                  <article key={t.id} className="p-6 bg-[#faf8f3] border-l-4" style={{ borderColor: lux.gold }}>
                    <p className="italic leading-8">"{t.quote}"</p>
                    <div className="mt-4 font-bold" style={{ fontFamily: headingFont }}>{t.name}</div>
                    <div className="text-sm opacity-80">{t.role}{t.company ? `, ${t.company}` : ''}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="contact" className="px-6 md:px-10 py-16" style={{ background: lux.dark, color: lux.cream }}>
          <div className={`max-w-7xl mx-auto grid ${forceMobile ? 'grid-cols-1' : 'lg:grid-cols-[1fr_1.5fr]'} gap-8`}>
            <div>
              <h2 className="text-4xl font-black" style={{ fontFamily: headingFont }}>{d.contactTitle || 'Let’s Collaborate'}</h2>
              <p className="mt-3 opacity-80">{d.contactDescription}</p>
              <div className="mt-5 space-y-2">
                {(overrides?.contactEmail || d.email) ? <div>Email: {overrides?.contactEmail || d.email}</div> : null}
                {(overrides?.contactPhone || d.phone) ? <div>Phone: {overrides?.contactPhone || d.phone}</div> : null}
                {(overrides?.contactLocation || d.location) ? <div>Studio: {overrides?.contactLocation || d.location}</div> : null}
              </div>
              {data.links.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{data.links.map((link, idx) => <a key={`${link.label}-${idx}`} href={link.url || '#'} className="px-3 py-1.5 border text-xs uppercase tracking-[0.12em]" style={{ borderColor: lux.gold }}>{link.label}</a>)}</div> : null}
            </div>
            {d.contactFormEnabled ? (
              <div className="p-6 border" style={{ borderColor: `${lux.gold}66`, background: 'rgba(250,248,243,.05)' }}>
                <div className={`grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-2 mb-2`}>
                  <input className="w-full border px-3 py-2 bg-transparent" style={{ borderColor: `${lux.gold}66` }} placeholder="First Name" readOnly />
                  <input className="w-full border px-3 py-2 bg-transparent" style={{ borderColor: `${lux.gold}66` }} placeholder="Last Name" readOnly />
                </div>
                <input className="w-full border px-3 py-2 mb-2 bg-transparent" style={{ borderColor: `${lux.gold}66` }} placeholder="Email Address" readOnly />
                <input className="w-full border px-3 py-2 mb-2 bg-transparent" style={{ borderColor: `${lux.gold}66` }} placeholder="Subject" readOnly />
                <textarea className="w-full border px-3 py-2 h-24 bg-transparent" style={{ borderColor: `${lux.gold}66` }} placeholder="Message" readOnly />
                <button className="mt-3 w-full py-2 border-2 text-xs uppercase tracking-[0.2em] font-semibold" style={{ background: lux.gold, color: lux.dark, borderColor: lux.gold }}>Send Inquiry</button>
                <p className="mt-2 text-xs opacity-75">{d.contactFormSuccessMessage}</p>
              </div>
            ) : null}
          </div>
        </section>

        <footer className="px-6 py-8 text-center" style={{ background: '#2a2e35', color: '#f7e7ce' }}>
          <div className="text-3xl font-black" style={{ fontFamily: headingFont, color: lux.gold }}>
            {String(d.name || 'ASC').split(' ').map((part) => (part[0] || '')).slice(0, 3).join('').toUpperCase()}
          </div>
          <p className="mt-2 text-sm opacity-70">© {new Date().getFullYear()} {d.name}. {d.footerText}</p>
        </footer>
      </div>
    );
  }
  if (themeId === 'motion_neon') {
    const d = data.draft;
    const neon = {
      dark: overrides?.palette?.primary || '#0a0e27',
      darker: '#050813',
      pink: overrides?.palette?.accent || '#ff006e',
      blue: overrides?.palette?.secondary || '#00f0ff',
      purple: '#b967ff',
      green: '#05ffa1',
      text: overrides?.palette?.tertiary || '#8ef2ff',
    };
    const headingFont = overrides?.typography?.heading || 'Orbitron, sans-serif';
    const bodyFont = overrides?.typography?.text || 'Rajdhani, Segoe UI, sans-serif';

    return (
      <div
        className="w-full overflow-hidden"
        style={{ background: neon.dark, color: neon.text, fontFamily: bodyFont }}
        data-portfolio-preview-root="true"
        onClickCapture={handleInternalAnchorClick}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');@keyframes neonPulse{0%,100%{opacity:.45}50%{opacity:.9}}`}</style>
        <div className="relative min-h-screen">
          <div className="absolute inset-0 pointer-events-none opacity-25" style={{ backgroundImage: `linear-gradient(rgba(0,240,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,.14) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
          <div className="absolute right-[-120px] top-10 w-72 h-72 rounded-full blur-3xl" style={{ background: neon.pink, animation: 'neonPulse 5s ease-in-out infinite' }} />
          <div className="absolute left-[-100px] bottom-10 w-72 h-72 rounded-full blur-3xl" style={{ background: neon.blue, animation: 'neonPulse 5s ease-in-out infinite 1.5s' }} />

          <nav className="relative z-10 px-4 sm:px-6 md:px-10 py-4 md:py-6 border-b" style={{ borderColor: `${neon.blue}80`, background: 'rgba(10,14,39,.8)', backdropFilter: 'blur(8px)' }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-2xl font-black tracking-[0.2em]" style={{ fontFamily: headingFont, color: neon.pink }}>{(d.name || 'NOVA').split(' ')[0].toUpperCase()}</div>
              <div className={`${forceMobile ? 'hidden' : 'hidden md:flex'} gap-7 text-sm uppercase tracking-[0.18em]`}>
                <a href="#home">Home</a><a href="#services">Services</a><a href="#projects">Projects</a><a href="#experience">Experience</a><a href="#contact">Contact</a>
              </div>
            </div>
            <div className="max-w-7xl mx-auto">
              <MobileSectionNav links={[{ href: '#home', label: 'Home' }, { href: '#services', label: 'Services' }, { href: '#projects', label: 'Projects' }, { href: '#experience', label: 'Experience' }, { href: '#contact', label: 'Contact' }]} borderColor={neon.blue} textColor={neon.blue} forceShow={forceMobile} />
            </div>
          </nav>

          <section id="home" className="relative z-10 px-4 sm:px-6 md:px-10 py-12 md:py-24 max-w-7xl mx-auto">
            <div className="text-sm uppercase tracking-[0.35em]" style={{ color: neon.green }}>{d.heroLabel || d.role}</div>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95]" style={{ fontFamily: headingFont, background: `linear-gradient(45deg, ${neon.pink}, ${neon.blue}, ${neon.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {d.name}
            </h1>
            <div className="mt-3 text-xl sm:text-2xl md:text-4xl font-bold" style={{ color: neon.blue }}>{d.heroHeadline || d.role}</div>
            <p className="mt-5 max-w-3xl text-base sm:text-lg md:text-xl leading-8" style={{ color: `${neon.blue}cc` }}>{d.heroSubheadline || d.bio}</p>
            <ProfileMeta availability={d.availability} yearsExperience={d.yearsExperience} />
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={overrides?.ctaUrl || '#projects'} className="px-6 py-3 border-2 uppercase tracking-[0.16em] font-semibold" style={{ borderColor: neon.pink, color: neon.pink }}>{overrides?.ctaLabel || 'View Projects'}</a>
              <a href={overrides?.secondaryCtaUrl || '#contact'} className="px-6 py-3 border-2 uppercase tracking-[0.16em] font-semibold" style={{ borderColor: neon.blue, color: neon.blue }}>{overrides?.secondaryCtaLabel || 'Get In Touch'}</a>
            </div>
          </section>

          <section className="relative z-10 px-6 md:px-10 py-10" style={{ background: `linear-gradient(90deg, ${neon.pink}, ${neon.purple}, ${neon.blue})`, color: neon.darker }}>
            <div className={`max-w-7xl mx-auto grid ${forceMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-5`}>
              {data.stats.map((s) => <div key={s.id} className="text-center"><div className="text-4xl font-black" style={{ fontFamily: headingFont }}>{s.value}</div><div className="text-xs uppercase tracking-[0.14em] font-bold">{s.label}</div></div>)}
            </div>
          </section>

          <section id="services" className="relative z-10 px-6 md:px-10 py-16 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black uppercase" style={{ fontFamily: headingFont, color: neon.blue }}>Services</h2>
            <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'} gap-5`}>
              {data.services.map((service, idx) => (
                <article key={service.id} className="border-2 p-6" style={{ borderColor: neon.blue, background: 'rgba(10,14,39,.65)' }}>
                  <div className="text-3xl">{['??', '?', '??', '??', '??', '??'][idx % 6]}</div>
                  <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: headingFont, color: neon.blue }}>{service.title}</h3>
                  <p className="mt-3" style={{ color: `${neon.blue}cc` }}>{service.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{(service.tags || []).map((t, i) => <span key={`${service.id}-${i}`} className="px-2.5 py-1 border text-xs uppercase tracking-wider" style={{ borderColor: neon.pink, color: neon.pink }}>{t}</span>)}</div>
                </article>
              ))}
            </div>
            {data.skills.length > 0 ? <div className={`mt-6 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>{data.skills.map((skill) => <div key={skill.id} className="border-2 p-4" style={{ borderColor: neon.blue, background: 'rgba(10,14,39,.65)' }}><div className="flex justify-between text-sm"><span>{skill.name}</span><span>{skill.level}%</span></div><div className="mt-2 h-2 rounded-full bg-white/20"><div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, skill.level))}%`, background: neon.pink }} /></div></div>)}</div> : null}
          </section>

          <section id="projects" className="relative z-10 px-6 md:px-10 py-16" style={{ background: neon.darker }}>
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black uppercase" style={{ fontFamily: headingFont, color: neon.blue }}>Featured Projects</h2>
              <div className={`mt-8 grid ${forceMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                {data.projects.map((p, i) => (
                  <article key={p.id} className="border-2 overflow-hidden" style={{ borderColor: neon.purple, background: 'rgba(10,14,39,.85)' }}>
                    <div className="h-56 relative" style={{ background: `linear-gradient(135deg, ${neon.pink}, ${neon.purple}, ${neon.blue})` }}>
                      {p.imageUrl ? <img loading="lazy" decoding="async" src={p.imageUrl} alt={p.title} className="w-full h-full object-cover mix-blend-overlay opacity-70" /> : null}
                      <div className="absolute top-4 left-4 text-5xl font-black text-white/20" style={{ fontFamily: headingFont }}>{String(i + 1).padStart(2, '0')}</div>
                    </div>
                    <div className="p-6">
                      <div className="text-xs uppercase tracking-[0.16em]" style={{ color: neon.green }}>{p.category || 'Project'}</div>
                      <h3 className="mt-2 text-3xl font-black" style={{ fontFamily: headingFont, color: neon.blue }}>{p.title}</h3>
                      <p className="mt-3" style={{ color: `${neon.blue}cc` }}>{p.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">{(p.tags || []).map((t, idx) => <span key={`${p.id}-${idx}`} className="px-2.5 py-1 border text-xs uppercase tracking-wider" style={{ borderColor: neon.pink, color: neon.pink }}>{t}</span>)}</div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {data.experience.length > 0 ? (
            <section id="experience" className="relative z-10 px-6 md:px-10 py-16 max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black uppercase" style={{ fontFamily: headingFont, color: neon.blue }}>Experience</h2>
              <div className="mt-8 space-y-5">
                {data.experience.map((e) => (
                  <article key={e.id} className="border-2 p-5" style={{ borderColor: neon.blue, background: 'rgba(10,14,39,.65)' }}>
                    <div className="text-2xl md:text-3xl font-black" style={{ fontFamily: headingFont, color: neon.pink }}>{e.period}</div>
                    <h3 className="mt-1 text-2xl font-bold" style={{ color: neon.blue }}>{e.role}</h3>
                    <div className="font-semibold" style={{ color: neon.pink }}>{e.company}</div>
                    {e.description ? <p className="mt-2" style={{ color: `${neon.blue}cc` }}>{e.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section id="contact" className="relative z-10 px-6 md:px-10 py-16" style={{ background: neon.darker }}>
            <div className={`max-w-6xl mx-auto grid ${forceMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-8`}>
              <div>
                <h2 className="text-4xl font-black uppercase" style={{ fontFamily: headingFont, color: neon.pink }}>{d.contactTitle || 'Contact'}</h2>
                <p className="mt-3 text-lg" style={{ color: `${neon.blue}cc` }}>{d.contactDescription}</p>
                <div className="mt-5 space-y-2">
                  {(overrides?.contactEmail || d.email) ? <div>Email: {overrides?.contactEmail || d.email}</div> : null}
                  {(overrides?.contactPhone || d.phone) ? <div>Phone: {overrides?.contactPhone || d.phone}</div> : null}
                  {(overrides?.contactLocation || d.location) ? <div>Location: {overrides?.contactLocation || d.location}</div> : null}
                </div>
                {data.links.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{data.links.map((link, idx) => <a key={`${link.label}-${idx}`} href={link.url || '#'} className="px-3 py-1.5 border text-xs uppercase tracking-[0.12em]" style={{ borderColor: neon.blue, color: neon.blue }}>{link.label}</a>)}</div> : null}
              </div>
              {d.contactFormEnabled ? (
                <div className="border-2 p-6" style={{ borderColor: neon.blue, background: 'rgba(10,14,39,.65)' }}>
                  <div className="font-bold mb-3 uppercase tracking-[0.14em]" style={{ fontFamily: headingFont }}>{d.contactFormTitle || 'Send Message'}</div>
                  <div className="space-y-2">
                    <input className="w-full border px-3 py-2 bg-transparent" style={{ borderColor: neon.blue }} placeholder="Your name" readOnly />
                    <input className="w-full border px-3 py-2 bg-transparent" style={{ borderColor: neon.blue }} placeholder="your.email@example.com" readOnly />
                    <input className="w-full border px-3 py-2 bg-transparent" style={{ borderColor: neon.blue }} placeholder="Project inquiry" readOnly />
                    <textarea className="w-full border px-3 py-2 h-24 bg-transparent" style={{ borderColor: neon.blue }} placeholder="Tell me about your project..." readOnly />
                    <button className="w-full py-2 font-semibold uppercase tracking-[0.14em]" style={{ background: neon.pink, color: neon.dark }}>Send Message</button>
                    <p className="text-xs" style={{ color: `${neon.blue}99` }}>{d.contactFormSuccessMessage}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <footer className="relative z-10 px-6 py-8 text-center border-t" style={{ borderColor: `${neon.blue}80`, background: neon.darker }}>
            <div className="text-2xl font-black tracking-[0.2em]" style={{ fontFamily: headingFont, color: neon.pink }}>{(d.name || 'NOVA').split(' ')[0].toUpperCase()}</div>
            <p className="mt-2 text-sm" style={{ color: `${neon.blue}99` }}>© {new Date().getFullYear()} {d.name}. {d.footerText}</p>
          </footer>
        </div>
      </div>
    );
  }
  if (themeId === 'developer_casefiles') return <SamuraiTemplate data={data} overrides={overrides} forceMobile={forceMobile} />;
  return <CreativeTemplate data={data} overrides={overrides} forceMobile={forceMobile} />;
};


