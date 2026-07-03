import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import SEO from '../../components/SEO';
import { AdSenseUnit, hasAdSenseClient } from '../../components/ads/AdSenseUnit';
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
  image: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-write-freelance-proposal-that-wins',
    title: 'How to Write a Freelance Proposal That Actually Wins',
    description: 'The exact framework top freelancers use to win 40%+ of their proposals — with real examples and templates.',
    date: 'Apr 25',
    readTime: '8 min',
    category: 'Proposals',
    categoryColor: '#8b5cf6',
    emoji: '🎯',
    stat: '40%',
    statLabel: 'win rate',
    gradient: 'from-violet-500 to-purple-600',
    image: '/blog-proposals.png',
  },
  {
    slug: 'freelancer-crm-why-you-need-one',
    title: 'Why Every Freelancer Needs a CRM (Set Up in 5 Min)',
    description: 'Spreadsheets are killing your freelance business. A purpose-built CRM is the single best ROI investment.',
    date: 'Apr 24',
    readTime: '6 min',
    category: 'CRM',
    categoryColor: '#10b981',
    emoji: '📊',
    stat: '$18K',
    statLabel: 'saved / yr',
    gradient: 'from-emerald-500 to-teal-600',
    image: '/blog-crm.png',
  },
  {
    slug: 'upwork-proposal-tips',
    title: '7 Upwork Proposal Tips That 3x\'d My Win Rate',
    description: 'After 500+ proposals, these are the 7 data-backed tactics that consistently get responses.',
    date: 'Apr 23',
    readTime: '7 min',
    category: 'Upwork',
    categoryColor: '#3b82f6',
    emoji: '🚀',
    stat: '3x',
    statLabel: 'more wins',
    gradient: 'from-blue-500 to-indigo-600',
    image: '/blog-upwork.png',
  },
  {
    slug: 'track-freelance-income',
    title: 'Track Freelance Income: The Complete 2026 System',
    description: 'Time tracking to invoicing to tax prep — the complete system for knowing exactly what you earn.',
    date: 'Apr 22',
    readTime: '10 min',
    category: 'Finance',
    categoryColor: '#f59e0b',
    emoji: '💰',
    stat: '2.5h',
    statLabel: 'saved / day',
    gradient: 'from-amber-500 to-orange-600',
    image: '/blog-income.png',
  },
  {
    slug: 'freelance-follow-up-email-templates',
    title: '5 Follow-Up Emails That Win Back Cold Leads',
    description: 'Copy-paste templates for re-engaging leads who went silent — with exact timing strategy.',
    date: 'Apr 21',
    readTime: '5 min',
    category: 'Templates',
    categoryColor: '#6366f1',
    emoji: '✉️',
    stat: '80%',
    statLabel: 'close rate',
    gradient: 'from-indigo-500 to-violet-600',
    image: '/blog-followup.png',
  },
];

const categories = ['All', 'Proposals', 'CRM', 'Upwork', 'Finance', 'Templates'];
const blogIndexAdSlot = (import.meta.env.VITE_GOOGLE_ADSENSE_BLOG_INDEX_SLOT || '').trim();

export const BlogIndex: React.FC = () => {
  const [active, setActive] = useState('All');
  const posts = active === 'All' ? blogPosts : blogPosts.filter((p) => p.category === active);

  return (
    <PublicPageLayout>
      <SEO
        title="Blog — Freelance Tips, Strategies & Guides"
        description="Actionable guides for freelancers: winning proposals, client management, time tracking, and growing your solo business."
        path="/blog"
        keywords={['freelance blog', 'freelancer tips', 'upwork tips', 'freelance proposal tips']}
      />

      {/* ═══ HEADER ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Blog</h1>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    active === cat ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED (first post) ═══ */}
      {posts.length > 0 && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              to={`/blog/${posts[0].slug}`}
              className="group grid md:grid-cols-2 gap-6 items-center"
            >
              <div className="rounded-2xl overflow-hidden aspect-[16/10]">
                <img
                  src={posts[0].image}
                  alt={posts[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-md"
                    style={{ background: `${posts[0].categoryColor}12`, color: posts[0].categoryColor }}>
                    {posts[0].category}
                  </span>
                  <span className="text-[11px] text-slate-400">{posts[0].date} · {posts[0].readTime}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
                  {posts[0].title}
                </h2>
                <p className="text-slate-500 leading-relaxed mb-5">{posts[0].description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Read article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {hasAdSenseClient && blogIndexAdSlot ? (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <AdSenseUnit slot={blogIndexAdSlot} label="Blog index" />
          </div>
        </section>
      ) : null}

      {/* ═══ 4-COLUMN GRID WITH REAL IMAGES ═══ */}
      {posts.length > 1 && (
        <section className="bg-slate-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {posts.slice(1).map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
                        style={{ background: `${post.categoryColor}12`, color: post.categoryColor }}>
                        {post.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{post.readTime}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA ═══ */}
      <section className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Every strategy here is built into GetSoloDesk</h2>
          <p className="text-sm text-slate-500 mb-6">CRM, AI proposals, follow-up automation, time tracking, invoicing — one tool for freelancers.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all group">
              Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/features" className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all">
              Features <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default BlogIndex;
