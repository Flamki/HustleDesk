import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Link2, Eye, Shield, Smartphone, Zap, MessageSquare } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const ClientPortal: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=client-portal')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Client Portal for Freelancers"
        description="Share project progress with clients through beautiful, branded portal pages. Build trust and look professional."
        path="/client-portal"
        keywords={['client portal for freelancers', 'freelancer client dashboard', 'share project progress with clients']}
      />

      {/* ═══ HERO — Centered with portal mockup below ═══ */}
      <section className="bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 mb-6">
            <Zap size={12} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Client Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Stop hearing<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              "Any updates?"
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-8">
            Give each client a clean, branded portal where they can see project progress, download deliverables, and stay informed — without you sending another email.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all group">
            Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Portal mockup */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
              <div className="flex-1 text-center"><span className="text-[10px] text-slate-400 bg-white px-4 py-1 rounded-full border border-slate-200">getsolodesk.com/share/time-entry/abc123</span></div>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-lg font-bold text-slate-900">Website Redesign — Session Report</p>
                  <p className="text-sm text-slate-500 mt-1">Shared by Alex Chen • April 24, 2026</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[{ label: 'Duration', value: '3h 42m' }, { label: 'Tasks', value: '8 completed' }, { label: 'Billable', value: '$277.50' }].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {['Homepage hero section redesign', 'Responsive navigation implementation', 'Contact form with validation'].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
                    <span className="text-sm text-slate-700">{t}</span>
                    <span className="ml-auto text-xs text-slate-400">45m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY — Vertical timeline ═══ */}
      <section className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-16">How it builds trust</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
            {[
              { icon: Link2, title: 'Generate a secure link', desc: 'One click creates a read-only share link for any time entry or project. Set expiration and control visibility.' },
              { icon: Eye, title: 'Client sees real progress', desc: 'Professional, branded pages show duration, tasks completed, and billable amount. No login required.' },
              { icon: Shield, title: 'You stay in control', desc: 'Revoke access anytime. Toggle task descriptions on/off. Track when clients view the page.' },
              { icon: MessageSquare, title: 'No more "any updates?" emails', desc: 'Clients self-serve their progress updates. You focus on doing great work instead of writing status emails.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-6 mb-12 last:mb-0 relative">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 z-10">
                  <s.icon size={18} className="text-amber-600" />
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-amber-500 to-orange-500 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Look professional. Build trust.</h2>
          <p className="text-amber-100/70 mb-8">Freelancers with client portals have 40% higher retention.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-amber-700 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Get Started Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default ClientPortal;
