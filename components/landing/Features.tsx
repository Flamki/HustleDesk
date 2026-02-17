
import React from 'react';
import { PenTool, LayoutDashboard, BarChart3, Bell, Sparkles, Zap } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto px-6 text-center mb-20">
            <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-sm mb-3">Features</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Everything you need to <br/> win more freelance clients.
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400">
                We've stripped away the complexity of agency CRMs and built a streamlined operating system for freelancers.
            </p>
        </div>

        {/* Bento Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Feature 1: AI Proposal (Large - 4 cols) */}
                <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-100 opacity-50"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-6">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <PenTool size={28} />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">AI Proposal Writer</h4>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Write winning proposals in seconds.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                <Sparkles size={16} /> Optimized for Upwork & LinkedIn
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full">
                            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm relative">
                                <div className="flex gap-2 mb-3">
                                    <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-2 w-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-3 w-[90%] bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-3 w-[95%] bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-lg shadow-indigo-500/20">
                                        <Zap size={12} /> Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2: Pipeline (Tall - 2 cols) */}
                <div className="md:col-span-2 md:row-span-2 bg-slate-900 dark:bg-black text-white rounded-[32px] p-8 border border-slate-800 relative overflow-hidden flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10 mb-8">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
                            <LayoutDashboard size={28} className="text-white" />
                        </div>
                        <h4 className="text-2xl font-bold mb-3">Visual Pipeline</h4>
                        <p className="text-slate-400">
                            See the health of your business at a glance. Track every lead from "New" to "Won".
                        </p>
                    </div>

                    <div className="relative flex-1 mt-4 space-y-3">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                            <span className="text-sm font-medium">Applied</span>
                            <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">12</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                            <span className="text-sm font-medium">Interview</span>
                            <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded">4</span>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-green-500/30 flex items-center justify-between shadow-lg shadow-green-900/20">
                            <span className="text-sm font-bold text-white">Won</span>
                            <span className="bg-green-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">3</span>
                        </div>
                    </div>
                </div>

                {/* Feature 3: Analytics (Small - 2 cols) */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-colors group">
                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Revenue Tracking</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Visualize your income growth and see which platforms pay best.
                    </p>
                </div>

                {/* Feature 4: Reminders (Small - 2 cols) */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-colors group">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Bell size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Smart Follow-ups</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Never forget to follow up again.
                    </p>
                </div>

            </div>
        </div>
    </section>
  );
};
