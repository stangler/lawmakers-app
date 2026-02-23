/**
 * Auth Provider
 * React Context による認証状態管理
 */

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// Re-export AuthContext and useAuth hook
export { AuthContext };
export { useAuth } from '../hooks/useAuth';

// ============================================
// Types
// ============================================

interface User {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// API Base URL
// ============================================

const getApiBase = (): string => {
  // 開発環境では相対パス（vite proxy経由）
  // 本番環境では同じオリジン
  return '/api';
};

// ============================================
// Test Mode
// ============================================

declare global {
  interface Window {
    __TEST_MODE__?: boolean;
  }
}

const isTestMode = (): boolean => {
  return window.__TEST_MODE__ === true;
};

// ============================================
// Provider Component
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザー情報を取得
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch(`${getApiBase()}/me`, {
        method: 'GET',
        credentials: 'include', // Cookie を送信
      });

      if (response.ok) {
        const data = await response.json();
        return data as User;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }, []);

  // 初期認証チェック
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      setIsLoading(true);
      
      // テストモードの場合はモックユーザーを設定
      if (isTestMode()) {
        setUser({
          id: 'test-user-id',
          email: 'test@example.com',
          verified: true,
          createdAt: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }
      
      const fetchedUser = await fetchUser();
      setUser(fetchedUser);
      setIsLoading(false);
    };

    void checkAuth();
  }, [fetchUser]);

  // ログイン
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${getApiBase()}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'ログインに失敗しました' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  }, []);

  // サインアップ
  const signup = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    try {
      const response = await fetch(`${getApiBase()}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, needsVerification: true };
      }

      return { success: false, error: data.error || 'サインアップに失敗しました' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  }, []);

  // ログアウト
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${getApiBase()}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  // ユーザー情報を再取得
  const refreshUser = useCallback(async (): Promise<void> => {
    const fetchedUser = await fetchUser();
    setUser(fetchedUser);
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    signup,
    logout,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

// ============================================
// Protected Route Component
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps): React.ReactElement | null {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' },
      React.createElement('div', { className: 'text-gray-500' }, '読み込み中...')
    );
  }

  if (!isAuthenticated) {
    return fallback ? fallback as React.ReactElement : null;
  }

  return children as React.ReactElement;
}
