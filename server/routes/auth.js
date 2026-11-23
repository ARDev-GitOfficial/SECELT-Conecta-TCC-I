import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '../db/connection.js';
import { requireUser, tokenHash } from '../auth/session.js';
import { send, body } from '../http.js';

export async function authRoutes({ req, res, pathname, method }) {
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = await body(req);
    const user = db.prepare(`SELECT u.id,u.name,u.email,u.password_hash hash,p.name role FROM admin_users u JOIN profiles p ON p.id=u.profile_id WHERE lower(u.email)=lower(?) AND u.active=1`).get(String(email || ''));
    if (!user || !timingSafeEqual(Buffer.from(user.hash, 'hex'), Buffer.from(scryptSync(String(password || ''), 'SECELT-DEMO-2026', 64).toString('hex'), 'hex'))) return send(res, 401, { error: 'E-mail ou senha incorretos.' });
    const raw = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(
      tokenHash(raw),
      user.id,
      new Date(Date.now() + 8 * 3600000).toISOString()
    );
    return send(res, 200, { token: raw, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    const a = requireUser(req, res);
    if (!a) return;
    return send(res, 200, { user: a });
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (t) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(t));
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'Rota não encontrada.' });
}
