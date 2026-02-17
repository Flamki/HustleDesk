
import React from 'react';
import { Search, Save, Wand2, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Workflow: React.FC = () => {
  return (
    <section id="workflow" className="py-32 bg-slate-950 text-white relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-400 font-bold tracking-wider uppercase text-sm mb-3">Workflow</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                From "Job Found" to "Paid".
            </h3>
            <p className="text-lg text-slate-400">
                A streamlined process designed to help you focus on clients, not admin.
            </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Steps List */}
            <div className="space-y-8 relative">
                {/* Connecting Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800 hidden lg:block"></div>

                {/* Step 1 */}
                <div className="relative flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg relative z-10 group-hover:border-indigo-500/50 group-hover:bg-slate-800 transition-all duration-300">
                        <Search className="text-indigo-400" size={24} />
                    </div>
                    <div className="pt-2">
                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Find Opportunities</h4>
                        <p className="text-slate-400 leading-relaxed">
                            Browse your favorite platforms. When you see a good fit, copy the link or text.
                        </p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg relative z-10 group-hover:border-teal-500/50 group-hover:bg-slate-800 transition-all duration-300">
                        <Save className="text-teal-400" size={24} />
                    </div>
                    <div className="pt-2">
                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">Save Lead to Pipeline</h4>
                        <p className="text-slate-400 leading-relaxed">
                            One click to capture details. We automatically extract budget, client info, and skills.
                        </p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 border border-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-900/20 relative z-10 scale-110">
                        <Wand2 className="text-white" size={24} />
                    </div>
                    <div className="pt-2">
                        <h4 className="text-xl font-bold text-white mb-2">AI Writes the Pitch</h4>
                        <p className="text-indigo-100 leading-relaxed">
                            Our AI analyzes the job description and your profile to generate a hyper-personalized proposal in seconds.
                        </p>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg relative z-10 group-hover:border-amber-500/50 group-hover:bg-slate-800 transition-all duration-300">
                        <Trophy className="text-amber-400" size={24} />
                    </div>
                    <div className="pt-2">
                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">Follow-up & Win Clients</h4>
                        <p className="text-slate-400 leading-relaxed">
                            Get reminded to follow up. Move deals through your pipeline until the money hits your bank.
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual */}
            <div className="relative lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0 perspective-1000">
                {/* Glow */}
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                
                {/* Card Stack Animation */}
                <div className="relative w-full max-w-md">
                    
                    {/* Background Card (Blurred) */}
                    <div className="absolute top-0 left-4 w-full h-full bg-slate-800/50 rounded-2xl border border-slate-700/50 transform scale-90 -translate-y-8 blur-sm"></div>

                    {/* Main UI Card */}
                    <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                    <Wand2 size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">AI Proposal</div>
                                    <div className="text-xs text-slate-400">Generated just now</div>
                                </div>
                            </div>
                            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                                98% Match
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            <div className="h-2 w-1/3 bg-slate-700 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                                <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                                <div className="h-2 w-3/4 bg-slate-800 rounded-full"></div>
                            </div>
                            
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
                                <span className="text-indigo-400 font-bold">@Client</span>, I noticed you need a <span className="text-white font-semibold">React Expert</span>. 
                                I have 4 years of experience building similar dashboards...
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                                    Copy to Clipboard
                                </button>
                                <button className="flex-1 py-3 bg-slate-800 text-white text-sm font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                                    Regenerate
                                </button>
                            </div>
                        </div>

                        {/* Success Popover (Floating) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform scale-0 animate-in zoom-in slide-in-from-bottom-4 duration-500 delay-1000 fill-mode-forwards">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">Proposal Ready!</div>
                                <div className="text-xs text-slate-500">Saved 15 minutes</div>
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
