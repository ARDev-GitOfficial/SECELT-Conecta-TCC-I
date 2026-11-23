import { initializeDatabase } from './db/initialize.js';
import { db } from './db/connection.js';
import { ROOT, MEDIA_DIR } from './config.js';
import { userFrom, requireUser } from './auth/session.js';
import { send, body } from './http.js';
import { publishedNews } from './catalog.js';
import { createSocial } from './social/routes.js';
import { authRoutes } from './routes/auth.js';
import { eventsRoutes } from './routes/events.js';
import { tourismRoutes } from './routes/tourism.js';
import { mediaRoutes } from './routes/media.js';
import { sportsRoutes } from './routes/sports.js';
import { accountsRoutes } from './routes/accounts.js';

initializeDatabase();
const social = createSocial({ db, ROOT, MEDIA_DIR, userFrom, send, body, publishedNews });
const routes = new Map([
  ['auth', authRoutes],
  ['events', eventsRoutes],
  ['tourism', tourismRoutes],
  ['maps', tourismRoutes],
  ['media', mediaRoutes],
  ['sports', sportsRoutes],
  ['competitions', sportsRoutes],
  ['teams', sportsRoutes],
  ['users', accountsRoutes]
]);
export async function route(req, res) {
  const url = new URL(req.url, 'http://localhost'), pathname = url.pathname, method = req.method;
  if (await social.route(req, res, url)) return;
  if (pathname.startsWith('/api/admin/') && userFrom(req)?.role === 'Parceiro autorizado') return send(res, 403, { error: 'Este acesso permite apenas gerenciar as publicações das suas páginas.' });
  if (pathname === '/api/health') return send(res, 200, { ok: true, database: 'SQLite', persistent: true });
  if (pathname === '/api/news' && method === 'GET') {
    return send(res, 200, { items: publishedNews() });
  }
  if (pathname === '/api/admin/overview' && method === 'GET') {
    if (!requireUser(req, res)) return;
    return send(
      res,
      200,
      {
        pending: db.prepare(`SELECT count(*) n FROM events WHERE status='Aguardando Aprovação'`).get().n,
        published: db.prepare(`SELECT count(*) n FROM events WHERE status='Publicado'`).get().n,
        activeUsers: db.prepare(`SELECT count(*) n FROM admin_users WHERE active=1`).get().n,
        registrations: db.prepare('SELECT count(*) n FROM registrations').get().n,
        calendarUpdated: db.prepare(`SELECT max(updated_at) v FROM events WHERE status='Publicado'`).get().v
      }
    );
  }
  const [, , area, resource] = pathname.split('/');
  const handler = routes.get(area === 'admin' ? resource : area);
  if (handler) return handler({ req, res, url, pathname, method });
  return send(res, 404, { error: 'Rota não encontrada.' });
}
