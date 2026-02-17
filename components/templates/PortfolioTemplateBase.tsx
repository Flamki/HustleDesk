import React from 'react';
import { ExternalLink, Github, Instagram, Linkedin, Twitter } from 'lucide-react';
import type { PortfolioBuilderState } from '../builder/builderTypes';

interface Props {
  state: PortfolioBuilderState;
  variant: 'creative' | 'minimal' | 'tech' | 'gradient';
}

const iconFor = (key: string) => {
  if (key === 'github') return Github;
  if (key === 'linkedin') return Linkedin;
  if (key === 'instagram') return Instagram;
  return Twitter;
};

export const PortfolioTemplateBase: React.FC<Props> = ({ state, variant }) => {
  const { palette, typography, content, socials, links } = state;
  const profileImg = content.profileImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
  const backgroundClass =
    variant === 'creative'
      ? 'bg-[radial-gradient(circle_at_20%_20%,#f9a8d4_0%,#c4b5fd_35%,#93c5fd_90%)]'
      : variant === 'tech'
        ? 'bg-[linear-gradient(120deg,#020617_0%,#0f172a_55%,#1e293b_100%)]'
        : variant === 'gradient'
          ? 'bg-[radial-gradient(circle_at_20%_10%,#fef3c7_0%,#fed7aa_30%,#bfdbfe_100%)]'
          : 'bg-slate-100';

  return (
    <div
      className={`w-full min-h-[780px] rounded-2xl overflow-hidden p-8 ${backgroundClass}`}
      style={{ backgroundColor: palette.background, color: palette.text, fontFamily: typography.body }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl border p-6 shadow-sm"
          style={{ background: palette.background, borderColor: palette.secondary }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            <div className="flex items-center gap-4">
              <img loading="lazy" decoding="async" src={profileImg} className="w-20 h-20 rounded-full object-cover border" style={{ borderColor: palette.secondary }} />
              <div>
                <h2 className="text-3xl font-bold" style={{ color: palette.primary, fontFamily: typography.heading }}>
                  {content.fullName}
                </h2>
                <div className="text-sm opacity-80">{content.professionalTitle}</div>
                <div className="text-xs opacity-60 mt-1">{content.location}</div>
              </div>
            </div>
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
              style={{ background: palette.accent, color: palette.background, fontFamily: typography.button }}
            >
              Contact
              <ExternalLink size={14} />
            </a>
          </div>

          <p className="mt-5 text-sm leading-relaxed opacity-90">{content.bio}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(socials)
              .filter(([, url]) => Boolean(url))
              .slice(0, 6)
              .map(([key, url]) => {
                const Icon = iconFor(key);
                return (
                  <a
                    key={key}
                    href={url}
                    className="w-9 h-9 rounded-lg border inline-flex items-center justify-center"
                    style={{ borderColor: palette.secondary }}
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
          </div>

          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.projects.slice(0, 4).map((project) => (
              <div key={project.id} className="rounded-xl border overflow-hidden" style={{ borderColor: palette.secondary }}>
                <img loading="lazy" decoding="async" src={project.imageUrl} className="h-36 w-full object-cover" />
                <div className="p-4">
                  <div className="font-semibold" style={{ color: palette.primary, fontFamily: typography.heading }}>
                    {project.title}
                  </div>
                  <div className="text-xs mt-2 opacity-80">{project.description}</div>
                </div>
              </div>
            ))}
          </div>

          {links.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {links.slice(0, 4).map((link) => (
                <a
                  key={link.id}
                  href={link.url || '#'}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-center border"
                  style={{ background: palette.accent, color: palette.background, borderColor: palette.accent, fontFamily: typography.button }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};


