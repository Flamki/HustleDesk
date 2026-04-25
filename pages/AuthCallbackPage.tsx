import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { consumePendingOAuthErrorCode } from '../services/supabaseService';

const sanitizeReturnTo = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/login') || trimmed.startsWith('/signup') || trimmed.startsWith('/auth/callback')) {
    return null;
  }
  return trimmed;
};

const MAX_WAIT_MS = 12_000; // Give auth up to 12s to complete

export const AuthCallbackPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'waiting' | 'error'>('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRedirected = useRef(false);

  const returnTo = React.useMemo(
    () => sanitizeReturnTo(searchParams.get('returnTo')) || '/app/dashboard',
    [searchParams]
  );

  // Preload dashboard
  useEffect(() => {
    void import('./DashboardPage');
  }, []);

  // Success: user is authenticated → redirect immediately
  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      navigate(returnTo, { replace: true });
    }
  }, [user, navigate, returnTo]);

  // Timeout: if auth doesn't resolve in time, show error
  useEffect(() => {
    if (hasRedirected.current) return;

    timerRef.current = setTimeout(() => {
      if (hasRedirected.current) return;
      // Still no user after max wait
      const oauthError = consumePendingOAuthErrorCode();
      const friendlyMsg = oauthError === 'no_account'
        ? 'No account found. Please sign up first.'
        : 'Sign-in could not be completed. This can happen if the session expired or cookies were blocked.';
      setErrorMessage(friendlyMsg);
      setStatus('error');
    }, MAX_WAIT_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // If auth finishes loading and no user, but we haven't timed out yet,
  // give a small extra grace period for the session to establish
  useEffect(() => {
    if (loading || user || hasRedirected.current || status === 'error') return;

    // Auth says "done" but no user — wait 2s more then check again
    const grace = setTimeout(() => {
      if (hasRedirected.current || user) return;
      const oauthError = consumePendingOAuthErrorCode();
      
      if (oauthError === 'no_account') {
        hasRedirected.current = true;
        navigate(`/signup?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
        return;
      }

      setErrorMessage(
        'Sign-in could not be completed. This can happen if your browser blocks third-party cookies, or if the sign-in link expired.'
      );
      setStatus('error');
    }, 2500);

    return () => clearTimeout(grace);
  }, [loading, user, navigate, returnTo, status]);

  const handleRetry = useCallback(() => {
    hasRedirected.current = true;
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <>
      <SEO title="Authenticating" description="Completing sign-in..." path="/auth/callback" noindex />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        {status === 'waiting' ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Completing sign-in...</p>
              <p className="text-xs text-slate-400 mt-1">This should only take a moment.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign-in Issue</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleRetry}
                className="w-full px-5 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Make sure cookies are enabled and try using the same browser you signed up with.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
