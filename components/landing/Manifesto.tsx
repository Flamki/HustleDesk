
import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Check,
  StickyNote,
  BellOff,
  PenOff,
  EyeOff,
  LayoutDashboard,
  BellRing,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Zap,
} from 'lucide-react';

const painPoints = [
  { icon: StickyNote, text: "Scattered notes in Notion, Excel, and sticky notes" },
  { icon: BellOff, text: "Forgetting to follow up and losing $1,000s" },
  { icon: PenOff, text: "Writer's block staring at blank proposals" },
  { icon: EyeOff, text: "No idea what your actual monthly revenue is" },
];

const gainPoints = [
  { icon: LayoutDashboard, text: "One central command center for every opportunity" },
  { icon: BellRing, text: "Automated reminders so you never miss a deal" },
  { icon: Sparkles, text: "AI drafts winning proposals in 5 seconds" },
  { icon: TrendingUp, text: "Live revenue dashboards to track growth" },
];

export const Manifesto: React.FC = () => {
  const startFreePath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=landing_manifesto')}`;

  return (
    <section id="why" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">

      {/* Background textures */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-800/50 mb-6">
            <Zap size={14} className="text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Level Up</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-5 tracking-tight">
            The Freelancer{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">
              Upgrade
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Most freelancers are stuck in Level 1. GetSoloDesk is the cheat code to get to Level 2.
          </p>
        </div>

        {/* Two-column comparison */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch relative">
          
          {/* VS Badge (center) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center rotate-12 hover:rotate-0 transition-transform duration-300">
              <span className="text-sm font-black text-slate-900 dark:text-white -rotate-12 hover:rotate-0 transition-transform">VS</span>
            </div>
          </div>

          {/* ❌ The Freelancer Trap */}
          <div className="relative group">
            <div className="absolute inset-0 bg-red-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white dark:bg-slate-900 p-8 md:p-10 lg:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 h-full shadow-sm hover:shadow-lg transition-shadow duration-300">
              
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <X size={20} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">The Freelancer Trap</h3>
              </div>
              
              <div className="space-y-5">
                {painPoints.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 transition-colors group/item"
                  >
                    <div className="min-w-[40px] h-10 rounded-xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center group-hover/item:bg-red-100 dark:group-hover/item:bg-red-900/20 transition-colors">
                      <item.icon size={18} className="text-red-400 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decorative strikethrough */}
              <div className="mt-8 flex items-center gap-3 opacity-50">
                <div className="h-px flex-1 bg-red-200 dark:bg-red-900/30"></div>
                <span className="text-xs font-semibold text-red-300 dark:text-red-800 uppercase tracking-wider">Stop losing money</span>
                <div className="h-px flex-1 bg-red-200 dark:bg-red-900/30"></div>
              </div>
            </div>
          </div>

          {/* ✅ The GetSoloDesk Way */}
          <div className="relative group">
            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-500 rounded-[28px] opacity-20 group-hover:opacity-30 blur-sm transition-opacity duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-indigo-900 dark:via-indigo-950 dark:to-purple-950 p-8 md:p-10 lg:p-12 rounded-3xl border border-indigo-400/20 h-full shadow-2xl overflow-hidden">
              
              {/* Decorative orbs */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Check size={20} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">The GetSoloDesk Way</h3>
                  <div className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Recommended</span>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {gainPoints.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/item backdrop-blur-sm"
                    >
                      <div className="min-w-[40px] h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover/item:bg-white/20 transition-colors">
                        <item.icon size={18} className="text-teal-300" />
                      </div>
                      <div>
                        <p className="text-indigo-50 font-medium text-[15px] leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-10">
                  <Link
                    to={startFreePath}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-indigo-700 rounded-full font-bold text-sm hover:bg-indigo-50 hover:scale-105 transition-all shadow-xl shadow-black/20"
                  >
                    Start Free — No Credit Card
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
