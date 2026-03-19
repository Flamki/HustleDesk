
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { Sun, Moon, ArrowLeft, ShieldCheck, Quote } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <>
      <SEO
        title="Login"
        description="Log in to your GetSoloDesk account."
        path="/login"
        noindex
      />
      <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-300">
        
        {/* Left Column: Brand & Visuals (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white overflow-hidden flex-col justify-between p-16 z-10">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
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
                <div className="mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm text-indigo-300 mb-6">
                        <Quote size={24} fill="currentColor" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
                        "GetSoloDesk isn't just a tool; it's my COO."
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                         I spend less time managing chaos and more time serving the clients I love. The AI proposals alone save me 10 hours a week.
                    </p>
                    <div className="flex items-center gap-4">
                        <img loading="lazy" decoding="async" 
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" 
                            alt="User" 
                            className="w-12 h-12 rounded-full border-2 border-white/10 bg-slate-800"
                        />
                        <div>
                            <div className="font-bold text-white">Sarah Jenkins</div>
                            <div className="text-sm text-slate-500">Product Designer @ Stripe</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                    <ShieldCheck size={16} /> Secure Login
                </span>
                <span>•</span>
                <span>© 2024 GetSoloDesk Inc.</span>
            </div>
        </div>

        {/* Right Column: Login Form */}
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
                    <LoginForm />
                </div>
            </div>
        </div>

      </div>
    </>
  );
};


