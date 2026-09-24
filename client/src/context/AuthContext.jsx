import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setUser(data.user);
    },
    async register(details) {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(details),
      });
      setUser(data.user);
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

