import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Zap, Target, BookOpen } from 'lucide-react';
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
    statLabel: 'avg win rate with this framework',
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
    statLabel: 'lost yearly from missed follow-ups',
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
    statLabel: 'win rate increase',
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
    statLabel: 'lost daily to untracked work',
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
    statLabel: 'of deals won after 5th follow-up',
  },
];

const categories = ['All', 'Proposals', 'CRM', 'Upwork', 'Finance', 'Templates'];

export const BlogIndex: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <PublicPageLayout>
      <SEO
        title="Blog — Freelance Tips, Strategies & Guides"
        description="Actionable guides for freelancers: winning proposals, client management, time tracking, and growing your solo business."
        path="/blog"
        keywords={['freelance blog', 'freelancer tips', 'upwork tips', 'freelance proposal tips']}
      />

      {/* ═══ EDITORIAL HERO ═══ */}
      <section className="relative bg-white overflow-hidden border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-10">
          {/* Masthead */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <BookOpen size={14} className="text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">The Solo Desk</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Insights for independent professionals
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
              <TrendingUp size={12} />
              <span>{blogPosts.length} articles</span>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap
                  ${activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featured && (
        <>
          {/* ═══ FEATURED — FULL-WIDTH EDITORIAL CARD ═══ */}
          <section className="bg-slate-50 py-10 lg:py-14 border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <Link
                to={`/blog/${featured.slug}`}
                className="group grid lg:grid-cols-5 gap-6 lg:gap-0 items-stretch bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300"
              >
                {/* Left — Visual stat block */}
                <div
                  className="lg:col-span-2 relative flex flex-col items-center justify-center py-12 lg:py-0"
                  style={{ background: `linear-gradient(145deg, ${featured.categoryColor}08, ${featured.categoryColor}03)` }}
                >
                  {/* Large stat */}
                  <div className="text-center">
                    <p
                      className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none"
                      style={{ color: featured.categoryColor }}
                    >
                      {featured.stat}
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-2 max-w-[160px] mx-auto leading-snug">
                      {featured.statLabel}
                    </p>
                  </div>

                  {/* Decorative circles */}
                  <div
                    className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-[0.07]"
                    style={{ background: featured.categoryColor }}
                  />
                  <div
                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.05]"
                    style={{ background: featured.categoryColor }}
                  />
                </div>

                {/* Right — Content */}
                <div className="lg:col-span-3 p-7 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-md"
                      style={{ backgroundColor: `${featured.categoryColor}12`, color: featured.categoryColor }}
                    >
                      {featured.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{featured.date}</span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-400">{featured.readTime}</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-slate-500 leading-relaxed mb-6 max-w-lg">
                    {featured.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Read this guide
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* ═══ ARTICLE LIST — CLEAN EDITORIAL ROWS ═══ */}
          {rest.length > 0 && (
            <section className="bg-white py-10 lg:py-14">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="divide-y divide-slate-100">
                  {rest.map((post, i) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group flex items-start gap-5 md:gap-8 py-7 first:pt-0 last:pb-0"
                    >
                      {/* Number */}
                      <span className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-sm font-bold text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1">
                        {String(i + 2).padStart(2, '0')}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${post.categoryColor}12`, color: post.categoryColor }}
                          >
                            {post.category}
                          </span>
                          <span className="text-[11px] text-slate-400">{post.readTime}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-1 md:line-clamp-2">{post.description}</p>
                      </div>

                      {/* Stat chip */}
                      <div className="hidden sm:flex flex-col items-center flex-shrink-0 mt-1">
                        <div
                          className="px-4 py-3 rounded-xl text-center"
                          style={{ background: `${post.categoryColor}08` }}
                        >
                          <p
                            className="text-xl font-black leading-none"
                            style={{ color: post.categoryColor }}
                          >
                            {post.stat}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 max-w-[80px] leading-tight">
                            {post.statLabel}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ═══ NEWSLETTER / CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-6">
            <Zap size={12} className="text-amber-400" />
            <span className="text-xs font-bold text-white/70">Join 2,000+ freelancers</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Stop reading. Start winning.
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
            These strategies work. But only if you execute. GetSoloDesk automates the boring parts so you can focus on what matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all group shadow-xl"
            >
              Try GetSoloDesk Free
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/15 text-white/80 rounded-xl font-semibold text-sm hover:bg-white/5 hover:text-white transition-all"
            >
              See all features
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default BlogIndex;
