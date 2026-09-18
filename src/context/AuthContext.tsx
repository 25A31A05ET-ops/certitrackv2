import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickDemoLogin: (type: 'superadmin' | 'cse_faculty' | 'ece_faculty' | 'student') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('certitrack_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('certitrack_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('certitrack_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(identifier, password);
      localStorage.setItem('certitrack_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('certitrack_token');
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (type: 'superadmin' | 'cse_faculty' | 'ece_faculty' | 'student') => {
    if (type === 'superadmin') {
      await login('superadmin', 'superadmin123');
    } else if (type === 'cse_faculty') {
      await login('cse.faculty', 'faculty123');
    } else if (type === 'ece_faculty') {
      await login('ece.faculty', 'faculty123');
    } else if (type === 'student') {
      await login('student', 'student123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
