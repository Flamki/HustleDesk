import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Kanban,
  Bell,
  Users,
  BarChart3,
  Bot,
  Target,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const pipeline = [
  { stage: 'Saved', count: 24, color: '#94a3b8', width: '100%' },
  { stage: 'Applied', count: 18, color: '#6366f1', width: '75%' },
  { stage: 'Replied', count: 9, color: '#8b5cf6', width: '37.5%' },
  { stage: 'Won', count: 4, color: '#10b981', width: '16.7%' },
];

export const FreelancerCrm: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=freelancer-crm')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Best CRM for Freelancers — Free"
        description="The only CRM built for solo freelancers. Track jobs, manage clients, automate follow-ups, and get AI-powered insights — completely free."
        path="/freelancer-crm"
        keywords={['freelancer crm', 'best crm for freelancers', 'crm for freelancers free', 'freelance client management software']}
      />

      {/* ═══ HERO — Split layout with live funnel ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Freelancer CRM</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                The CRM that<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  pays for itself.
                </span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Enterprise CRMs weren't built for you. Spreadsheets weren't either. GetSoloDesk is the sweet spot — a lightweight command center designed for solo freelancers who want to win more and stress less.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all group">
                  Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/features" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-300 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all">
                  See All Features
                </Link>
              </div>
            </div>

            {/* Right — Live Pipeline Funnel Visualization */}
            <div className="relative">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-bold text-slate-900">Your Pipeline</p>
                  <span className="text-xs text-slate-400">Last 30 days</span>
                </div>
                <div className="space-y-4">
                  {pipeline.map((p) => (
                    <div key={p.stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-slate-700">{p.stage}</span>
                        <span className="text-sm font-bold" style={{ color: p.color }}>{p.count}</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: p.width, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Win Rate</p>
                    <p className="text-2xl font-bold text-emerald-600">22.2%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">$8,450</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Avg Deal</p>
                    <p className="text-2xl font-bold text-slate-900">$2,112</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BEFORE / AFTER — The transformation story ═══ */}
      <section className="bg-[#0a0a1a] py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[150px] -translate-y-1/2" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              What changes when you switch
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-red-400/60 uppercase tracking-widest mb-4">Without a CRM</p>
              {[
                'Jobs tracked in 3 different spreadsheets',
                'Missed follow-ups = lost $1,000+ deals',
                'No idea which platform brings the most revenue',
                '"What was that client\'s email again?"',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <XCircle size={16} className="text-red-400/50 mt-0.5 shrink-0" />
                  <span className="text-sm text-white/40 leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
            {/* After */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest mb-4">With GetSoloDesk</p>
              {[
                'Every opportunity visible in one Kanban board',
                'AI reminds you to follow up at the perfect time',
                'Per-platform analytics show your winning channels',
                'Full client history — contacts, notes, revenue',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.1]">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-white/70 leading-relaxed font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — Staggered cards, not a grid ═══ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Built for how freelancers actually work</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">Every feature exists because a freelancer needed it. No enterprise bloat.</p>
          </div>

          {/* Feature rows — alternating layout */}
          {[
            { icon: Kanban, title: 'Visual Job Pipeline', desc: 'Track every opportunity from Saved → Applied → Replied → Won. Drag-and-drop Kanban board designed for the freelance workflow. Filter by platform, status, or date.', align: 'left' },
            { icon: Bell, title: 'Smart Follow-Up Engine', desc: 'Automated reminders trigger based on deal stage and days since last contact. The AI learns your timing patterns and suggests the optimal follow-up moment.', align: 'right' },
            { icon: Users, title: 'Client Relationship Hub', desc: 'Full contact history, project context, and health scores for every client. See revenue per client, communication timeline, and relationship strength at a glance.', align: 'left' },
            { icon: BarChart3, title: 'Per-Platform Analytics', desc: 'See your win rate on Upwork, Fiverr, LinkedIn, and direct outreach. Identify which platforms bring the most revenue and where to focus your energy.', align: 'right' },
            { icon: Bot, title: 'AI Agent Coach', desc: 'Your personal AI agent learns your patterns, identifies strengths, and coaches you to improve. It analyzes wins and losses to give actionable insights.', align: 'left' },
            { icon: Target, title: 'Revenue Goals', desc: 'Set monthly revenue targets, track progress in real-time, and visualize your growth trajectory. Stay motivated with streaks and milestone celebrations.', align: 'right' },
          ].map((f, i) => (
            <div key={i} className={`flex flex-col md:flex-row ${f.align === 'right' ? 'md:flex-row-reverse' : ''} items-start gap-8 mb-16 last:mb-0`}>
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center">
                  <f.icon size={24} className="text-emerald-600" />
                </div>
              </div>
              <div className={`${f.align === 'right' ? 'md:text-right' : ''}`}>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-lg">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Stop losing deals to disorganization.
          </h2>
          <p className="text-emerald-100/70 mb-8 max-w-lg mx-auto">
            Free forever. No credit card. Set up in 2 minutes.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg group">
            Get Started Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default FreelancerCrm;
