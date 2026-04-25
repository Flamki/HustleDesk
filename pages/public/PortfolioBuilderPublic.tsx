import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Palette, Globe, Smartphone, BarChart3, Layers, Type, Image, Blocks } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const PortfolioBuilderPublic: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=portfolio-builder')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Free Portfolio Builder for Freelancers"
        description="Build a stunning freelance portfolio website in minutes. Professional templates, full customization, instant publishing."
        path="/portfolio-builder"
        noindex={true}
        keywords={['freelancer portfolio builder', 'free portfolio website builder', 'online portfolio for freelancers']}
      />

      {/* ═══ HERO — Full-width dark with floating cards ═══ */}
      <section className="bg-[#0a0a1a] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/[0.04] rounded-full blur-[150px]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
            <Palette size={12} className="text-rose-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">Portfolio Builder</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Your work speaks.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">
              Let it be heard.
            </span>
          </h1>
          <p className="text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed mb-10">
            Build a professional portfolio site in 5 minutes. No coding, no design skills, no hosting fees. Just your best work, beautifully presented.
          </p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Build Your Portfolio <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Floating capability cards */}
        <div className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Layout, label: 'Templates' },
            { icon: Type, label: 'Typography' },
            { icon: Image, label: 'Rich Media' },
            { icon: Blocks, label: 'Modular' },
          ].map((c, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center hover:bg-white/[0.06] transition-colors">
              <c.icon size={20} className="text-rose-400 mx-auto mb-2" />
              <span className="text-xs font-semibold text-white/50">{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES — Bento grid ═══ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-4">Everything to showcase your craft</h2>
          <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">No compromises. Full creative control.</p>

          {/* Bento layout */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card */}
            <div className="md:col-span-2 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-8">
              <Layout size={28} className="text-rose-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Professional Templates</h3>
              <p className="text-slate-500 leading-relaxed max-w-md">
                Choose from templates designed for developers, designers, writers, and creatives. Every template is conversion-optimized to turn visitors into clients.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <Globe size={24} className="text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Instant Publishing</h3>
              <p className="text-sm text-slate-500">Your unique URL with SSL. Live in minutes.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <Smartphone size={24} className="text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Mobile Responsive</h3>
              <p className="text-sm text-slate-500">Looks perfect on every device, automatically.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <BarChart3 size={24} className="text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Built-In Analytics</h3>
              <p className="text-sm text-slate-500">Track views, engagement, and traffic sources.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <Layers size={24} className="text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">CRM Connected</h3>
              <p className="text-sm text-slate-500">Add projects from completed jobs. No double entry.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-rose-500 to-pink-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Your best work deserves a stage.</h2>
          <p className="text-rose-100/60 mb-8">Free. No coding. Publish in 5 minutes.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-rose-600 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Build It Now <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default PortfolioBuilderPublic;
