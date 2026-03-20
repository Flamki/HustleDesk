import React, { createContext, useContext, useEffect, useState } from 'react';
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

const writeCachedUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_CACHE_KEY);
    return;
  }
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        await authService.hydrateSessionFromUrl();
      } catch (err) {
        console.error('OAuth callback processing failed:', err);
      }

      const currentUser = await authService.getCurrentUser();
      if (!mounted) return;

      setUser(currentUser);
      writeCachedUser(currentUser);
      setLoading(false);
    };

    void bootstrap();

    const unsubscribe = authService.onAuthStateChanged((nextUser) => {
      if (!mounted) return;
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
      setUser(response.user);
      writeCachedUser(response.user);
    }
    return response;
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    return authService.signUp(email, password);
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    writeCachedUser(null);
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
