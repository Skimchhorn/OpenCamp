import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, ApiError, setApiToken, type Me } from './api';

const TOKEN_KEY = 'opencamp.token';

type Auth = {
  /** undefined while the stored token is still loading. */
  token: string | null | undefined;
  user: Me | undefined;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .catch(() => null)
      .then((stored) => {
        setApiToken(stored);
        setToken(stored);
      });
  }, []);

  const signIn = useCallback(async (value: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, value);
    setApiToken(value);
    setToken(value);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setApiToken(null);
    setToken(null);
    queryClient.removeQueries({ queryKey: ['me'] });
    queryClient.removeQueries({ queryKey: ['saved'] });
  }, [queryClient]);

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: async () => {
      try {
        return await api<Me>('/api/auth/me');
      } catch (e) {
        // An expired or revoked token: drop it so the user can sign in again.
        if (e instanceof ApiError && e.status === 401) await signOut();
        throw e;
      }
    },
    enabled: !!token,
    retry: false,
  });

  return (
    <AuthContext.Provider value={{ token, user: token ? me.data : undefined, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
