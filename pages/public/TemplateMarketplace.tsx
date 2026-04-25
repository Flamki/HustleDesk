import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Copy, Sparkles, Layers, Target, TrendingUp, Zap, BookOpen } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const categories = [
  { name: 'Proposals', count: 12, color: '#8b5cf6' },
  { name: 'Follow-ups', count: 8, color: '#f59e0b' },
  { name: 'Cold Outreach', count: 6, color: '#3b82f6' },
  { name: 'Negotiations', count: 5, color: '#10b981' },
  { name: 'Onboarding', count: 3, color: '#f43f5e' },
  { name: 'Closing', count: 2, color: '#6366f1' },
];

export const TemplateMarketplace: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=templates')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="36+ Proven Freelance Templates — Proposals, Follow-ups & More"
        description="Battle-tested templates for proposals, follow-ups, negotiations, and client onboarding. Copy-paste and customize in seconds."
        path="/templates"
        keywords={['freelance templates', 'proposal templates', 'freelance follow-up email templates', 'freelance outreach templates']}
      />

      {/* ═══ HERO ═══ */}
      <section className="bg-[#0a0a1a] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[150px] -translate-y-1/2" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
            <BookOpen size={12} className="text-indigo-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">Template Library</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            36+ templates that<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              actually convert.
            </span>
          </h1>
          <p className="text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed mb-10">
            Battle-tested by real freelancers. Every template is based on what actually wins jobs, closes deals, and retains clients. Copy, customize, and send.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Access All Templates <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="bg-white py-20 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Templates for every situation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.name} className="p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-xs font-bold text-slate-400">{c.count} templates</span>
                </div>
                <p className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PREVIEW — Sample template ═══ */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">Preview: Cold Outreach Template</h2>
          <p className="text-slate-500 text-center mb-10">One of 36+ templates included free</p>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Cold Outreach • LinkedIn</span>
              <button className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"><Copy size={12} /> Copy</button>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3">
              <p>Hi <span className="bg-indigo-100 text-indigo-700 px-1 rounded font-mono text-xs">{"{{client_name}}"}</span>,</p>
              <p>I came across <span className="bg-indigo-100 text-indigo-700 px-1 rounded font-mono text-xs">{"{{company}}"}</span> and noticed your landing page could benefit from a conversion-focused redesign. I've helped 3 similar companies increase their signup rate by 30-50%.</p>
              <p>Would love to share a quick 2-minute Loom showing what I'd change. No commitment — just wanted to help.</p>
              <p>Best,<br /><span className="bg-indigo-100 text-indigo-700 px-1 rounded font-mono text-xs">{"{{your_name}}"}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stop writing from scratch.</h2>
          <p className="text-indigo-100/60 mb-8">36+ templates. Free. Copy and customize in seconds.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Get All Templates <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default TemplateMarketplace;
