import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, LucideIcon } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type StatItem = {
  value: string;
  label: string;
};

type Props = {
  // SEO
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  // Hero
  badge: string;
  badgeColor?: string;           // tailwind gradient class
  heading: string;
  headingAccent: string;         // gradient-colored word(s)
  intro: string;
  accentFrom?: string;           // gradient start color
  accentTo?: string;             // gradient end color
  // Stats
  stats?: StatItem[];
  // Features
  features: FeatureItem[];
  // Bullets (quick list)
  bullets: string[];
  // Bottom CTA
  ctaHeading?: string;
  ctaSub?: string;
};

export const PublicPageTemplate: React.FC<Props> = ({
  title,
  description,
  path,
  keywords,
  badge,
  badgeColor = 'from-indigo-500 to-purple-500',
  heading,
  headingAccent,
  intro,
  accentFrom = '#6366f1',
  accentTo = '#8b5cf6',
  stats,
  features,
  bullets,
  ctaHeading = 'Ready to level up your freelance game?',
  ctaSub = 'Free to start. No credit card required. Set up in under 2 minutes.',
}) => {
  const canonicalPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `https://getsolodesk.com${canonicalPath === '/' ? '' : canonicalPath}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${title} | GetSoloDesk`,
      description,
      url: canonicalUrl,
      inLanguage: 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://getsolodesk.com' },
        { '@type': 'ListItem', position: 2, name: title, item: canonicalUrl },
      ],
    },
  ];

  const startFreePath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=' + path.replace(/\//g, ''))}`;

  // Split heading into parts to colorize the accent word(s)
  const headingParts = heading.split(headingAccent);

  return (
    <PublicPageLayout>
      <SEO title={title} description={description} path={path} keywords={keywords} structuredData={schema} />

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative overflow-hidden">
        {/* Dark background */}
        <div className="bg-[#0a0a1a] pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Ambient glow */}
          <div
            className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.08]"
            style={{ background: `radial-gradient(circle, ${accentFrom}, transparent)` }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.06]"
            style={{ background: `radial-gradient(circle, ${accentTo}, transparent)` }}
          />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${badgeColor}`} />
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">{badge}</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              {headingParts[0]}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
              >
                {headingAccent}
              </span>
              {headingParts[1] || ''}
            </h1>

            {/* Intro */}
            <p className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed mb-10">
              {intro}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={startFreePath}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-slate-900 rounded-full font-bold text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-white/10 group"
              >
                Start Free — No Credit Card
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
              >
                View All Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      {stats && stats.length > 0 && (
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={`grid grid-cols-2 md:grid-cols-${stats.length} gap-6 text-center`}>
              {stats.map((s, i) => (
                <div key={i}>
                  <p
                    className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text"
                    style={{ backgroundImage: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ FEATURES GRID ═══ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Everything you need
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Built for freelancers who want to work smarter, not harder.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg, ${accentFrom}15, ${accentTo}15)` }}
                >
                  <f.icon size={20} style={{ color: accentFrom }} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ QUICK BENEFITS ═══ */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Why freelancers love it</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {bullets.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div
                  className="min-w-[28px] h-7 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${accentFrom}15, ${accentTo}15)` }}
                >
                  <Check size={14} style={{ color: accentFrom }} />
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="bg-[#0a0a1a] py-20 lg:py-24">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.06]"
            style={{ background: `radial-gradient(circle, ${accentFrom}, ${accentTo})` }}
          />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              {ctaHeading}
            </h2>
            <p className="text-white/40 mb-8 max-w-lg mx-auto">{ctaSub}</p>
            <Link
              to={startFreePath}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-white/10 group"
            >
              Get Started Free
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};
