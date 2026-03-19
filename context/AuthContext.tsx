import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import * as authService from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const stripOAuthParamsFromHash = (): void => {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash || '';
  // Drop trailing OAuth fragments while preserving the route path.
  const secondHashIndex = hash.indexOf('#', 1);
  if (secondHashIndex === -1) return;
  const tail = hash.slice(secondHashIndex + 1).toLowerCase();
  const looksLikeOAuth =
    tail.includes('access_token=') ||
    tail.includes('refresh_token=') ||
    tail.includes('provider_token=') ||
    tail.includes('error=') ||
    tail.includes('code=');
  if (!looksLikeOAuth) return;
  window.location.hash = hash.slice(0, secondHashIndex);
};

const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Perceived performance: render immediately if we have a cached user and we are NOT in an OAuth callback.
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        // Always attempt URL hydration; it no-ops if no OAuth params are present.
        await authService.hydrateSessionFromUrl();
        // Prevent repeated OAuth callback detection on refresh.
        stripOAuthParamsFromHash();

        // Fast path: if a session already exists locally, unblock quickly.
        const quickUser = await authService.getCurrentUserFromSession();
        if (isMounted) {
          if (quickUser) {
            setUser(quickUser);
            localStorage.setItem('user_session', JSON.stringify(quickUser));
          }
          setLoading(false);
        }

        // Sync with Supabase in the background. If cached user is stale, this corrects it.
        void (async () => {
          const currentUser = await authService.getCurrentUser();
          if (!isMounted) return;
          setUser(currentUser);
          if (currentUser) localStorage.setItem('user_session', JSON.stringify(currentUser));
          else localStorage.removeItem('user_session');
        })();
      } catch (err) {
        if (!isMounted) return;
        // Keep app usable even if auth bootstrap fails once.
        console.error('Auth bootstrap failed:', err);
        // If we had no cached user, ensure state reflects that.
        if (!getCachedUser()) setUser(null);
        setLoading(false);
      }
    };

    bootstrapSession();

    const unsubscribe = authService.onAuthStateChanged((nextUser) => {
      if (!isMounted) return;
      setUser(nextUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authService.signIn(email, password);
    if (response.user) {
      setUser(response.user);
      localStorage.setItem('user_session', JSON.stringify(response.user));
    }
    return response;
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authService.signUp(email, password);
    return response;
  };

  const signOut = async () => {
    // Optimistic UI update for instant sign-out feedback.
    setUser(null);
    localStorage.removeItem('user_session');
    try {
      await authService.signOut();
    } finally {
      // Keep local auth state cleared even if remote sign-out fails.
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
