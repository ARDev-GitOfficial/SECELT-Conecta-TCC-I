import { useCallback, useEffect, useState } from 'react';
import { api } from '../shared/api.js';

export function useSession({ navigate, notify, setModal, enabled }) {
  const [token, setToken] = useState(() => enabled ? localStorage.getItem('secelt-token') || '' : '');
  const [user, setUser] = useState(null);
  const clearSession = useCallback(() => {
    localStorage.removeItem('secelt-token');
    setToken('');
    setUser(null);
  }, []);
  useEffect(
    () => {
      if (!token || user) return;
      let active = true;
      api('/auth/me', { token }).then(d => { if (active) setUser(d.user); }).catch(() => { if (active) clearSession(); });
      return () => { active = false; };
    },
    [token, user, clearSession]
  );
  const login = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const d = await api('/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password') } });
      localStorage.setItem('secelt-token', d.token);
      setToken(d.token);
      setUser(d.user);
      navigate('admin');
      notify(`Bem-vinda, ${d.user.name.split(' ')[0]}.`);
      setModal(null);
    } catch (e) { notify(e.message); }
  };
  const logout = async () => {
    await api('/auth/logout', { method: 'POST', token }).catch(() => { });
    clearSession();
    navigate('feed');
    notify('Sessão encerrada.');
  };
  return { token, user, clearSession, login, logout };
}
