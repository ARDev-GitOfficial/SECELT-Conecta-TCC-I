import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../shared/api.js';

const emptyPublic = { events: [], sports: { competitions: [], teams: [], matches: [], members: [] }, places: [], tourismGallery: [], googlePhotosEnabled: false, news: [] };
const emptyAdmin = { adminEvents: [], adminPlaces: [], adminMedia: [], overview: { pending: 0, published: 0, activeUsers: 0, registrations: 0 } };

export function usePortalData({ token, user, clearSession, notify, publicEnabled }) {
  const [catalog, setCatalog] = useState(emptyPublic);
  const [admin, setAdmin] = useState(null);
  const [competition, setCompetition] = useState('');
  const [loading, setLoading] = useState(true);
  const publicRequest = useRef(0);
  const adminRequest = useRef(0);
  const role = user?.role;

  const loadPublic = useCallback(async () => {
    const request = ++publicRequest.current;
    setLoading(true);
    try {
      const [events, sports, tourism, news] = await Promise.all([api('/events'), api('/sports'), api('/tourism'), api('/news')]);
      if (request !== publicRequest.current) return;
      setCatalog({ events: events.items, sports, places: tourism.items, tourismGallery: tourism.gallery || [], googlePhotosEnabled: !!tourism.googlePhotosEnabled, news: news.items });
      setCompetition(current => sports.competitions.some(item => item.id === current) ? current : sports.competitions[0]?.id || '');
    } catch (error) {
      if (request === publicRequest.current) notify(error.message);
    } finally {
      if (request === publicRequest.current) setLoading(false);
    }
  }, [notify]);

  const loadAdmin = useCallback(async () => {
    if (!token || !role || role === 'Parceiro autorizado') return;
    const request = ++adminRequest.current;
    try {
      const [overview, events, places, media] = await Promise.all(
        ['/admin/overview', '/admin/events', '/admin/tourism', '/admin/media'].map(path => api(path, { token }))
      );
      if (request === adminRequest.current) setAdmin({ token, data: { overview, adminEvents: events.items, adminPlaces: places.items, adminMedia: media.items } });
    } catch (error) {
      if (request !== adminRequest.current) return;
      if (error.status === 401) clearSession();
      notify(error.message);
    }
  }, [token, role, clearSession, notify]);

  useEffect(() => {
    if (publicEnabled) loadPublic();
    return () => { publicRequest.current++; };
  }, [publicEnabled, loadPublic]);
  useEffect(() => () => { adminRequest.current++; }, [token, role]);

  return { ...catalog, ...(admin && admin.token === token ? admin.data : emptyAdmin), loading, competition, setCompetition, loadPublic, loadAdmin };
}
