'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User, ApiError } from '@/lib/api';
import { toast } from 'sonner';

// Mock user data for development
const MOCK_USER: User = {
  id: 1,
  name: '김포텐',
  email: 'demo@potenup.com',
  role: 'USER',
  trackName: 'AI 트랙 4기',
  profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (idToken: string) => Promise<{ role: string } | null>;
  mockLogin: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check for mock session first
      const mockSession = sessionStorage.getItem('mockAuth');
      if (mockSession === 'true') {
        setUser(MOCK_USER);
        setIsLoading(false);
        return;
      }

      const response = await api.get<{ role: string; userId?: number }>('/auth/me');
      
      if (response && response.role) {
        try {
          const userInfo: any = await api.get('/users/myInfo');
          setUser({
            id: userInfo.userId,
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.role,
            trackId: userInfo.trackId,
            trackName: userInfo.trackName,
            profileImageUrl: userInfo.profileImageUrl,
          });
        } catch {
          setUser({
            id: response.userId || 0,
            name: '',
            email: '',
            role: response.role as 'USER' | 'ADMIN'
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (idToken: string) => {
    try {
      const response = await api.post<{ role: string }>('/auth/login', { idToken });
      await checkAuth();
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        sessionStorage.setItem('pendingIdToken', idToken);
        throw error;
      }
      toast.error('로그인에 실패했습니다.');
      throw error;
    }
  };

  const mockLogin = () => {
    sessionStorage.setItem('mockAuth', 'true');
    setUser(MOCK_USER);
    toast.success('데모 계정으로 로그인되었습니다!');
  };

  const logout = async () => {
    try {
      // Clear mock session
      sessionStorage.removeItem('mockAuth');
      await api.delete('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      toast.success('로그아웃되었습니다.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        mockLogin,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}