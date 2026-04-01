import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { consumePendingOAuthErrorCode } from '../services/supabaseService';

export const AuthCallbackPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [allowFailureRedirect, setAllowFailureRedirect] = React.useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAllowFailureRedirect(true), 6500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate('/app/dashboard', { replace: true });
      return;
    }
    if (!allowFailureRedirect) return;
    const oauthError = consumePendingOAuthErrorCode();
    const errorCode = oauthError || 'oauth_failed';
    navigate(`/login?error=${encodeURIComponent(errorCode)}`, { replace: true });
  }, [allowFailureRedirect, loading, navigate, user]);

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
