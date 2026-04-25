import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Brain,
  Globe,
  Zap,
  FileText,
  Target,
  BarChart3,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const sampleProposal = `Hi Sarah,

I noticed you're looking for a React developer to rebuild your landing page with Webflow integration. With 5 years of experience in React and conversion-focused design, I can deliver a responsive, high-performance page that drives signups.

Here's what I'd include:
• Custom React components with Webflow CMS integration
• Mobile-first responsive design
• Performance optimization (< 2s load time)
• 2 rounds of revisions

Timeline: 5–7 business days
Investment: $650

I've done similar work for 3 SaaS companies this quarter — happy to share examples. When works for a quick call?

Best,
Alex`;

export const ProposalGenerator: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'Pro' | 'Friendly' | 'Bold'>('Pro');
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=proposal-generator')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="AI Proposal Generator for Freelancers"
        description="Generate winning freelance proposals in seconds with AI. Personalized to each job, learns from your wins."
        path="/proposal-generator"
        keywords={['ai proposal generator', 'freelance proposal generator', 'upwork proposal generator', 'ai proposal writer']}
      />

      {/* ═══ HERO — Interactive proposal mockup ═══ */}
      <section className="bg-gradient-to-b from-violet-50 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left — Copy */}
            <div className="lg:pt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 mb-6">
                <Sparkles size={12} className="text-violet-600" />
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">AI-Powered</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                From blank page<br />to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-500">
                  winning proposal
                </span>
                <br />in 5 seconds.
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Paste a job description. Pick your tone. Click generate. Your AI agent writes a tailored, conversion-optimized proposal that sounds like you — because it learned from your wins.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all group">
                  Try It Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right — Interactive Proposal Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-violet-500/5 overflow-hidden">
                {/* Top bar */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-500" />
                    <span className="text-xs font-bold text-slate-700">Generated Proposal</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">284 words</span>
                </div>
                {/* Tone selector */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Tone</span>
                  {(['Pro', 'Friendly', 'Bold'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tone === t
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'text-slate-400 hover:text-slate-600 border border-transparent'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* Proposal content */}
                <div className="px-5 py-4 max-h-[340px] overflow-y-auto">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{sampleProposal}</pre>
                </div>
                {/* Actions */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <span className="text-[10px] text-slate-400">Generated with Fireworks AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 3 steps ═══ */}
      <section className="bg-white py-20 lg:py-28 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight text-center mb-16">
            Three steps. Five seconds.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Paste the job', desc: 'Drop in the job description from Upwork, Fiverr, or any platform. The AI reads the requirements, budget, and context.' },
              { step: '02', title: 'Pick your tone', desc: 'Choose Professional, Friendly, or Bold. Set length to Short, Medium, or Long. The AI adapts to your style.' },
              { step: '03', title: 'Copy & send', desc: 'Get a tailored proposal in seconds. Edit if you want, then copy-paste directly into the platform. Done.' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <span className="text-6xl font-black text-violet-100 absolute -top-2 left-0">{s.step}</span>
                <div className="pt-12">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY IT WORKS — Social proof section ═══ */}
      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-6">
                It gets smarter<br />every time you win.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                The AI doesn't just generate generic text. It studies your successful proposals — the tone, structure, pricing, and positioning that actually gets responses. Every win teaches it to write better proposals for you.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Brain, text: 'Learns from your wins and losses' },
                  { icon: Globe, text: 'Works for Upwork, Fiverr, LinkedIn, direct clients' },
                  { icon: Target, text: 'Highlights your strongest skills automatically' },
                  { icon: BarChart3, text: 'Suggests optimal pricing based on win data' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <f.icon size={14} className="text-violet-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '5s', label: 'Average generation time', color: 'violet' },
                { value: '3x', label: 'Higher response rate', color: 'purple' },
                { value: '36+', label: 'Proven templates', color: 'indigo' },
                { value: '10x', label: 'Faster than manual writing', color: 'fuchsia' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow">
                  <p className="text-3xl font-bold text-violet-600">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-violet-600 to-purple-700 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Write proposals that actually get responses.
          </h2>
          <p className="text-violet-100/60 mb-8 max-w-lg mx-auto">
            Let AI do the heavy lifting while you focus on doing great work.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-violet-700 rounded-xl font-bold text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg group">
            Try It Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default ProposalGenerator;
