
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-blob"
          style={{
            animationDuration: '26s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
        />
        <div
          className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] animate-blob"
          style={{
            animationDuration: '34s',
            animationDelay: '-10s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
        />
        {/* Grid Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            New: Project Management for Freelancers
          </span>
        </div>
        
        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1] max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Never lose a <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">
            freelance client again.
          </span>
        </h1>
        
        {/* Subhead */}
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Track leads, get follow-up reminders, and send AI proposals that win work.
        </p>
        
        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <Link
            to="/signup"
            className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:scale-105 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2"
          >
            Start Free
            <ArrowRight size={20} />
          </Link>
          <button className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-full font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <PlayCircle size={20} />
            Watch Demo
          </button>
        </div>

        {/* 3D Dashboard Mockup */}
        <div className="mt-20 relative w-full max-w-6xl group perspective-1000">
            {/* Glow effect behind */}
            <div className="absolute inset-0 bg-indigo-500/30 blur-[80px] rounded-full transform scale-75 group-hover:bg-teal-500/30 transition-colors duration-1000"></div>
            
            {/* The Dashboard Card - Tilted */}
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out origin-center">
                
                {/* Browser Controls */}
                <div className="h-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className="ml-4 w-64 h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                </div>

                {/* Dashboard Image/Content */}
                <div className="aspect-[16/9] bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                    {/* Abstract Representation of Dashboard */}
                    <div className="p-6 grid grid-cols-4 gap-6 h-full">
                        {/* Sidebar */}
                        <div className="col-span-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-full p-4 space-y-4">
                            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-6"></div>
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                            ))}
                        </div>
                        {/* Main Area */}
                        <div className="col-span-3 space-y-6">
                            {/* Top Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                                        <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-3"></div>
                                        <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Pipeline Board */}
                            <div className="flex gap-4 h-64">
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                                        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-800 h-20"></div>
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-800 h-20"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Floating Overlay Card */}
                    <div className="absolute bottom-10 right-10 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-64 animate-bounce-slow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Offer Accepted</div>
                                <div className="text-[10px] text-slate-500">Just now</div>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[100%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
};

