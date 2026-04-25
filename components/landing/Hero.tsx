
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';

export const Hero: React.FC = () => {
  const startFreePath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=landing_hero')}`;

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
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
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
            to={startFreePath}
            className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:scale-105 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2"
          >
            Start Free
            <ArrowRight size={20} />
          </Link>
          <a href="#pricing" className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-full font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <PlayCircle size={20} />
            See Pricing
          </a>
        </div>

        {/* Auto-Scrolling Feature Showcase */}
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
                    <div className="ml-4 flex-1 max-w-xs h-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center px-3">
                      <span className="text-[8px] text-slate-400 font-mono">getsolodesk.com/app/dashboard</span>
                    </div>
                </div>

                {/* Infinite Scrolling Screenshots */}
                <div className="aspect-[16/9] bg-slate-950 relative overflow-hidden">
                    <style>{`
                      @keyframes hero-scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                      .hero-scroll-track {
                        display: flex;
                        animation: hero-scroll 30s linear infinite;
                        width: max-content;
                        height: 100%;
                      }
                      .hero-scroll-track:hover {
                        animation-play-state: paused;
                      }
                    `}</style>
                    <div className="hero-scroll-track">
                      {/* First set of images */}
                      {[
                        { src: '/hero-dashboard.png', label: 'Dashboard Overview' },
                        { src: '/hero-proposals.png', label: 'AI Proposal Generator' },
                        { src: '/hero-clients.png', label: 'Client CRM' },
                        { src: '/hero-analytics.png', label: 'Analytics & Insights' },
                        /* Duplicate for seamless loop */
                        { src: '/hero-dashboard.png', label: 'Dashboard Overview' },
                        { src: '/hero-proposals.png', label: 'AI Proposal Generator' },
                        { src: '/hero-clients.png', label: 'Client CRM' },
                        { src: '/hero-analytics.png', label: 'Analytics & Insights' },
                      ].map((item, i) => (
                        <div key={i} className="flex-shrink-0 h-full px-2 first:pl-0" style={{ width: 'calc(100vw * 0.55)' }}>
                          <div className="relative h-full rounded-lg overflow-hidden group/card">
                            <img
                              src={item.src}
                              alt={item.label}
                              className="w-full h-full object-cover object-top"
                              loading={i < 4 ? 'eager' : 'lazy'}
                              decoding="async"
                            />
                            {/* Label overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-12">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                {item.label}
                              </span>
                            </div>
                          </div>
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

