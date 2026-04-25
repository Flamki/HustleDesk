import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import SEO from '../components/SEO';
import { BrandLogo } from '../components/brand/BrandLogo';
import { resetPasswordForEmail } from '../services/supabaseService';
import { EMAIL_REGEX } from '../constants';

export const ForgotPasswordPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await resetPasswordForEmail(email);
      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes('rate limit')) {
          setError('Too many requests. Please wait a minute and try again.');
        } else {
          setError(resetError.message);
        }
      } else {
        setSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reset Password" description="Reset your GetSoloDesk password." path="/forgot-password" noindex />
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors p-4">
        
        {/* Theme toggle */}
        <div className="fixed top-6 right-6 z-20">
          <button onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo */}
          <div className="flex justify-center">
            <Link to="/">
              <BrandLogo className="h-8 w-auto" tone={theme === 'dark' ? 'inverse' : 'default'} />
            </Link>
          </div>

          {sent ? (
            /* ── SUCCESS STATE ── */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle size={28} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Check your email</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We sent a password reset link to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
                Click the link in the email to reset your password.
              </p>
              <div className="pt-2 space-y-3">
                <p className="text-xs text-slate-400">
                  Didn't get it? Check your spam folder, or{' '}
                  <button onClick={() => { setSent(false); setError(null); }}
                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                    try again
                  </button>
                </p>
                <Link to="/login" className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  ← Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-sm">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the email you signed up with. We'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white bg-emerald-500 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                </button>
              </form>

              <div className="text-center">
                <Link to="/login" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center gap-1">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
