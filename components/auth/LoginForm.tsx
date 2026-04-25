
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { EMAIL_REGEX } from '../../constants';
import * as authService from '../../services/supabaseService';

const sanitizeReturnTo = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/login') || trimmed.startsWith('/signup') || trimmed.startsWith('/auth/callback')) {
    return null;
  }
  return trimmed;
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupHint, setShowSignupHint] = useState(false);

  const getFriendlyAuthError = (code: string | null): string | null => {
    if (code === 'oauth_failed') {
      return 'Google login could not be completed. Make sure cookies are enabled and try again. If the problem persists, try email/password login instead.';
    }
    if (code === 'no_account') {
      return 'No account exists for this login. Please sign up first.';
    }
    if (code === 'session_expired') {
      return 'Your sign-in session expired. Please try logging in again.';
    }
    return null;
  };

  const getFriendlyLoginError = (message: string): { text: string; isNoAccount: boolean } => {
    const normalized = message.toLowerCase();
    if (normalized.includes('invalid login credentials') || normalized.includes('invalid_credentials')) {
      return { text: 'Incorrect email or password. If you haven\'t signed up yet, create an account first.', isNoAccount: true };
    }
    if (normalized.includes('email not confirmed')) {
      return { text: 'Your email has not been confirmed yet. Check your inbox for a verification link, or sign up again.', isNoAccount: false };
    }
    if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
      return { text: 'Too many login attempts. Please wait a moment and try again.', isNoAccount: false };
    }
    if (normalized.includes('network') || normalized.includes('fetch') || normalized.includes('failed to fetch')) {
      return { text: 'Network error. Please check your internet connection and try again.', isNoAccount: false };
    }
    if (normalized.includes('timeout') || normalized.includes('timed out')) {
      return { text: 'The request timed out. Please try again.', isNoAccount: false };
    }
    if (normalized.includes('user not found')) {
      return { text: 'No account found with this email. Please sign up first.', isNoAccount: true };
    }
    return { text: message, isNoAccount: false };
  };

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
  }, [location.state, searchParams]);

  React.useEffect(() => {
    // Only show OAuth errors from fresh URL redirects (e.g. /login?error=oauth_failed)
    // Don't read from localStorage — stale errors from previous attempts poison the UX
    const codeFromUrl = searchParams.get('error');
    if (codeFromUrl) {
      const nextError = getFriendlyAuthError(codeFromUrl);
      if (nextError) {
        setError(nextError);
      }
      // Clean the URL param after reading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      const newUrl = `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
    // Always clear any stale OAuth error codes from localStorage
    authService.consumePendingOAuthErrorCode();
  }, [searchParams]);

  React.useEffect(() => {
    void import('../../pages/DashboardPage');
  }, []);

  const getFriendlyOAuthError = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
      return 'Google login is not enabled in Supabase yet. Enable it in Authentication -> Sign In / Providers -> Google, then add Google OAuth client ID and secret.';
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address');
        return;
    }

    setLoading(true);
    setShowSignupHint(false);

    try {
      const { user, error: authError } = await signIn(email, password);
      
      if (authError) {
        const friendly = getFriendlyLoginError(authError.message);
        setError(friendly.text);
        setShowSignupHint(friendly.isNoAccount);
      } else if (user) {
        navigate(redirectPath, { replace: true });
      } else {
        setError('Login did not complete. Please try again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const friendly = getFriendlyLoginError(msg || 'An unexpected error occurred. Please try again.');
      setError(friendly.text);
      setShowSignupHint(friendly.isNoAccount);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError(null);
      setGoogleLoading(true);
      const { error: oauthError } = await authService.signInWithGoogle('login', redirectPath);
      if (oauthError) {
        setError(getFriendlyOAuthError(oauthError.message));
        setGoogleLoading(false);
      }
      // Don't reset on success — page redirects to Google.
  };

  const signupPath = React.useMemo(() => {
    const target = sanitizeReturnTo(redirectPath);
    if (!target) return '/signup';
    return `/signup?returnTo=${encodeURIComponent(target)}`;
  }, [redirectPath]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Enter your credentials to access your account.</p>
        </div>

        {error && (
          <div className="p-4 rounded-[10px] bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
            {showSignupHint && (
              <Link
                to={signupPath}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                Create a Free Account →
              </Link>
            )}
          </div>
        )}

        <div className="space-y-5">
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            disabled={loading}
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />

          <div className="space-y-1">
            <div className="flex justify-between">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline">
                    Forgot password?
                </Link>
            </div>
            <div className="relative">
                <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                disabled={loading}
                className="mt-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                rightElement={
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-slate-600 dark:hover:text-slate-300 focus:text-teal-700 dark:focus:text-teal-400 transition-colors rounded-md outline-none"
                    tabIndex={-1}
                    >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                }
                />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-white bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02]"
        >
          {loading ? (
             <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
        >
          {googleLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          Don't have an account?{' '}
          <Link to={signupPath} className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};
