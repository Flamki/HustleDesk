import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
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
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-write-freelance-proposal-that-wins',
    title: 'How to Write a Freelance Proposal That Actually Wins (2026 Guide)',
    description: 'Stop sending generic proposals. Learn the exact framework top freelancers use to win 40%+ of their proposals — with real examples and templates.',
    date: 'Apr 25, 2026',
    readTime: '8 min read',
    category: 'Proposals',
    categoryColor: '#8b5cf6',
    emoji: '🎯',
  },
  {
    slug: 'freelancer-crm-why-you-need-one',
    title: 'Why Every Freelancer Needs a CRM (And How to Set One Up in 5 Minutes)',
    description: 'Spreadsheets are killing your freelance business. Here\'s why a purpose-built CRM is the single best investment for solo freelancers.',
    date: 'Apr 24, 2026',
    readTime: '6 min read',
    category: 'CRM',
    categoryColor: '#10b981',
    emoji: '📊',
  },
  {
    slug: 'upwork-proposal-tips',
    title: '7 Upwork Proposal Tips That Increased My Win Rate by 3x',
    description: 'After 500+ proposals on Upwork, these are the 7 tactics that consistently get responses. Data-backed tips from real freelancer analytics.',
    date: 'Apr 23, 2026',
    readTime: '7 min read',
    category: 'Upwork',
    categoryColor: '#3b82f6',
    emoji: '🚀',
  },
  {
    slug: 'track-freelance-income',
    title: 'How to Track Freelance Income: The Complete Guide for 2026',
    description: 'From time tracking to invoicing to tax prep — a complete system for knowing exactly how much you earn and where it comes from.',
    date: 'Apr 22, 2026',
    readTime: '10 min read',
    category: 'Finance',
    categoryColor: '#f59e0b',
    emoji: '💰',
  },
  {
    slug: 'freelance-follow-up-email-templates',
    title: '5 Follow-Up Email Templates That Win Back Cold Leads',
    description: 'The money is in the follow-up. Here are 5 copy-paste templates for re-engaging leads who went silent — with timing strategy included.',
    date: 'Apr 21, 2026',
    readTime: '5 min read',
    category: 'Templates',
    categoryColor: '#6366f1',
    emoji: '✉️',
  },
];

// Blog Index Page
export const BlogIndex: React.FC = () => {
  const [featured, ...rest] = blogPosts;

  return (
    <PublicPageLayout>
      <SEO
        title="Blog — Freelance Tips, Strategies & Guides"
        description="Actionable guides for freelancers: winning proposals, client management, time tracking, and growing your solo business."
        path="/blog"
        keywords={['freelance blog', 'freelancer tips', 'upwork tips', 'freelance proposal tips', 'freelance advice']}
      />

      {/* ═══ DARK HERO ═══ */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">GetSoloDesk Blog</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 max-w-2xl leading-[1.1]">
            Level up your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">freelance game</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-lg">
            Actionable strategies for freelancers who want to win more clients, charge more, and work smarter.
          </p>
        </div>
      </section>

      {/* ═══ FEATURED ARTICLE ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Latest</p>
          <Link
            to={`/blog/${featured.slug}`}
            className="group grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          >
            {/* Left — Visual Card */}
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${featured.categoryColor}15, ${featured.categoryColor}08)` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
              <div className="relative text-center p-8">
                <span className="text-6xl md:text-7xl block mb-4">{featured.emoji}</span>
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${featured.categoryColor}20`, color: featured.categoryColor }}
                >
                  {featured.category}
                </span>
              </div>
              {/* Corner gradient accent */}
              <div
                className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-20"
                style={{ background: featured.categoryColor }}
              />
            </div>

            {/* Right — Content */}
            <div>
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={11} />{featured.date}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1"><Clock size={11} />{featured.readTime}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                {featured.title}
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">{featured.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:gap-3 transition-all">
                Read article <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ ARTICLE GRID ═══ */}
      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">More articles</p>
          <div className="grid md:grid-cols-2 gap-5">
            {rest.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all overflow-hidden"
              >
                {/* Top accent bar */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${post.categoryColor}, ${post.categoryColor}60)` }} />

                <div className="p-6 md:p-7">
                  <div className="flex items-start gap-4">
                    {/* Emoji icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${post.categoryColor}12` }}
                    >
                      {post.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${post.categoryColor}15`, color: post.categoryColor }}
                        >
                          {post.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{post.readTime}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{post.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={10} />{post.date}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Read <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Want to put these strategies on autopilot?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            GetSoloDesk gives you the CRM, AI proposals, and follow-up system to execute every strategy you read here.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-sm hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-indigo-500/25 group"
          >
            Start Free — No Card Required
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default BlogIndex;
