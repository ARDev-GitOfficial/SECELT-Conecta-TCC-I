import { createHash } from 'node:crypto';
import { db } from '../db/connection.js';
import { send } from '../http.js';

export const tokenHash = t => createHash('sha256').update(t).digest('hex');
export function userFrom(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  return db.prepare(`SELECT u.id,u.name,u.email,p.name role FROM sessions s JOIN admin_users u ON u.id=s.user_id JOIN profiles p ON p.id=u.profile_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).get(
    tokenHash(t),
    new Date().toISOString()
  ) || null;
}
export function requireUser(req, res, admin = false) {
  const u = userFrom(req);
  if (!u) {
    send(res, 401, { error: 'Entre na área administrativa para continuar.' });
    return null;
  }
  if (admin && u.role !== 'Administrador Geral') {
    send(res, 403, { error: 'Esta ação exige o perfil Administrador Geral.' });
    return null;
  }
  return u;
}
