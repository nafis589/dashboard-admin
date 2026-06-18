'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '@/lib/api-client';
import type { AdminUser, LoginResponse, ProfileResponse } from '@/lib/types';

interface AuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapLoginError(err: unknown): never {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid email') || msg.includes('invalid credentials')) {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw err;
  }
  throw new Error('Une erreur est survenue. Veuillez reessayer.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setAdmin(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<LoginResponse>(
        '/api/store/auth/login',
        { email, password },
        { skipUnauthorizedRedirect: true },
      );
      if (!['ADMIN', 'SUPER_ADMIN'].includes(data.user.role)) {
        throw new Error("Acces reserve aux administrateurs.");
      }
      setToken(data.accessToken);
      const profile = await api.get<ProfileResponse>('/api/store/profile');
      setAdmin(profile.data);
    } catch (err) {
      mapLoginError(err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const stored = getToken();
        if (!stored) return;

        const { data } = await api.get<ProfileResponse>('/api/store/profile');
        if (!['ADMIN', 'SUPER_ADMIN'].includes(data.role)) {
          logout();
          return;
        }
        setAdmin(data);
      } catch {
        logout();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [logout]);

  return <AuthContext.Provider value={{ admin, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
