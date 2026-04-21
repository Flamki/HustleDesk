import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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

export const AuthCallbackPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnTo = React.useMemo(
    () => sanitizeReturnTo(searchParams.get('returnTo')) || '/app/dashboard',
    [searchParams]
  );
  
  useEffect(() => {
    void import('./DashboardPage');
  }, []);

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      navigate(returnTo, { replace: true });
      return;
    }
    
    // Auth finished but no user: failed or rejected
    const oauthError = consumePendingOAuthErrorCode();
    const errorCode = oauthError || 'oauth_failed';
    
    // If they tried to Google Login without an account, bounce directly to signup
    if (errorCode === 'no_account') {
        navigate(`/signup?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
        return;
    }

    navigate(
      `/login?error=${encodeURIComponent(errorCode)}&returnTo=${encodeURIComponent(returnTo)}`,
      { replace: true }
    );
  }, [loading, navigate, returnTo, user]);

  return (
    <>
      <SEO title="Authenticating" description="Completing sign-in..." path="/auth/callback" noindex />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
          <Loader2 className="animate-spin text-emerald-500" size={20} />
          <span className="text-sm font-medium">Completing sign-in...</span>
        </div>
      </div>
    </>
  );
};
