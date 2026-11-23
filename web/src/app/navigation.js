import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { parseRoute, routeHash } from './routes.js';

export function useSocialRoute() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  const positions = useRef(new Map()), previous = useRef(location.hash);
  useEffect(
    () => {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      const handler = () => {
        positions.current.set(previous.current, window.scrollY);
        previous.current = location.hash;
        setRoute(parseRoute(location.hash));
      };
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    },
    []
  );
  useLayoutEffect(() => { window.scrollTo(0, positions.current.get(location.hash) || 0); }, [route.page, route.id]);
  const navigate = useCallback(next => {
    const hash = routeHash(typeof next === 'string' ? { page: next } : next);
    if (location.hash !== hash) location.hash = hash; else window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, []);
  return [route, navigate];
}
