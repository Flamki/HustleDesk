import React from 'react';
import { Facebook, Instagram, Link2, Linkedin, Music2, Twitch, Youtube } from 'lucide-react';

export type LinkBioThemeId =
  | 'mono_classic'
  | 'mint_pop'
  | 'noir_card'
  | 'sunset_glow'
  | 'starlight_grid'
  | 'tokyo_red'
  | 'sky_frost'
  | 'paper_minimal'
  | 'deep_space'
  | 'rose_mono';

export interface LinkBioLink {
  id: string;
  label: string;
  url: string;
}

export interface LinkBioDraft {
  name: string;
  handle?: string;
  tagline?: string;
  location?: string;
  avatarUrl?: string;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  emailPlaceholder?: string;
  ctaLabel?: string;
  links: LinkBioLink[];
}

export interface LinkBioOverrides {
  palette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    surface?: string;
  };
  typography?: {
    heading?: string;
    text?: string;
    button?: string;
  };
  socialLinks?: Array<{ label: string; url: string }>;
}

const defaultDraft: LinkBioDraft = {
  name: 'Your Name',
  handle: '@username',
  tagline: 'A short one-line intro about your work and audience.',
  location: 'Remote',
  emailPlaceholder: 'Email',
  ctaLabel: 'Subscribe',
  links: [
    { id: 'l1', label: 'Newsletter', url: '#' },
    { id: 'l2', label: 'Upgrade', url: '#' },
    { id: 'l3', label: 'Archive', url: '#' },
    { id: 'l4', label: 'Recommendations', url: '#' },
  ],
};

const themeMap: Record<
  LinkBioThemeId,
  {
    shell: string;
    card: string;
    title: string;
    subtitle: string;
    social: string;
    link: string;
    linkHover: string;
    input: string;
    cta: string;
    border?: string;
  }
> = {
  mono_classic: {
    shell: 'bg-[#d5d5d8]',
    card: 'bg-transparent',
    title: 'text-[#0b0f19]',
    subtitle: 'text-[#2f3442]',
    social: 'text-[#0f172a]',
    link: 'bg-[#114ad1] text-white',
    linkHover: 'hover:bg-[#0f43bc]',
    input: 'bg-white text-slate-900 border-[#7ba0f6]',
    cta: 'bg-[#114ad1] text-white',
  },
  mint_pop: {
    shell: 'bg-[#a8d3a8]',
    card: 'bg-transparent',
    title: 'text-[#0b0f19]',
    subtitle: 'text-[#1f2937]',
    social: 'text-[#0f172a]',
    link: 'bg-[#a6dea6] text-[#0b0f19] border-2 border-black shadow-[4px_4px_0_0_#000]',
    linkHover: 'hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]',
    input: 'bg-[#d8d8da] text-slate-900 border-black',
    cta: 'bg-[#a8ec9d] text-[#0b0f19] border-2 border-black',
  },
  noir_card: {
    shell: 'bg-[#02050d]',
    card: 'bg-black/40 border border-white/10',
    title: 'text-white',
    subtitle: 'text-white/70',
    social: 'text-white/90',
    link: 'bg-black text-white border border-white/20',
    linkHover: 'hover:bg-white/10',
    input: 'bg-white text-slate-900 border-white/20',
    cta: 'bg-black text-white border-2 border-white/60',
  },
  sunset_glow: {
    shell: 'bg-[radial-gradient(circle_at_50%_70%,rgba(250,157,66,0.75),rgba(170,192,214,0.95)_55%)]',
    card: 'bg-transparent',
    title: 'text-[#f8f7f2] drop-shadow-[0_2px_1px_rgba(0,0,0,0.15)]',
    subtitle: 'text-[#f4eee5]',
    social: 'text-[#f8f7f2]',
    link: 'bg-white/90 text-[#0b0f19] shadow-[0_3px_0_0_rgba(0,0,0,0.12)]',
    linkHover: 'hover:bg-white',
    input: 'bg-white/90 text-slate-900 border-transparent',
    cta: 'bg-black text-white',
  },
  starlight_grid: {
    shell:
      "bg-[#05070f] [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1)_0,transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08)_0,transparent_40%),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,auto,36px_36px,36px_36px]",
    card: 'bg-black/30 border border-white/10 backdrop-blur-sm',
    title: 'text-white',
    subtitle: 'text-white/70',
    social: 'text-white/90',
    link: 'bg-[#ba4b57] text-white',
    linkHover: 'hover:bg-[#a9404b]',
    input: 'bg-white/85 text-slate-900 border-[#ba4b57]',
    cta: 'bg-[#ba4b57] text-white',
  },
  tokyo_red: {
    shell: 'bg-[#0e0908]',
    card: 'bg-black/20 border border-white/10',
    title: 'text-[#f4f4f5]',
    subtitle: 'text-[#d4d4d8]',
    social: 'text-[#f5f5f4]',
    link: 'bg-[#dc2626] text-white',
    linkHover: 'hover:bg-[#c72020]',
    input: 'bg-white/90 text-slate-900 border-[#ef4444]',
    cta: 'bg-[#ef4444] text-white',
  },
  sky_frost: {
    shell: 'bg-[#7ec5df]',
    card: 'bg-white/10 backdrop-blur-sm border border-white/30',
    title: 'text-[#e6f2fa]',
    subtitle: 'text-[#deedf7]',
    social: 'text-[#eaf5fb]',
    link: 'bg-[#e5e7eb] text-[#111827]',
    linkHover: 'hover:bg-white',
    input: 'bg-white/90 text-slate-900 border-transparent',
    cta: 'bg-black text-white',
  },
  paper_minimal: {
    shell: 'bg-[#efefe9]',
    card: 'bg-white/70 border border-black/10',
    title: 'text-[#111827]',
    subtitle: 'text-[#4b5563]',
    social: 'text-[#111827]',
    link: 'bg-white text-[#111827] border border-black/20',
    linkHover: 'hover:bg-[#f8f8f6]',
    input: 'bg-white text-slate-900 border-black/20',
    cta: 'bg-[#111827] text-white',
  },
  deep_space: {
    shell:
      "bg-[#050914] [background-image:radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_30%_80%,rgba(168,85,247,0.2),transparent_40%)]",
    card: 'bg-black/35 border border-white/10 backdrop-blur-sm',
    title: 'text-[#e2e8f0]',
    subtitle: 'text-[#cbd5e1]',
    social: 'text-[#e2e8f0]',
    link: 'bg-[#1d4ed8] text-white border border-blue-300/20',
    linkHover: 'hover:bg-[#1e40af]',
    input: 'bg-white/95 text-slate-900 border-blue-300/40',
    cta: 'bg-[#1d4ed8] text-white',
  },
  rose_mono: {
    shell: 'bg-[linear-gradient(180deg,#25131a_0%,#3a1622_45%,#161821_100%)]',
    card: 'bg-black/25 border border-white/10',
    title: 'text-[#fde7ef]',
    subtitle: 'text-[#f9cbd9]',
    social: 'text-[#fde7ef]',
    link: 'bg-[#f43f5e] text-white',
    linkHover: 'hover:bg-[#e11d48]',
    input: 'bg-white/90 text-slate-900 border-pink-300/40',
    cta: 'bg-[#f43f5e] text-white',
  },
};

const mergeDraft = (draft?: Partial<LinkBioDraft>): LinkBioDraft => ({
  ...defaultDraft,
  ...draft,
  links: draft?.links && draft.links.length > 0 ? draft.links : defaultDraft.links,
});

export interface LinkBioDesignPreviewProps {
  theme: LinkBioThemeId;
  draft?: Partial<LinkBioDraft>;
  overrides?: LinkBioOverrides;
  onLinkClick?: (link: LinkBioLink) => void;
}

const socialIconForLabel = (label: string) => {
  const v = label.toLowerCase();
  if (v.includes('linkedin')) return Linkedin;
  if (v.includes('facebook')) return Facebook;
  if (v.includes('instagram')) return Instagram;
  if (v.includes('youtube')) return Youtube;
  if (v.includes('twitch')) return Twitch;
  if (v.includes('tiktok') || v.includes('music')) return Music2;
  return Link2;
};

export const LinkBioDesignPreview: React.FC<LinkBioDesignPreviewProps> = ({ theme, draft, overrides, onLinkClick }) => {
  const d = mergeDraft(draft);
  const t = themeMap[theme];
  const palette = {
    primary: overrides?.palette?.primary || '',
    secondary: overrides?.palette?.secondary || '',
    accent: overrides?.palette?.accent || '',
    background: overrides?.palette?.background || '',
    text: overrides?.palette?.text || '',
    surface: overrides?.palette?.surface || '',
  };
  const headingFont = overrides?.typography?.heading || '';
  const bodyFont = overrides?.typography?.text || '';
  const buttonFont = overrides?.typography?.button || bodyFont;
  const social = overrides?.socialLinks && overrides.socialLinks.length > 0
    ? overrides.socialLinks
    : ['website', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube', 'twitch'].map((label) => ({ label, url: '#' }));

  return (
    <div
      className={`w-full min-h-[720px] rounded-3xl ${t.shell} relative overflow-hidden`}
      style={{ backgroundColor: palette.background || undefined, color: palette.text || undefined, fontFamily: bodyFont || undefined }}
    >
      {d.backgroundImageUrl ? (
        <img loading="lazy" decoding="async" src={d.backgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
      ) : null}
      <div className="relative max-w-md mx-auto px-8 py-14">
        <div className={`rounded-3xl ${t.card} px-5 py-8`} style={{ backgroundColor: palette.surface || undefined }}>
          <div className="text-center">
            {d.heroImageUrl ? (
              <img loading="lazy" decoding="async" src={d.heroImageUrl} alt="" className="mx-auto w-[220px] h-[180px] object-cover rounded-xl mb-5" />
            ) : null}
            {d.avatarUrl ? (
              <img loading="lazy" decoding="async" src={d.avatarUrl} alt={d.name} className="mx-auto w-20 h-20 rounded-full object-cover border-2 border-white/40 mb-4" />
            ) : null}
            <h2 className={`text-4xl font-extrabold tracking-tight ${t.title}`} style={{ color: palette.text || undefined, fontFamily: headingFont || undefined }}>{d.handle || d.name}</h2>
            {d.handle ? <div className={`text-2xl font-semibold mt-2 ${t.title}`} style={{ color: palette.text || undefined, fontFamily: headingFont || undefined }}>{d.name}</div> : null}
            {d.location ? <p className={`text-sm mt-1 ${t.subtitle}`}>{d.location}</p> : null}
            {d.tagline ? <p className={`text-base mt-3 leading-relaxed ${t.subtitle}`}>{d.tagline}</p> : null}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            {social.map((item, idx) => {
              const Icon = socialIconForLabel(item.label);
              return (
              <a
                key={`${item.label}-${idx}`}
                href={item.url || '#'}
                className={`w-7 h-7 rounded-md flex items-center justify-center ${t.social} bg-transparent hover:bg-white/10 transition-colors`}
                aria-label={`${item.label} link`}
              >
                <Icon size={15} />
              </a>
              );
            })}
          </div>

          <div className="mt-5 flex items-stretch rounded-xl overflow-hidden border border-white/20">
            <input
              type="email"
              readOnly
              value={d.emailPlaceholder || 'Email'}
              className={`flex-1 px-4 py-3 text-sm outline-none ${t.input}`}
              style={{ borderColor: palette.secondary || undefined }}
            />
            <button
              type="button"
              className={`px-5 py-3 text-sm font-bold whitespace-nowrap ${t.cta}`}
              style={{ backgroundColor: palette.primary || undefined, color: palette.text ? undefined : undefined, fontFamily: buttonFont || undefined }}
            >
              {d.ctaLabel || 'Subscribe'}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {d.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                onClick={() => onLinkClick?.(link)}
                className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all border border-white/15 ${t.link} ${t.linkHover}`}
                style={{ backgroundColor: palette.accent || undefined, color: palette.text ? undefined : undefined, fontFamily: buttonFont || undefined }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LINK_BIO_THEME_PRESETS: Array<{
  id: LinkBioThemeId;
  name: string;
  description: string;
}> = [
  { id: 'mono_classic', name: 'Mono Classic', description: 'Minimal neutral layout with strong blue CTAs.' },
  { id: 'mint_pop', name: 'Mint Pop', description: 'Rounded playful profile with punchy bordered buttons.' },
  { id: 'noir_card', name: 'Noir Card', description: 'Black editorial card look with clean high contrast.' },
  { id: 'sunset_glow', name: 'Sunset Glow', description: 'Warm gradient personality style with soft cards.' },
  { id: 'starlight_grid', name: 'Starlight Grid', description: 'Night grid background with bold red action buttons.' },
  { id: 'tokyo_red', name: 'Tokyo Red', description: 'Dark cinematic palette with strong red conversion paths.' },
  { id: 'sky_frost', name: 'Sky Frost', description: 'Calm airy style with frosted cards and subtle contrast.' },
  { id: 'paper_minimal', name: 'Paper Minimal', description: 'Editorial light theme with subtle contrast and clean cards.' },
  { id: 'deep_space', name: 'Deep Space', description: 'Blue-purple sci-fi gradient with strong CTA hierarchy.' },
  { id: 'rose_mono', name: 'Rose Mono', description: 'Dark rose palette for creators who want bold personality.' },
];

