import { ArrowRight, Bookmark, Heart, Users } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SocialDialog } from '../../shared/Dialog.jsx';
import { COMMUNITY_KEY, PROFILE, initialCommunity, readCommunity } from './model.js';
import { Avatar } from './ui.jsx';

const CommunityContext = createContext(null);
export function SocialProvider({ children }) {
  const [state, setState] = useState(() => { try { return readCommunity(localStorage); } catch { return initialCommunity(); } });
  const [accessOpen, setAccessOpen] = useState(false), [storageError, setStorageError] = useState(false);
  const pending = useRef(null);
  useEffect(
    () => {
      try {
        localStorage.setItem(COMMUNITY_KEY, JSON.stringify(state));
        setStorageError(false);
      } catch { setStorageError(true); }
    },
    [state]
  );
  useEffect(
    () => {
      const handler = e => { if (e.key === COMMUNITY_KEY) setState(readCommunity(localStorage)); };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
    []
  );
  useEffect(
    () => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.dataset.appearance = state.theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.theme === 'black' ? '#000000' : '#081522');
    },
    [state.theme]
  );
  useEffect(
    () => {
      let frame = 0, point = null, last = null;
      const paint = () => {
        frame = 0;
        if (!point) return;
        const target = point.target.closest?.('.sg-glass');
        if (last && last !== target) last.style.removeProperty('--sg-light-alpha');
        if (!target) return;
        const bounds = target.getBoundingClientRect();
        target.style.setProperty('--sg-light-x', `${Math.max(0, Math.min(100, (point.x - bounds.left) / bounds.width * 100))}%`);
        target.style.setProperty('--sg-light-y', `${Math.max(0, Math.min(100, (point.y - bounds.top) / bounds.height * 100))}%`);
        target.style.setProperty('--sg-light-alpha', point.pressed ? '.14' : '.075');
        last = target;
      };
      const move = e => {
        point = { target: e.target, x: e.clientX, y: e.clientY, pressed: e.buttons > 0 || e.type === 'pointerdown' };
        if (!frame) frame = requestAnimationFrame(paint);
      };
      document.addEventListener('pointermove', move, { passive: true });
      document.addEventListener('pointerdown', move, { passive: true });
      return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerdown', move);
        last?.style.removeProperty('--sg-light-alpha');
      };
    },
    []
  );
  const requireCitizen = callback => {
    if (state.active) callback?.(); else {
      pending.current = callback;
      setAccessOpen(true);
    }
  };
  const toggle = (key, id) => requireCitizen(() => setState(s => ({ ...s, [key]: s[key].includes(id) ? s[key].filter(v => v !== id) : [...s[key], id] })));
  const close = () => {
    pending.current = null;
    setAccessOpen(false);
  };
  return <CommunityContext.Provider value={{ state, setState, requireCitizen, toggle, storageError }}>
    {children}
    {accessOpen && <SocialDialog title="Sua cidade, ainda mais perto." onClose={close} className="sg-access-dialog">
      <div className="sg-access-art">
        <span className="sg-orbit" />
        <Avatar name={PROFILE.name} size="xl" />
        <span className="sg-float-icon one"><Heart /></span>
        <span className="sg-float-icon two"><Bookmark /></span>
        <span className="sg-float-icon three"><Users /></span>
      </div>
      <p className="sg-kicker">FAÇA PARTE</p>
      <h2>Sua cidade,<br /><em>ainda mais perto.</em></h2>
      <p>Salve o que inspira você, acompanhe suas páginas favoritas e participe das conversas.</p>
      <button
        className="sg-primary sg-full"
        onClick={() => {
          setState(s => ({ ...s, active: true }));
          setAccessOpen(false);
          const callback = pending.current;
          pending.current = null;
          callback?.();
        }}
      >Continuar como Ana <ArrowRight size={18} />
      </button>
      <button className="sg-text-button sg-full" onClick={close}>Continuar explorando</button>
    </SocialDialog>}
  </CommunityContext.Provider>;
}
export const useCommunity = () => useContext(CommunityContext);
