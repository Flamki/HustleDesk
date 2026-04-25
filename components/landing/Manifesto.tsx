
import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Check,
  ArrowRight,
  Zap,
} from 'lucide-react';

const painPoints = [
  "Scattered notes across Notion, Excel & sticky notes",
  "Forgetting to follow up — losing $1,000s silently",
  "Writer's block on every single proposal",
  "Zero visibility into your actual revenue",
];

const gainPoints = [
  "One command center for every opportunity",
  "Smart reminders — never miss a deal again",
  "AI writes winning proposals in 5 seconds",
  "Live dashboards that track your growth",
];

export const Manifesto: React.FC = () => {
  const startFreePath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=landing_manifesto')}`;

  return (
    <section id="why" className="relative overflow-hidden">
      {/* Dark immersive background */}
      <div className="bg-[#0a0a1a] py-24 lg:py-32">

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/[0.04] rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.06] rounded-full blur-[150px]"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Header */}
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">The Upgrade</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white mb-5 tracking-tight leading-[1.1]">
              Stop freelancing like it's<br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-orange-400">
                2015.
              </span>
            </h2>
            <p className="text-base md:text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
              The difference between struggling freelancers and thriving ones isn't talent — it's systems.
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-0 relative max-w-5xl mx-auto">

            {/* VS Badge (center) */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-indigo-500 rounded-2xl blur-md opacity-60"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-[#0a0a1a] border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-black text-white tracking-wider">VS</span>
                </div>
              </div>
            </div>

            {/* ❌ WITHOUT — The old way */}
            <div className="relative">
              <div className="h-full bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-3xl md:rounded-r-none p-8 md:p-10 lg:p-12">

                {/* Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/10 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  <span className="text-xs font-bold text-red-400/80 uppercase tracking-wider">Without GetSoloDesk</span>
                </div>

                <div className="space-y-4">
                  {painPoints.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3.5 items-center group"
                    >
                      <div className="min-w-[32px] h-8 rounded-lg bg-red-500/[0.07] flex items-center justify-center group-hover:bg-red-500/[0.12] transition-colors">
                        <X size={14} className="text-red-400/70" />
                      </div>
                      <p className="text-white/40 text-[15px] leading-relaxed group-hover:text-white/55 transition-colors line-through decoration-white/10">{item}</p>
                    </div>
                  ))}
                </div>

                {/* Bottom stat */}
                <div className="mt-10 pt-8 border-t border-white/[0.04]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-red-400/60">73%</span>
                    <span className="text-xs text-white/25 font-medium">of freelancers quit within 2 years</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ WITH — The new way */}
            <div className="relative group mt-4 md:mt-0">
              {/* Animated gradient border glow */}
              <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/40 via-teal-500/20 to-purple-500/40 rounded-3xl md:rounded-l-none opacity-60 group-hover:opacity-100 transition-opacity duration-700 blur-[1px]"></div>

              <div className="relative h-full bg-gradient-to-br from-[#0f0f2a] to-[#0a0a1a] backdrop-blur-sm border border-white/[0.08] rounded-3xl md:rounded-l-none p-8 md:p-10 lg:p-12 overflow-hidden">

                {/* Decorative orb */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/[0.07] rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4"></div>

                <div className="relative z-10">
                  {/* Tag */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 mb-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">With GetSoloDesk</span>
                  </div>

                  <div className="space-y-4">
                    {gainPoints.map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-3.5 items-center group/item"
                      >
                        <div className="min-w-[32px] h-8 rounded-lg bg-emerald-500/[0.08] flex items-center justify-center group-hover/item:bg-emerald-500/[0.15] transition-colors">
                          <Check size={14} className="text-emerald-400" />
                        </div>
                        <p className="text-white/70 text-[15px] leading-relaxed group-hover/item:text-white/90 transition-colors font-medium">{item}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bottom CTA */}
                  <div className="mt-10 pt-8 border-t border-white/[0.06]">
                    <Link
                      to={startFreePath}
                      className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-white/10 group/cta"
                    >
                      Make the switch — it's free
                      <ArrowRight size={14} className="group-hover/cta:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
