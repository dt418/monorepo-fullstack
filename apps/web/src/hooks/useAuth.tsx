import type { User, LoginInput, RegisterInput, AuthTokens } from '@myorg/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_tokens';

function getStoredTokens(): AuthTokens | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  apiClient.setAccessToken(tokens.accessToken);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  apiClient.setAccessToken(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();
      if (tokens) {
        try {
          apiClient.setAccessToken(tokens.accessToken);
          const userData = await apiClient.getMe();
          setUser(userData);
        } catch (err) {
          // Token might be expired, try refresh
          try {
            const newTokens = await apiClient.refreshToken(tokens.refreshToken);
            storeTokens(newTokens);
            const userData = await apiClient.getMe();
            setUser(userData);
          } catch {
            clearTokens();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await apiClient.login(input);
    storeTokens(result.tokens);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await apiClient.register(input);
    storeTokens(result.tokens);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const tokens = getStoredTokens();
    if (tokens) {
      try {
        await apiClient.logout(tokens.refreshToken);
      } catch {
        // Ignore logout errors
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
