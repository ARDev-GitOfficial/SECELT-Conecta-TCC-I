import { scryptSync } from 'node:crypto';
import { db } from '../db/connection.js';
import { requireUser } from '../auth/session.js';
import { send, body } from '../http.js';

export async function accountsRoutes({ req, res, pathname, method }) {
  if (pathname === '/api/admin/users' && method === 'GET') {
    if (!requireUser(req, res, true)) return;
    return send(
      res,
      200,
      {
        items: db.prepare('SELECT u.id,u.name,u.email,u.active,p.name role FROM admin_users u JOIN profiles p ON p.id=u.profile_id ORDER BY u.name').all()
      }
    );
  }
  if (pathname === '/api/admin/users' && method === 'POST') {
    if (!requireUser(req, res, true)) return;
    const b = await body(req);
    if (!b.name || !b.email || !String(b.email).includes('@') || String(b.password || '').length < 10) return send(res, 400, { error: 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.' });
    if (!['Editor SECELT', 'Administrador Geral'].includes(b.role)) return send(res, 400, { error: 'Perfil administrativo inválido.' });
    const profile = db.prepare('SELECT id FROM profiles WHERE name=?').get(b.role);
    try {
      const r = db.prepare('INSERT INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run(
        b.name.trim(),
        b.email.trim().toLowerCase(),
        scryptSync(String(b.password), 'SECELT-DEMO-2026', 64).toString('hex'),
        profile.id
      );
      return send(res, 201, { item: { id: r.lastInsertRowid, name: b.name, email: b.email, role: b.role, active: 1 } });
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) return send(res, 409, { error: 'Já existe uma conta com este e-mail.' });
      throw e;
    }
  }
  return send(res, 404, { error: 'Rota não encontrada.' });
}
