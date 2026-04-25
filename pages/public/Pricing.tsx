import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, Zap } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const free = [
  'Job pipeline with Kanban board',
  'AI proposal generator (5/day)',
  'Time tracking with timer',
  'Client management',
  'Portfolio builder',
  'Link-in-bio page',
  '36 proven templates',
  'Basic analytics',
];

const pro = [
  'Everything in Free, plus:',
  'Unlimited AI proposals',
  'Advanced analytics & win rates',
  'Priority support',
  'Custom AI training on your data',
  'Early access to new features',
  'Team sharing (coming soon)',
  'API access (coming soon)',
];

export const Pricing: React.FC = () => {
  const freeCta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=pricing-free')}`;
  const proCta = `/login?returnTo=${encodeURIComponent('/app/settings?tab=billing&action=checkout&source=pricing-pro')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Pricing — Free Plan Available"
        description="GetSoloDesk is free for freelancers. Start with all core features. Upgrade only when you need more."
        path="/pricing"
        keywords={['freelancer crm pricing', 'free freelancer tools', 'freelance crm free plan']}
      />

      {/* ═══ HERO ═══ */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-4">
            Simple, fair pricing.
          </h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            Start free with everything you need. Upgrade when your business grows.
          </p>
        </div>
      </section>

      {/* ═══ PRICING CARDS ═══ */}
      <section className="bg-white pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Free</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">$0</span>
                <span className="text-slate-400 ml-1">/forever</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">Everything you need to manage your freelance business.</p>
              <Link to={freeCta} className="block w-full text-center px-6 py-3 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all mb-8">
                Get Started Free
              </Link>
              <div className="space-y-3">
                {free.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-indigo-600" />
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Pro</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">$9</span>
                <span className="text-slate-400 ml-1">/month</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">For freelancers ready to scale their business.</p>
              <Link to={proCta} className="block w-full text-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all mb-8 group">
                <span className="inline-flex items-center gap-2">
                  Upgrade to Pro <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
              <div className="space-y-3">
                {pro.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    <span className={`text-sm ${i === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is the free plan really free?', a: 'Yes. No credit card required. No trial period. Free forever with all core features included.' },
              { q: 'Can I upgrade or downgrade anytime?', a: 'Absolutely. No contracts or lock-in. Switch plans with one click.' },
              { q: 'What payment methods do you accept?', a: 'Razorpay checkout supports international cards, UPI, and digital wallets.' },
              { q: 'Do I need a credit card to start?', a: 'No. Sign up with Google and start using GetSoloDesk in 30 seconds.' },
              { q: 'Is my data safe?', a: 'Yes. Hosted on Supabase with enterprise-grade security, row-level security, and encrypted data at rest.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer text-sm font-bold text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Start free. Upgrade when you're ready.</h2>
          <p className="text-slate-400 mb-8">No credit card. No pressure. Just better freelancing.</p>
          <Link to={freeCta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Get Started Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Pricing;
