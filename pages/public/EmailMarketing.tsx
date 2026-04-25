import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Send, Users, BarChart3, Sparkles, Target, Clock, Zap, PenTool } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const EmailMarketing: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=email-marketing')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Email Marketing for Freelancers"
        description="Nurture leads, send follow-ups, and win repeat clients with built-in email marketing. Connected to your CRM — no separate tools needed."
        path="/email-marketing"
        keywords={['freelancer email marketing', 'email marketing for freelancers', 'freelance follow-up emails', 'client nurture emails']}
      />

      {/* ═══ HERO — Split with email mockup ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-200 mb-6">
                <Mail size={12} className="text-fuchsia-600" />
                <span className="text-xs font-bold text-fuchsia-700 uppercase tracking-wider">Email Marketing</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Turn cold leads<br />into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-500">
                  warm clients.
                </span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Your CRM knows when to follow up. Your email tool sends the right message at the right time. No more forgetting, no more lost leads.
              </p>
              <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-fuchsia-600 text-white rounded-xl font-bold text-sm hover:bg-fuchsia-700 transition-all group">
                Start Email Marketing <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Email mockup */}
            <div className="space-y-3">
              {[
                { time: 'Day 1', subject: 'Following up on your project', status: 'Sent', statusColor: 'emerald', rate: '68% open rate' },
                { time: 'Day 3', subject: 'Quick question about timeline', status: 'Opened', statusColor: 'blue', rate: 'Clicked link' },
                { time: 'Day 7', subject: 'Last chance — special rate expires', status: 'Replied ✓', statusColor: 'emerald', rate: 'Converted!' },
              ].map((e, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-all ${i === 2 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">{e.time}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      e.statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>{e.status}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{e.subject}</p>
                  <p className="text-xs text-slate-400">{e.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KEY DIFFERENCE ═══ */}
      <section className="bg-fuchsia-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Not another Mailchimp.</h2>
          <p className="text-fuchsia-100/60 max-w-lg mx-auto">This is email marketing connected to your CRM. Emails trigger based on deal stages, client behavior, and follow-up schedules. It's automated nurturing, not newsletter blasting.</p>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock, t: 'Automated Sequences', d: 'Set up drip campaigns that nurture leads on autopilot.' },
            { icon: Target, t: 'CRM-Triggered Sends', d: 'Emails fire based on deal stage changes and follow-up dates.' },
            { icon: BarChart3, t: 'Open & Click Tracking', d: 'See who opens, clicks, and converts. Data-driven follow-ups.' },
            { icon: Sparkles, t: 'AI Subject Lines', d: 'AI writes attention-grabbing subjects based on your best performers.' },
            { icon: PenTool, t: 'Template Builder', d: 'Branded email templates you can customize and reuse.' },
            { icon: Users, t: 'Smart Segmentation', d: 'Segment by client type, deal value, platform, or engagement.' },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 hover:border-fuchsia-200 hover:bg-fuchsia-50/30 transition-all">
              <f.icon size={20} className="text-fuchsia-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">{f.t}</h3>
              <p className="text-sm text-slate-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-fuchsia-600 to-pink-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Every lead deserves a follow-up.</h2>
          <p className="text-fuchsia-100/60 mb-8">Automated emails connected to your CRM. Free to start.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-fuchsia-700 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default EmailMarketing;
