
import React from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        name: "Marcus J.",
        role: "Full Stack Developer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        quote: "I doubled my interview rate in two weeks. The AI proposals are actually good—not robotic like ChatGPT. It picks up nuances in the job post I missed.",
        metric: "Win rate: +40%"
    },
    {
        name: "Elena R.",
        role: "UX Designer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
        quote: "Before GetSoloDesk, my 'CRM' was a messy Notion page. Now I wake up, check my dashboard, and know exactly who to email. It feels like I have a superpower.",
        metric: "Saved: 5h/week"
    },
    {
        name: "David K.",
        role: "Copywriter",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        quote: "The follow-up reminders alone are worth the subscription. I closed a $3k retainer deal just because GetSoloDesk pinged me to check in on a cold lead.",
        metric: "Revenue: +$3k/mo"
    }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Freelancers are getting <span className="text-indigo-600 dark:text-indigo-400">results.</span>
            </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
                    <div className="mb-6 text-indigo-200 dark:text-indigo-900">
                        <Quote size={40} />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-8 flex-1 leading-relaxed font-medium">
                        "{t.quote}"
                    </p>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img loading="lazy" decoding="async" src={t.image} alt={t.name} className="w-10 h-10 rounded-full bg-slate-100" />
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                            </div>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                            {t.metric}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};


