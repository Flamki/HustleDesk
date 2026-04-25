import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileSignature, Shield, Sparkles, FileText, Clock, Download, Edit3, Lock, Globe } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const ContractBuilder: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=contract-builder')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Free Contract Builder for Freelancers"
        description="Create legally-sound freelance contracts in minutes. AI-powered templates, e-signatures, and automatic project terms — protect yourself and look professional."
        path="/contract-builder"
        keywords={['freelance contract builder', 'freelancer contract template', 'free contract generator', 'freelance agreement maker']}
      />

      {/* ═══ HERO — Centered with contract preview ═══ */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-6">
            <FileSignature size={12} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contracts</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Never start a project<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">
              without a contract.
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-8">
            AI generates project-specific contracts from your job details. Professional templates, customizable clauses, and digital signatures — protecting your work has never been easier.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all group">
            Create Contracts Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Contract mockup */}
        <div className="max-w-3xl mx-auto px-4 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
              <div className="flex-1 text-center"><span className="text-[10px] text-slate-400 font-mono">contract-acme-website-redesign.pdf</span></div>
            </div>
            <div className="p-8 md:p-10">
              <h2 className="text-xl font-bold text-slate-900 mb-1">FREELANCE SERVICE AGREEMENT</h2>
              <p className="text-sm text-slate-400 mb-6">Generated April 24, 2026</p>
              <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                <p><strong className="text-slate-900">1. Scope of Work.</strong> Contractor agrees to deliver a complete website redesign for Acme Corp, including homepage, 4 inner pages, mobile responsive design, and 2 rounds of revisions.</p>
                <p><strong className="text-slate-900">2. Compensation.</strong> Client shall pay Contractor a total of $2,400 USD, payable 50% upfront and 50% upon completion.</p>
                <p><strong className="text-slate-900">3. Timeline.</strong> Work shall commence on April 28, 2026 and be completed by May 15, 2026.</p>
                <p className="text-slate-400 italic">... 8 more clauses including IP transfer, revisions, and termination</p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8">
                <div><p className="text-xs text-slate-400 mb-2">Contractor</p><p className="font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1 italic">Alex Chen</p></div>
                <div><p className="text-xs text-slate-400 mb-2">Client</p><p className="text-slate-300 border-b-2 border-dashed border-slate-300 inline-block pb-1">Awaiting signature...</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Built for real freelance workflows</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Sparkles, t: 'AI-Generated Clauses', d: 'Contract terms auto-populated from your job details, scope, and pricing.' },
              { icon: FileText, t: 'Professional Templates', d: 'Web development, design, writing, consulting — templates for every niche.' },
              { icon: Edit3, t: 'Full Customization', d: 'Edit every clause. Add your own terms. Make it truly yours.' },
              { icon: Lock, t: 'E-Signatures', d: 'Send for digital signing. Track when clients open and sign.' },
              { icon: Download, t: 'PDF Export', d: 'Download clean PDFs for your records. Print-ready formatting.' },
              { icon: Globe, t: 'Multi-Jurisdiction', d: 'Templates adapted for US, UK, EU, and India freelance law.' },
            ].map((f, i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                <f.icon size={20} className="text-slate-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">{f.t}</h3>
                <p className="text-sm text-slate-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Protect your work. Look professional.</h2>
          <p className="text-slate-400 mb-8">Freelancers with contracts get paid 2x faster.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Create Your First Contract <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default ContractBuilder;
