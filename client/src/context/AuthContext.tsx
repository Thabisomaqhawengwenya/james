import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.auth
      .getMe()
      .then((res) => {
        setUser(res.user);
        if (res.user.profile) {
          setProfile(res.user.profile);
        }
      })
      .catch((err) => {
        console.warn('Session expired or invalid token:', err);
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password: pass });
      setStoredToken(res.token);
      setUser(res.user);
      const me = await api.auth.getMe();
      if (me.user.profile) setProfile(me.user.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register({ email, password: pass, name });
      setStoredToken(res.token);
      setUser(res.user);
      const me = await api.auth.getMe();
      if (me.user.profile) setProfile(me.user.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    // Attempt login with default demo account, or register if not existing
    try {
      await login('demo@james.ai', 'demo123456');
    } catch {
      await register('demo@james.ai', 'demo123456', 'Maqhawe');
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    const res = await api.profile.update(data);
    setProfile(res.profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginDemo,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
