
import React from 'react';
import { Link } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';
import { Sun, Moon, ArrowLeft, Rocket, BarChart3, Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import { BrandLogo } from '../components/brand/BrandLogo';

export const SignupPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <SEO
        title="Sign Up"
        description="Create your GetSoloDesk account."
        path="/signup"
        noindex
      />
      <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-300">
        
        {/* Left Column: Brand & Value (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 text-white overflow-hidden flex-col justify-between p-16 z-10">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center gap-3">
                <BrandLogo className="h-8 w-auto" tone="inverse" />
            </div>

            {/* Central Content */}
            <div className="relative z-10 max-w-lg">
                <h2 className="text-5xl font-bold leading-[1.1] mb-6 tracking-tight">
                    Your Freelance <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">Command Center.</span>
                </h2>
                
                <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                    Stop juggling spreadsheets and writer's block. Join the top 1% of freelancers who automate their workflow.
                </p>

                <div className="space-y-6">
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                        <div className="mt-1 p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Rocket size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg">AI Proposal Generator</h4>
                            <p className="text-slate-400 text-sm mt-1">Generate tailored, persuasive pitches in seconds using your unique profile data.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                        <div className="mt-1 p-2 bg-teal-500/20 rounded-lg text-teal-400">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg">Pipeline & Analytics</h4>
                            <p className="text-slate-400 text-sm mt-1">Visual boards for your applications and real-time revenue tracking.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <img loading="lazy" decoding="async" key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800" alt="User" />
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        +2k
                    </div>
                </div>
                <div className="h-8 w-px bg-white/10"></div>
                <div className="flex flex-col">
                     <div className="flex text-amber-400">
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                     </div>
                     <span className="text-xs font-medium text-slate-400 mt-1">Trusted by 2,000+ Freelancers</span>
                </div>
            </div>
        </div>

        {/* Right Column: Signup Form */}
        <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto bg-white dark:bg-slate-950">
            {/* Mobile Header / Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                <Link to="/" className="lg:hidden flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                    <ArrowLeft size={20} /> Back
                </Link>
                <Link to="/" className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            {/* Form Container */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SignupForm />
                </div>
            </div>
        </div>

      </div>
    </>
  );
};


