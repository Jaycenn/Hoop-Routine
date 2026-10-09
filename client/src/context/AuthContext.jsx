import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onAuthExpired } from '../api.js';
import { clearLocalDrafts } from '../drafts.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { const data = await api('/auth/me', { signal }); if (!signal?.aborted) setUser(data.user); }
    catch (requestError) {
      if (signal?.aborted) return;
      if (requestError.status === 401) setUser(null);
      else setError(requestError.message);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const unsubscribe = onAuthExpired(() => setUser(null));
    refresh(controller.signal);
    return () => { controller.abort(); unsubscribe(); };
  }, [refresh]);
  const value = useMemo(() => ({
    user, loading, error, retry: () => refresh(),
    async login(credentials) {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
      setUser(data.user); setError('');
    },
    async register(details) {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(details) });
      setUser(data.user); setError('');
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' });
      clearLocalDrafts(); setUser(null); setError('');
    },
  }), [user, loading, error, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
