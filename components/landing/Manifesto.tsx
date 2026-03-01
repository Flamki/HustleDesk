
import React from 'react';
import { X, Check } from 'lucide-react';

export const Manifesto: React.FC = () => {
  return (
    <section id="why" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            The Freelancer Upgrade
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Most freelancers are stuck in Level 1. GetSoloDesk is the cheat code to get to Level 2.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          
          {/* Old Way */}
          <div className="bg-slate-50 dark:bg-slate-950 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100 transition-opacity">
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold mb-8">
                The Freelancer Trap
            </div>
            
            <div className="space-y-6">
                {[
                    "Scattered notes in Notion, Excel, and sticky notes",
                    "Forgetting to follow up and losing $1,000s",
                    "Writer's block staring at blank proposals",
                    "No idea what your actual monthly revenue is"
                ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <div className="mt-1 min-w-[24px]">
                            <X className="text-red-400" size={24} />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">{item}</p>
                    </div>
                ))}
            </div>
          </div>

          {/* New Way */}
          <div className="bg-indigo-600 dark:bg-indigo-900/20 p-8 md:p-12 rounded-3xl border border-indigo-500 dark:border-indigo-500/30 shadow-2xl relative overflow-hidden">
             {/* Decorative */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

             <div className="relative z-10">
                <div className="inline-block px-4 py-1.5 rounded-full bg-white text-indigo-900 text-sm font-bold mb-8">
                    The GetSoloDesk Way
                </div>
                
                <div className="space-y-6">
                    {[
                        "One central command center for every opportunity",
                        "Automated reminders so you never miss a deal",
                        "AI drafts winning proposals in 5 seconds",
                        "Live revenue dashboards to track growth"
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <div className="mt-1 min-w-[24px] bg-white/20 rounded-full p-0.5">
                                <Check className="text-white" size={20} />
                            </div>
                            <p className="text-indigo-50 font-medium text-lg leading-snug">{item}</p>
                        </div>
                    ))}
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

