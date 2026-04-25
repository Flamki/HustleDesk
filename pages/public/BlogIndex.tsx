import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';
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
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-write-freelance-proposal-that-wins',
    title: 'How to Write a Freelance Proposal That Actually Wins (2026 Guide)',
    description: 'Stop sending generic proposals. Learn the exact framework top freelancers use to win 40%+ of their proposals — with real examples and templates.',
    date: '2026-04-25',
    readTime: '8 min',
    category: 'Proposals',
    categoryColor: '#8b5cf6',
  },
  {
    slug: 'freelancer-crm-why-you-need-one',
    title: 'Why Every Freelancer Needs a CRM (And How to Set One Up in 5 Minutes)',
    description: 'Spreadsheets are killing your freelance business. Here\'s why a purpose-built CRM is the single best investment for solo freelancers.',
    date: '2026-04-24',
    readTime: '6 min',
    category: 'CRM',
    categoryColor: '#10b981',
  },
  {
    slug: 'upwork-proposal-tips',
    title: '7 Upwork Proposal Tips That Increased My Win Rate by 3x',
    description: 'After 500+ proposals on Upwork, these are the 7 tactics that consistently get responses. Data-backed tips from real freelancer analytics.',
    date: '2026-04-23',
    readTime: '7 min',
    category: 'Upwork',
    categoryColor: '#3b82f6',
  },
  {
    slug: 'track-freelance-income',
    title: 'How to Track Freelance Income: The Complete Guide for 2026',
    description: 'From time tracking to invoicing to tax prep — a complete system for knowing exactly how much you earn and where it comes from.',
    date: '2026-04-22',
    readTime: '10 min',
    category: 'Finance',
    categoryColor: '#f59e0b',
  },
  {
    slug: 'freelance-follow-up-email-templates',
    title: '5 Follow-Up Email Templates That Win Back Cold Leads',
    description: 'The money is in the follow-up. Here are 5 copy-paste templates for re-engaging leads who went silent — with timing strategy included.',
    date: '2026-04-21',
    readTime: '5 min',
    category: 'Templates',
    categoryColor: '#6366f1',
  },
];

// Blog Index Page
export const BlogIndex: React.FC = () => (
  <PublicPageLayout>
    <SEO
      title="Blog — Freelance Tips, Strategies & Guides"
      description="Actionable guides for freelancers: winning proposals, client management, time tracking, and growing your solo business."
      path="/blog"
      keywords={['freelance blog', 'freelancer tips', 'upwork tips', 'freelance proposal tips', 'freelance advice']}
    />

    <section className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">Blog</h1>
        <p className="text-lg text-slate-500 max-w-xl">Actionable strategies for freelancers who want to win more clients, charge more, and work smarter.</p>
      </div>
    </section>

    <section className="bg-white py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block group rounded-2xl border border-slate-200 p-6 md:p-8 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${post.categoryColor}15`, color: post.categoryColor }}
                >
                  {post.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10} />{post.date}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-slate-500 leading-relaxed mb-3">{post.description}</p>
              <span className="text-sm font-semibold text-indigo-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Read article <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </PublicPageLayout>
);

export default BlogIndex;
