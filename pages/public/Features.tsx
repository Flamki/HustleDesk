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
  Receipt,
  FileSignature,
  BookOpen,
  Mail,
  Check,
  Zap,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const products = [
  { icon: LayoutDashboard, title: 'Freelancer CRM', desc: 'Track leads, manage clients, and close deals from one visual pipeline.', href: '/freelancer-crm', color: '#10b981', tag: 'Core' },
  { icon: Sparkles, title: 'AI Proposal Generator', desc: 'Write winning proposals in seconds. AI learns from your wins.', href: '/proposal-generator', color: '#8b5cf6', tag: 'AI' },
  { icon: Clock, title: 'Time Tracking', desc: 'One-click timer with auto rate calculations and shareable sessions.', href: '/time-tracking', color: '#3b82f6', tag: null },
  { icon: Receipt, title: 'Invoice Generator', desc: 'Create invoices from tracked time. Accept payments via Stripe.', href: '/invoice-generator', color: '#22c55e', tag: 'Payments' },
  { icon: FileSignature, title: 'Contract Builder', desc: 'AI-generated contracts with e-signatures. Protect your work.', href: '/contract-builder', color: '#475569', tag: 'AI' },
  { icon: Users, title: 'Client Portal', desc: 'Share progress with clients through branded, professional pages.', href: '/client-portal', color: '#f59e0b', tag: null },
  { icon: Briefcase, title: 'Portfolio Builder', desc: 'Publish a stunning portfolio site. Templates, customization, analytics.', href: '/portfolio-builder', color: '#f43f5e', tag: null },
  { icon: LinkIcon, title: 'Link in Bio', desc: 'One conversion-focused page for all your social profiles and CTAs.', href: '/link-in-bio', color: '#0ea5e9', tag: null },
  { icon: BookOpen, title: 'Template Library', desc: '36+ battle-tested templates for proposals, follow-ups, and outreach.', href: '/templates', color: '#6366f1', tag: '36+' },
  { icon: Mail, title: 'Email Marketing', desc: 'Automated drip campaigns connected to your CRM pipeline.', href: '/email-marketing', color: '#d946ef', tag: 'New' },
];

const capabilities = [
  'Visual Kanban board for your job pipeline',
  'Smart follow-up reminders based on deal stage',
  'AI agent that coaches you to improve',
  'Per-platform analytics and win rates',
  '36+ proven proposal and outreach templates',
  'One-click export for tax season',
  'Dark mode across the entire platform',
  'Mobile-responsive — works on any device',
];

const stats = [
  { value: '10', label: 'Products' },
  { value: '36+', label: 'Templates' },
  { value: '5min', label: 'Setup time' },
  { value: '$0', label: 'To start' },
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

      {/* ═══ HERO ═══ */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 mb-6 backdrop-blur-sm">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">10 products, one platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08] mb-6">
              Everything a freelancer needs.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
                Nothing they don't.
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed mb-10">
              Stop juggling 5 tools with 5 logins and 5 invoices. GetSoloDesk replaces your CRM, proposal tool, timer, invoicing, and portfolio builder — in one clean workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all group shadow-lg">
                Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/15 text-white/80 rounded-xl font-semibold text-sm hover:bg-white/5 hover:text-white transition-all">
                See pricing
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT GRID — Bento-style ═══ */}
      <section className="bg-white py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">The Suite</p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ten products. One subscription.</h2>
          </div>

          {/* Featured row — 2 big cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {products.slice(0, 2).map((p) => (
              <Link
                key={p.href}
                to={p.href}
                className="group relative bg-slate-50 rounded-2xl border border-slate-200 p-7 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all overflow-hidden"
              >
                {/* Accent glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: p.color }} />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}12` }}>
                      <p.icon size={20} style={{ color: p.color }} />
                    </div>
                    {p.tag && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: `${p.color}12`, color: p.color }}>
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    {p.title}
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-500" />
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-sm">{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Rest — 4-col compact grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(2).map((p) => (
              <Link
                key={p.href}
                to={p.href}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${p.color}10` }}>
                    <p.icon size={17} style={{ color: p.color }} />
                  </div>
                  {p.tag && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${p.color}12`, color: p.color }}>
                      {p.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CAPABILITIES — Two-column with checks ═══ */}
      <section className="bg-slate-50 py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Built-in</p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                Plus everything under the hood
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Details that make the whole platform greater than the sum of its parts. No add-ons, no upsells — it's all included.
              </p>
              <Link to={cta} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group">
                Try it free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {capabilities.map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={11} className="text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700 leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="bg-white py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Why switch</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-12">
            Replace your entire tool stack
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="rounded-2xl border border-slate-200 p-6 text-left bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-wider text-red-500/70 mb-4">Before GetSoloDesk</p>
              <div className="space-y-3">
                {['Trello / Notion for tracking', 'Google Docs for proposals', 'Toggl for time tracking', 'Wave for invoicing', 'Squarespace for portfolio'].map((t) => (
                  <div key={t} className="flex items-center gap-2.5 text-sm text-slate-500">
                    <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-300">✕</span>
                    {t}
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-200 mt-3">
                  <p className="text-xs text-slate-400">5 tools · 5 logins · ~$45/mo</p>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border-2 border-emerald-200 p-6 text-left bg-emerald-50/30">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4">With GetSoloDesk</p>
              <div className="space-y-3">
                {['CRM + Pipeline + Follow-ups', 'AI Proposals + Templates', 'One-click time tracking', 'Invoice from tracked time', 'Portfolio + Link in Bio'].map((t) => (
                  <div key={t} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </div>
                    {t}
                  </div>
                ))}
                <div className="pt-3 border-t border-emerald-200 mt-3">
                  <p className="text-xs text-emerald-700 font-bold">1 platform · 1 login · Free to start</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 py-16 lg:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            One platform. Zero compromises.
          </h2>
          <p className="text-slate-400 mb-8">Free forever. No credit card needed.</p>
          <Link
            to={cta}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all shadow-xl group"
          >
            Get Started Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Features;
