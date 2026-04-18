import React from 'react';
import { MailCheck, Sun, Moon } from 'lucide-react';
import { useLocation, Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import * as authService from '../services/supabaseService';
import SEO from '../components/SEO';

export const CheckEmailPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateEmail = location.state?.email;
  const queryEmail = searchParams.get('email');
  const storedEmail =
    typeof window !== 'undefined' ? window.localStorage.getItem('last_signup_email') : null;
  const email = stateEmail || queryEmail || storedEmail || 'your email';
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const returnTo = searchParams.get('returnTo');
  const signupBackPath = returnTo
    ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
    : '/signup';
  const loginPath = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/login';

  React.useEffect(() => {
    if (!email || email === 'your email' || typeof window === 'undefined') return;
    window.localStorage.setItem('last_signup_email', email);
  }, [email]);

  const handleResend = async () => {
    if (!email || email === 'your email') {
      setMessage('Please go back and enter your email again.');
      return;
    }

    setLoading(true);
    const { error } = await authService.resendConfirmationEmail(email);
    setLoading(false);
    setMessage(error ? error.message : 'Verification email resent.');
  };

  return (
    <>
      <SEO
        title="Verify Email"
        description="Verify your email to activate your GetSoloDesk account."
        path="/auth/check-email"
        noindex
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6 transition-colors duration-200">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <MailCheck size={32} className="text-green-600 dark:text-green-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your inbox</h1>
            <p className="text-slate-500 dark:text-slate-400">
              We&apos;ve sent a confirmation link to <br />
              <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
            Click the link in the email to verify your account and complete the setup.
          </div>

          <div className="pt-4 space-y-4">
            <button
              onClick={() => {
                window.location.href = 'mailto:';
              }}
              className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-white/10"
            >
              Open Email App
            </button>

            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Didn&apos;t receive the email? </span>
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 transition-colors disabled:opacity-60"
              >
                {loading ? 'Resending...' : 'Click to resend'}
              </button>
            </div>
            {message && <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <Link
              to={loginPath}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1 mb-3 font-medium"
            >
              Already verified? Go to login
            </Link>
            <Link
              to={signupBackPath}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              {'<-'} Back to sign up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
