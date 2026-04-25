import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Sparkles,
  Briefcase,
  LinkIcon,
  LayoutDashboard,
  Users,
  Receipt,
  FileSignature,
  BookOpen,
  Mail,
  Bot,
  Bell,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const products = [
  { icon: LayoutDashboard, title: 'Freelancer CRM', desc: 'Track leads, manage clients, and close deals from one visual pipeline.', href: '/freelancer-crm', color: '#10b981' },
  { icon: Sparkles, title: 'AI Proposals', desc: 'Write winning proposals in seconds. AI learns from your past wins.', href: '/proposal-generator', color: '#8b5cf6' },
  { icon: Clock, title: 'Time Tracking', desc: 'One-click timer with auto rate calculations.', href: '/time-tracking', color: '#3b82f6' },
  { icon: Receipt, title: 'Invoicing', desc: 'Create invoices from tracked time. Get paid via Stripe.', href: '/invoice-generator', color: '#22c55e' },
  { icon: FileSignature, title: 'Contracts', desc: 'AI-generated contracts with e-signatures.', href: '/contract-builder', color: '#475569' },
  { icon: Users, title: 'Client Portal', desc: 'Share progress through branded project pages.', href: '/client-portal', color: '#f59e0b' },
  { icon: Briefcase, title: 'Portfolio', desc: 'Publish a stunning portfolio with analytics.', href: '/portfolio-builder', color: '#f43f5e' },
  { icon: LinkIcon, title: 'Link in Bio', desc: 'One page for all your profiles and CTAs.', href: '/link-in-bio', color: '#0ea5e9' },
  { icon: BookOpen, title: 'Templates', desc: '36+ battle-tested proposal and outreach templates.', href: '/templates', color: '#6366f1' },
  { icon: Mail, title: 'Email Marketing', desc: 'Automated drip campaigns from your CRM.', href: '/email-marketing', color: '#d946ef' },
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

      {/* ═══ HERO — Clean, minimal ═══ */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-12">
          <p className="text-sm font-medium text-slate-400 mb-4">Features</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] max-w-2xl">
            AI agents that work while you sleep
          </h1>
          <p className="text-lg text-slate-500 mt-5 max-w-lg leading-relaxed">
            Three AI agents handle proposals, follow-ups, and coaching — backed by ten products that run your entire freelance business.
          </p>
        </div>
      </section>

      {/* ═══ PRODUCT LIST ═══ */}
      <section className="bg-white pb-16 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-slate-200">
            {products.map((p, i) => (
              <Link
                key={p.href}
                to={p.href}
                className="group flex items-center justify-between py-6 border-b border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${p.color}0a` }}
                  >
                    <p.icon size={18} style={{ color: p.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5 hidden sm:block">{p.desc}</p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI AGENTS ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <p className="text-sm font-medium text-slate-400 mb-4">AI agent architecture</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-10 max-w-xl">
            Three agents. One goal: more wins, less busywork.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Agent 1 */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                <Sparkles size={18} className="text-violet-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Proposal Agent</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Reads the job description, your profile, and past wins — then writes a custom proposal in your tone. You edit and send.
              </p>
            </div>

            {/* Agent 2 */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Bot size={18} className="text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Profile Coach</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Conversational AI that reviews your profile, suggests improvements, and can update your bio, skills, and rates directly.
              </p>
            </div>

            {/* Agent 3 */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                <Bell size={18} className="text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Follow-up Intelligence</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Monitors your pipeline, detects stale leads, and sends timed follow-up reminders so you never lose a deal to silence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY — Simple prose ═══ */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-slate-400 mb-4">Why it matters</p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-6">
              Most freelancers use five tools. None of them talk to each other.
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                You have a CRM in Notion, proposals in Google Docs, timers in Toggl, invoices in Wave, and a portfolio on Squarespace. That's five logins, five bills, and zero intelligence connecting them.
              </p>
              <p>
                GetSoloDesk is different because the AI sees everything. Your Proposal Agent knows your CRM history. Your Follow-up Agent knows which deals are going cold. Your Coach knows which skills to highlight based on what's winning.
              </p>
              <p className="text-slate-900 font-medium">
                That's the difference between a tool stack and an operating system.
              </p>
            </div>
            <Link
              to={cta}
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors group"
            >
              Try it free
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Features;
