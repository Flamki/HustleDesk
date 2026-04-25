import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, CreditCard, Globe, FileCheck, Repeat, Send, Clock, Shield, BarChart3 } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const InvoiceGenerator: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=invoice-generator')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Free Invoice Generator for Freelancers"
        description="Create professional invoices in seconds. Auto-calculate from tracked time, accept payments via Stripe, and track payment status — all built into your CRM."
        path="/invoice-generator"
        keywords={['freelance invoice generator', 'free invoice maker', 'invoice generator for freelancers', 'stripe invoicing for freelancers']}
      />

      {/* ═══ HERO — Invoice mockup ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 mb-6">
                <Receipt size={12} className="text-green-600" />
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Invoicing</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Track time.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                  Send invoices.
                </span><br />
                Get paid.
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Your time entries auto-generate line items. Add your branding, set payment terms, and send professional invoices — with Stripe checkout built in.
              </p>
              <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all group">
                Start Invoicing Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Invoice preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 lg:p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-2xl font-bold text-slate-900">INVOICE</p>
                  <p className="text-sm text-slate-400 mt-1">#INV-0042</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">Pending</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><p className="text-slate-400 text-xs">From</p><p className="font-semibold text-slate-900">Alex Chen</p></div>
                <div><p className="text-slate-400 text-xs">To</p><p className="font-semibold text-slate-900">Acme Corp</p></div>
                <div><p className="text-slate-400 text-xs">Date</p><p className="text-slate-700">April 24, 2026</p></div>
                <div><p className="text-slate-400 text-xs">Due</p><p className="text-slate-700">May 8, 2026</p></div>
              </div>
              <table className="w-full text-sm mb-6">
                <thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-slate-400 text-xs">Item</th><th className="text-right py-2 text-slate-400 text-xs">Hours</th><th className="text-right py-2 text-slate-400 text-xs">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-2.5 text-slate-700">Homepage redesign</td><td className="text-right text-slate-600">8h</td><td className="text-right font-semibold">$600</td></tr>
                  <tr><td className="py-2.5 text-slate-700">Mobile responsive</td><td className="text-right text-slate-600">4h</td><td className="text-right font-semibold">$300</td></tr>
                  <tr><td className="py-2.5 text-slate-700">QA & revisions</td><td className="text-right text-slate-600">2h</td><td className="text-right font-semibold">$150</td></tr>
                </tbody>
              </table>
              <div className="flex justify-end border-t border-slate-200 pt-3">
                <div className="text-right"><p className="text-xs text-slate-400">Total</p><p className="text-2xl font-bold text-green-600">$1,050.00</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FLOW ═══ */}
      <section className="bg-green-600 py-16">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center text-white">
          {[{ n: '01', t: 'Track Time', d: 'Timer auto-logs hours per project' }, { n: '02', t: 'Generate Invoice', d: 'One click creates itemized invoice' }, { n: '03', t: 'Get Paid via Stripe', d: 'Client pays with card, UPI, or wallet' }].map((s) => (
            <div key={s.n}><p className="text-4xl font-bold text-green-200/50">{s.n}</p><p className="text-lg font-bold mt-2">{s.t}</p><p className="text-green-100/60 text-sm mt-1">{s.d}</p></div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {[
            { icon: CreditCard, t: 'Stripe Checkout', d: 'Clients pay with one click. Cards, wallets, UPI supported.' },
            { icon: Clock, t: 'Auto From Time Entries', d: 'Line items generated from your tracked sessions.' },
            { icon: Repeat, t: 'Recurring Invoices', d: 'Set up monthly retainers on autopilot.' },
            { icon: Globe, t: 'Multi-Currency', d: 'Invoice in USD, EUR, GBP, INR, and more.' },
            { icon: FileCheck, t: 'Professional Templates', d: 'Branded invoices with your logo and colors.' },
            { icon: BarChart3, t: 'Payment Tracking', d: 'See paid, pending, and overdue at a glance.' },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 hover:border-green-200 hover:bg-green-50/30 transition-all group">
              <f.icon size={20} className="text-green-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">{f.t}</h3>
              <p className="text-sm text-slate-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stop chasing payments.</h2>
          <p className="text-green-100/60 mb-8">Professional invoices with built-in Stripe checkout.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-green-700 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Start Invoicing <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default InvoiceGenerator;
