import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  apiGet,
  apiPost,
  apiPatch,
  saveTokens,
  clearTokens,
  SessionExpiredError,
} from '../lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY_USER = 'auth:user';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiGet<User>('/auth/me');
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(me));
        setUser(me);
      } catch (e) {
        if (e instanceof SessionExpiredError) {
          await AsyncStorage.removeItem(STORAGE_KEY_USER);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiPost<AuthResponse>('/auth/login', { email, password }, true);
      await saveTokens(data.accessToken, data.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      setUser(data.user);
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao fazer login.' };
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      const data = await apiPost<AuthResponse>('/auth/register', { name, email, password }, true);
      await saveTokens(data.accessToken, data.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      setUser(data.user);
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao criar conta.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (name: string, email: string) => {
    const updated = await apiPatch<User>('/auth/me', { name, email });
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signUp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

