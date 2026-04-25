import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Kanban,
  Bell,
  Clock,
  Bot,
  Briefcase,
  LinkIcon,
  BarChart3,
  FileText,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const products = [
  { icon: LayoutDashboard, title: 'Freelancer CRM', desc: 'Track leads, manage clients, and close deals from one visual pipeline.', href: '/freelancer-crm', color: '#10b981' },
  { icon: Sparkles, title: 'AI Proposal Generator', desc: 'Write winning proposals in seconds. AI learns from your wins.', href: '/proposal-generator', color: '#8b5cf6' },
  { icon: Clock, title: 'Time Tracking', desc: 'One-click timer with auto rate calculations and shareable sessions.', href: '/time-tracking', color: '#3b82f6' },
  { icon: Users, title: 'Client Portal', desc: 'Share progress with clients through branded, professional pages.', href: '/client-portal', color: '#f59e0b' },
  { icon: Briefcase, title: 'Portfolio Builder', desc: 'Publish a stunning portfolio site. Templates, customization, analytics.', href: '/portfolio-builder', color: '#f43f5e' },
  { icon: LinkIcon, title: 'Link in Bio', desc: 'One conversion-focused page for all your social profiles and CTAs.', href: '/link-in-bio', color: '#0ea5e9' },
];

const capabilities = [
  { icon: Kanban, text: 'Visual Kanban board for your job pipeline' },
  { icon: Bell, text: 'Smart follow-up reminders based on deal stage' },
  { icon: Bot, text: 'AI agent that coaches you to improve' },
  { icon: BarChart3, text: 'Per-platform analytics and win rates' },
  { icon: FileText, text: '36+ proven proposal and outreach templates' },
];

export const Features: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=features')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="All Features — Freelancer CRM, AI Proposals & More"
        description="Every tool a solo freelancer needs in one platform. CRM, AI proposals, time tracking, portfolio, and more."
        path="/features"
        keywords={['freelancer crm features', 'freelancer productivity tools', 'freelance management software']}
      />

      {/* ═══ HERO — Bold centered ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 mb-6">
            <Sparkles size={12} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            One platform.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
              Everything you need.
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-10">
            GetSoloDesk replaces 5+ tools with one purpose-built platform. No bloat. No enterprise complexity. Just the features that help you find clients, close deals, and get paid.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all group">
            Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══ PRODUCT GRID — Each card links to its page ═══ */}
      <section className="bg-slate-50 py-20 lg:py-28 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Six products, one subscription</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <Link
                key={p.href}
                to={p.href}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${p.color}10` }}>
                  <p.icon size={20} style={{ color: p.color }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                  {p.title}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-500" />
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CAPABILITIES — Checklist ═══ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Plus all the details that matter</h2>
              <p className="text-slate-500 leading-relaxed">Built-in capabilities that make the whole platform greater than the sum of its parts.</p>
            </div>
            <div className="space-y-3">
              {capabilities.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <c.icon size={14} className="text-indigo-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">One platform. Zero compromises.</h2>
          <p className="text-indigo-100/60 mb-8">Free forever. No credit card needed.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Get Started Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Features;
