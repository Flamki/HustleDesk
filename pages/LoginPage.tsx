
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const sanitizeReturnTo = React.useCallback((value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
    if (trimmed.startsWith('/login') || trimmed.startsWith('/signup') || trimmed.startsWith('/auth/callback')) {
      return null;
    }
    return trimmed;
  }, []);

  const redirectPath = React.useMemo(() => {
    const fromQuery = sanitizeReturnTo(searchParams.get('returnTo'));
    if (fromQuery) return fromQuery;

    const state = location.state as
      | {
          from?: {
            pathname?: string;
            search?: string;
            hash?: string;
          };
        }
      | null;
    const from = state?.from;
    if (!from?.pathname) return '/app/dashboard';
    if (from.pathname === '/login' || from.pathname === '/signup' || from.pathname === '/auth/callback') {
      return '/app/dashboard';
    }
    return sanitizeReturnTo(`${from.pathname}${from.search ?? ''}${from.hash ?? ''}`) || '/app/dashboard';
  }, [location.state, sanitizeReturnTo, searchParams]);

  useEffect(() => {
    void import('./DashboardPage');
  }, []);

  // If user is already logged in, don't auto-redirect — show them a choice
  const isAuthenticated = !loading && !!user;

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
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
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
                        "Really helpful for managing day-to-day progress."
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                         Helpful for people who work with multiple clients. One workspace to manage everything — proposals, follow-ups, and client progress.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-white/10 bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
                            F
                        </div>
                        <div>
                            <div className="font-bold text-white">Feroz</div>
                            <div className="text-sm text-slate-500">Freelance Product Designer · Early Access</div>
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
                <span>© 2026 GetSoloDesk Inc.</span>
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
                    {isAuthenticated ? (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You're already signed in</h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Signed in as <strong className="text-slate-700 dark:text-slate-200">{user?.email}</strong></p>
                        </div>
                        <div className="space-y-3">
                          <button onClick={() => navigate(redirectPath, { replace: true })}
                            className="w-full py-3 px-4 rounded-xl text-white bg-emerald-500 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/20 transition-all">
                            Go to Dashboard →
                          </button>
                          <button onClick={() => { import('../services/supabaseService').then(m => m.signOut()); window.location.href = '/login'; }}
                            className="w-full py-3 px-4 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-all text-sm">
                            Sign out & use a different account
                          </button>
                        </div>
                      </div>
                    ) : (
                      <LoginForm />
                    )}
                </div>
            </div>
        </div>

      </div>
    </>
  );
};


