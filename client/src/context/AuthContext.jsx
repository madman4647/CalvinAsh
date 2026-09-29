import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get('/api/auth/me');
      setAccount(me);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (loginId, password) => {
    const result = await api.post('/api/auth/login', { loginId, password });
    await refresh();
    return result;
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setAccount(null);
  }, []);

  return (
    <AuthContext.Provider value={{ account, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
