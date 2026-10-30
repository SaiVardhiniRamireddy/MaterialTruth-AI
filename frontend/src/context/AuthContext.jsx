import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.auth
      .me()
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('mt:logout', onLogout);
    return () => window.removeEventListener('mt:logout', onLogout);
  }, []);

  const handleAuth = (d) => {
    tokenStore.set(d.token);
    setUser(d.user);
    return d.user;
  };
  const login = useCallback((body) => api.auth.login(body).then(handleAuth), []);
  const register = useCallback((body) => api.auth.register(body).then(handleAuth), []);
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
