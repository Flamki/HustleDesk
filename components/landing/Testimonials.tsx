
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, TrendingUp, ArrowRight, Quote, MessageCircle } from 'lucide-react';

const VALUE_PROPS = [
    {
        icon: Zap,
        title: 'AI proposals in 30 seconds',
        description: 'Paste a job description. Your AI agent writes a personalized, high-converting proposal using your profile, skills, and past wins.',
        metric: 'vs. 30–45 min manually',
    },
    {
        icon: TrendingUp,
        title: 'An agent that learns from you',
        description: 'Every win and loss trains your personal AI. Over time, it learns which tones, skills, and pricing win on each platform.',
        metric: 'Smarter with every outcome',
    },
    {
        icon: Clock,
        title: 'Never forget a follow-up',
        description: 'Automated reminders when a lead goes cold. Set it once — never let a warm lead go cold again.',
        metric: 'Set it and forget it',
    },
];

export const Testimonials: React.FC = () => {
  const ctaPath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=landing_value')}`;

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
              Early Access — Free
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Built for freelancers who <span className="text-indigo-600 dark:text-indigo-400">want to win more.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Stop juggling 10 tabs. One workspace for proposals, clients, time, and follow-ups — powered by an AI agent that gets better the more you use it.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {VALUE_PROPS.map((v, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
                    <div className="mb-6 w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <v.icon size={22} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{v.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 flex-1 leading-relaxed text-sm">
                        {v.description}
                    </p>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {v.metric}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Real Early User Feedback */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 relative overflow-hidden">
            {/* Subtle accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <MessageCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Early User Feedback</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
              </div>

              <div className="mb-6">
                <Quote size={24} className="text-indigo-200 dark:text-indigo-800 mb-3" />
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-medium">
                  "Really helpful for people who work with multiple clients — to manage their day-to-day progress, it is quite good."
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                    F
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Feroz</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Early Access User</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  April 2026
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            to={ctaPath}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 group"
          >
            Try It Free — No Credit Card
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
