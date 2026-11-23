import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api.js';
import { rankFeed } from './model.js';

const empty = { items: [], pages: [], stories: [] };

export function useSocialFeed(state, enabled) {
  const [{ data, time }, setFeed] = useState(() => ({ data: empty, time: Date.now() }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const ranking = useRef(null);

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const result = await api('/social/feed');
      if (id === request.current) setFeed({ data: result, time: Date.now() });
    } catch (error) {
      if (id === request.current) setError(error.message);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
    return () => { request.current++; };
  }, [enabled, load]);

  const key = JSON.stringify([state.active, state.followed, state.hiddenPosts, time]);
  if (ranking.current?.key !== key || ranking.current.data !== data) {
    ranking.current = { key, data, items: rankFeed(data.items, state, time) };
  }
  const ranked = ranking.current.items;
  const municipal = ranked.filter(post => post.sourceUrl).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { data, ranked, municipal, loading, error, load };
}
