import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AuthResponse, User } from '../types';
import * as authService from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_CACHE_KEY = 'user_session';

const readCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCachedUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_CACHE_KEY);
    return;
  }
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = readCachedUser();
    return cached;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = readCachedUser();
    return !cached;
  });
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      let hydrationFailed = false;
      try {
        await authService.hydrateSessionFromUrl();
      } catch (err) {
        console.error('OAuth callback processing failed:', err);
        hydrationFailed = true;
      }

      let currentUser = await authService.getCurrentUser();
      
      // If hydration failed or user is null but we're on a callback URL,
      // wait and retry — Supabase's internal listener may still be processing
      if (!currentUser && (hydrationFailed || window.location.pathname.includes('/auth/callback'))) {
        await new Promise((r) => setTimeout(r, 1500));
        currentUser = await authService.getCurrentUser();
      }

      if (!mounted) return;

      bootstrappedRef.current = true;
      setUser(currentUser);
      writeCachedUser(currentUser);
      setLoading(false);
    };

    void bootstrap();

    const unsubscribe = authService.onAuthStateChanged((nextUser) => {
      if (!mounted) return;
      // Ignore early null emissions before URL/session bootstrap completes.
      if (!bootstrappedRef.current && !nextUser) return;
      bootstrappedRef.current = true;
      setUser(nextUser);
      writeCachedUser(nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authService.signIn(email, password);
    if (response.user) {
      bootstrappedRef.current = true;
      setUser(response.user);
      writeCachedUser(response.user);
      setLoading(false);
    }
    return response;
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    return authService.signUp(email, password);
  };

  const signOut = async (): Promise<void> => {
    bootstrappedRef.current = true;
    setUser(null);
    writeCachedUser(null);
    setLoading(false);
    try {
      await authService.signOut();
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
