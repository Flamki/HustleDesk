import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  categoryColor: string;
  emoji: string;
  stat: string;
  statLabel: string;
  gradient: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-write-freelance-proposal-that-wins',
    title: 'How to Write a Freelance Proposal That Actually Wins',
    description: 'The exact framework top freelancers use to win 40%+ of their proposals — with real examples and templates you can steal today.',
    date: 'Apr 25, 2026',
    readTime: '8 min',
    category: 'Proposals',
    categoryColor: '#8b5cf6',
    emoji: '🎯',
    stat: '40%',
    statLabel: 'win rate',
    gradient: 'from-violet-500/90 to-purple-600/90',
  },
  {
    slug: 'freelancer-crm-why-you-need-one',
    title: 'Why Every Freelancer Needs a CRM (Set Up in 5 Min)',
    description: 'Spreadsheets are killing your freelance business. A purpose-built CRM is the single best ROI investment for solo freelancers.',
    date: 'Apr 24, 2026',
    readTime: '6 min',
    category: 'CRM',
    categoryColor: '#10b981',
    emoji: '📊',
    stat: '$18K',
    statLabel: 'saved / year',
    gradient: 'from-emerald-500/90 to-teal-600/90',
  },
  {
    slug: 'upwork-proposal-tips',
    title: '7 Upwork Proposal Tips That 3x\'d My Win Rate',
    description: 'After 500+ proposals on Upwork, these are the 7 data-backed tactics that consistently get responses.',
    date: 'Apr 23, 2026',
    readTime: '7 min',
    category: 'Upwork',
    categoryColor: '#3b82f6',
    emoji: '🚀',
    stat: '3x',
    statLabel: 'more wins',
    gradient: 'from-blue-500/90 to-indigo-600/90',
  },
  {
    slug: 'track-freelance-income',
    title: 'Track Freelance Income: The Complete 2026 System',
    description: 'From time tracking to invoicing to tax prep — the complete system for knowing exactly what you earn.',
    date: 'Apr 22, 2026',
    readTime: '10 min',
    category: 'Finance',
    categoryColor: '#f59e0b',
    emoji: '💰',
    stat: '2.5h',
    statLabel: 'saved / day',
    gradient: 'from-amber-500/90 to-orange-600/90',
  },
  {
    slug: 'freelance-follow-up-email-templates',
    title: '5 Follow-Up Emails That Win Back Cold Leads',
    description: 'Copy-paste templates for re-engaging leads who went silent — with the exact timing strategy that works.',
    date: 'Apr 21, 2026',
    readTime: '5 min',
    category: 'Templates',
    categoryColor: '#6366f1',
    emoji: '✉️',
    stat: '80%',
    statLabel: 'close after 5th',
    gradient: 'from-indigo-500/90 to-violet-600/90',
  },
];

const categories = ['All', 'Proposals', 'CRM', 'Upwork', 'Finance', 'Templates'];

export const BlogIndex: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  return (
    <PublicPageLayout>
      <SEO
        title="Blog — Freelance Tips, Strategies & Guides"
        description="Actionable guides for freelancers: winning proposals, client management, time tracking, and growing your solo business."
        path="/blog"
        keywords={['freelance blog', 'freelancer tips', 'upwork tips', 'freelance proposal tips']}
      />

      {/* ═══ MINIMAL HEADER ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Blog</p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                The Freelancer's Playbook
              </h1>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
                    ${activeCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HORIZONTAL CARDS ═══ */}
      <section className="bg-slate-50 py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {filtered.map((post, i) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300"
            >
              {/* ── Left: Visual Panel ── */}
              <div className={`md:col-span-4 lg:col-span-3 relative bg-gradient-to-br ${post.gradient} p-6 md:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[220px]`}>
                {/* Noise overlay */}
                <div className="absolute inset-0 opacity-[0.08]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                }} />

                {/* Big stat */}
                <div className="relative">
                  <p className="text-4xl md:text-5xl font-black text-white/95 tracking-tighter leading-none">
                    {post.stat}
                  </p>
                  <p className="text-[11px] font-medium text-white/60 mt-1">{post.statLabel}</p>
                </div>

                {/* Category badge */}
                <div className="relative flex items-center gap-2 mt-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 bg-white/15 px-2.5 py-1 rounded-md backdrop-blur-sm">
                    {post.category}
                  </span>
                </div>

                {/* Decorative circle */}
                <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/10" />
              </div>

              {/* ── Right: Content ── */}
              <div className="md:col-span-8 lg:col-span-9 p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{post.readTime} read</span>
                  {i === 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-[9px]">Latest</span>
                    </>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-5 max-w-xl">
                  {post.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Read article
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="bg-white border-t border-slate-200 py-14 lg:py-18">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-3">Stop reading, start doing</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            Every strategy here is built into GetSoloDesk
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            CRM, AI proposals, follow-up automation, time tracking, invoicing — all in one tool built for solo freelancers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all group"
            >
              Start Free
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all"
            >
              Explore features
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default BlogIndex;
