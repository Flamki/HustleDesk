
import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '../ui/Input';
import { PasswordStrength } from './PasswordStrength';
import { AuthError } from '../../types';
import { EMAIL_REGEX, PASSWORD_REQUIREMENTS } from '../../constants';
import * as authService from '../../services/supabaseService';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthError>({});
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const id = window.setInterval(() => {
      setRetryAfterSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [retryAfterSeconds]);

  const getFriendlySignupError = (message: string): { text: string; retryAfter: number } => {
    const normalized = message.toLowerCase();

    if (normalized.includes('email rate limit exceeded')) {
      const match = normalized.match(/(\d+)\s*(second|seconds|sec|s|minute|minutes|min|m)/);
      let seconds = 60;
      if (match) {
        const value = Number(match[1]);
        const unit = match[2];
        seconds = unit.startsWith('m') ? value * 60 : value;
      }
      return {
        text: `Too many signup emails were requested. Please wait ${seconds}s and try again. For production reliability, configure custom SMTP in Supabase Authentication settings.`,
        retryAfter: seconds,
      };
    }

    return { text: message, retryAfter: 0 };
  };

  const getFriendlyOAuthError = (message: string): string => {
    const normalized = message.toLowerCase();
    if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
      return 'Google signup is not enabled in Supabase yet. Enable it in Authentication -> Sign In / Providers -> Google, then add Google OAuth client ID and secret.';
    }
    return message;
  };

  // Derived state for password requirements
  const passwordRequirements = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }));
  }, [password]);

  const isPasswordValid = passwordRequirements.every((req) => req.met);

  useEffect(() => {
    if (!isPasswordTouched) return;
    if (isPasswordValid) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  }, [isPasswordTouched, isPasswordValid]);

  // Real-time Email Validation
  useEffect(() => {
    if (!isEmailTouched) return;
    
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    } else if (!EMAIL_REGEX.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  }, [email, isEmailTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailTouched(true);
    setIsPasswordTouched(true);

    // Final Validation Check
    if (retryAfterSeconds > 0) {
      setErrors((prev) => ({
        ...prev,
        general: `Please wait ${retryAfterSeconds}s before trying signup again.`,
      }));
      return;
    }

    const isEmailValid = EMAIL_REGEX.test(email);
    if (!isEmailValid) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        return;
    }
    if (!isPasswordValid) {
        setErrors(prev => ({ ...prev, password: 'Password does not meet all requirements' }));
        return; // Visual requirements already show what's wrong
    }

    setLoading(true);
    setErrors({}); // Clear general errors

    try {
      const { user, error } = await signUp(email, password);
      
      if (error) {
        const friendly = getFriendlySignupError(error.message);
        if (friendly.retryAfter > 0) setRetryAfterSeconds(friendly.retryAfter);
        setErrors((prev) => ({ ...prev, general: friendly.text }));
      } else if (user) {
        navigate('/app/dashboard', { replace: true });
      } else {
        navigate(`/auth/check-email?email=${encodeURIComponent(email)}`, { state: { email } });
      }
    } catch {
      setErrors((prev) => ({ ...prev, general: 'An unexpected error occurred. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
      setLoading(true);
      const { error } = await authService.signInWithGoogle('signup');
      if (error) {
        setErrors((prev) => ({ ...prev, general: getFriendlyOAuthError(error.message) }));
      }
      setLoading(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create your account</h1>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
             <span>Start for free.</span>
             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-800">
                <Sparkles size={12} /> 5 AI Credits / mo
             </span>
          </div>
        </div>

        {/* Global Error Message */}
        {errors.general && (
          <div className="p-4 rounded-[10px] bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            {errors.general}
          </div>
        )}

        <div className="space-y-5">
          {/* Email Input */}
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setIsEmailTouched(true)}
            error={errors.email}
            icon={Mail}
            disabled={loading}
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />

          {/* Password Input */}
          <div className="space-y-3">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setIsPasswordTouched(true)}
              // We don't show a text error for password, we use the visual indicator
              error={errors.password}
              icon={Lock}
              disabled={loading}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:text-slate-600 dark:hover:text-slate-300 focus:text-teal-700 dark:focus:text-teal-400 transition-colors rounded-md outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/30"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            
            {/* Password Requirements Indicator - Show when user starts typing or has touched field */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPasswordTouched || password.length > 0 ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                <PasswordStrength requirements={passwordRequirements} />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || retryAfterSeconds > 0}
          className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-white bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden hover:scale-[1.02]"
        >
          {loading ? (
             <Loader2 className="animate-spin" size={20} />
          ) : retryAfterSeconds > 0 ? (
            <span>Retry in {retryAfterSeconds}s</span>
          ) : (
            <>
              <span>Create Free Account</span>
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

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};
