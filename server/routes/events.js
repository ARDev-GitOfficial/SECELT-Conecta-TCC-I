import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import { requireUser } from '../auth/session.js';
import { send, body } from '../http.js';
import { attachPhotos } from '../catalog.js';

function fmtLocal(d) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(d);
}
function oneEvent(id) {
  return db.prepare(`SELECT id,title,description,category,starts_at startsAt,ends_at endsAt,location,age_range ageRange,drink_rule drinkRule,organizer_type organizerType,is_free isFree,capacity,status,updated_at updatedAt FROM events WHERE id=?`).get(id);
}

export async function eventsRoutes({ req, res, pathname, method, url }) {
  if (pathname === '/api/events' && method === 'GET') {
    const items = db.prepare(`SELECT id,title,description,category,starts_at startsAt,ends_at endsAt,location,age_range ageRange,drink_rule drinkRule,organizer_type organizerType,is_free isFree,capacity,status,updated_at updatedAt FROM events WHERE status IN ('Publicado','Encerrado','Cancelado') ORDER BY starts_at`).all();
    return send(res, 200, { items: attachPhotos(items, 'Eventos', 'event') });
  }
  if (pathname === '/api/events' && method === 'POST') {
    const { name, email } = await body(req);
    if (!name || !email || !email.includes('@')) return send(res, 400, { error: 'Informe nome e e-mail válidos.' });
    const id = url.searchParams.get('id');
    if (!id) return send(res, 400, { error: 'Evento não informado.' });
    const ev = db.prepare(`SELECT id,capacity,status,(SELECT count(*) FROM registrations r WHERE r.event_id=events.id) used FROM events WHERE id=?`).get(id);
    if (!ev || ev.status !== 'Publicado') return send(res, 404, { error: 'Evento indisponível.' });
    if (ev.capacity > 0 && ev.used >= ev.capacity) return send(res, 409, { error: 'As vagas para este evento foram preenchidas.' });
    const citizen = db.prepare('SELECT id FROM citizens WHERE lower(email)=lower(?)').get(email);
    const cid = citizen?.id || randomUUID();
    if (!citizen) db.prepare('INSERT INTO citizens(id,name,email) VALUES(?,?,?)').run(cid, name, email);
    if (db.prepare('SELECT id FROM registrations WHERE event_id=? AND citizen_id=?').get(id, cid)) return send(res, 409, { error: 'Este e-mail já está inscrito neste evento.' });
    const reg = randomUUID(), qr = randomBytes(24).toString('hex');
    db.prepare('INSERT INTO registrations(id,event_id,citizen_id,qr_hash,created_at) VALUES(?,?,?,?,?)').run(
      reg,
      id,
      cid,
      createHash('sha256').update(qr).digest('hex'),
      new Date().toISOString()
    );
    return send(res, 201, { registrationId: reg, qrCode: qr, eventId: id });
  }
  if (pathname === '/api/admin/events' && method === 'GET') {
    if (!requireUser(req, res)) return;
    const items = db.prepare(`SELECT id,title,description,category,starts_at startsAt,ends_at endsAt,location,age_range ageRange,drink_rule drinkRule,organizer_type organizerType,is_free isFree,capacity,status,updated_at updatedAt FROM events ORDER BY updated_at DESC`).all();
    return send(res, 200, { items: attachPhotos(items, 'Eventos', 'event') });
  }
  if (pathname === '/api/admin/events' && method === 'POST') {
    const a = requireUser(req, res);
    if (!a) return;
    const b = await body(req);
    if (!b.title || !b.startsAt || !b.location) return send(res, 400, { error: 'Título, data e local são obrigatórios.' });
    const id = randomUUID();
    db.prepare(`INSERT INTO events(id,title,description,category,starts_at,ends_at,location,age_range,drink_rule,organizer_type,is_free,capacity,status,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id,
      b.title,
      b.description || '',
      b.category || 'Cultura',
      b.startsAt,
      b.endsAt || null,
      b.location,
      b.ageRange || 'Livre',
      b.drinkRule || 'Não informado',
      b.organizerType || 'Prefeitura',
      b.isFree === false ? 0 : 1,
      Math.max(0, Number(b.capacity) || 0),
      'Rascunho',
      new Date().toISOString(),
      a.id
    );
    return send(res, 201, { item: oneEvent(id) });
  }
  const eventMatch = pathname.match(/^\/api\/admin\/events\/([\w-]+)(?:\/(status|registrations|history))?$/);
  if (eventMatch) {
    const [, id, action] = eventMatch;
    if (method === 'PATCH' && action === 'status') {
      const a = requireUser(req, res);
      if (!a) return;
      const { status, note } = await body(req);
      const allowed = ['Aguardando Aprovação', 'Publicado', 'Reprovado', 'Encerrado', 'Cancelado'];
      if (!allowed.includes(status)) return send(res, 400, { error: 'Status inválido.' });
      const current = db.prepare('SELECT status,created_by FROM events WHERE id=?').get(id);
      if (!current) return send(res, 404, { error: 'Evento não encontrado.' });
      if (status === 'Aguardando Aprovação') {
        if (!['Rascunho', 'Reprovado'].includes(current.status)) return send(res, 409, { error: 'Somente rascunhos e conteúdos devolvidos podem ir para aprovação.' });
        if (a.role === 'Editor SECELT' && current.created_by !== a.id) return send(res, 403, { error: 'Você só pode enviar seus próprios rascunhos.' });
      } else if (a.role !== 'Administrador Geral') return send(res, 403, { error: 'Esta ação exige o perfil Administrador Geral.' });
      if (['Publicado', 'Reprovado'].includes(status) && current.status !== 'Aguardando Aprovação') return send(res, 409, { error: 'A decisão só pode ser registrada enquanto o conteúdo aguarda aprovação.' });
      if (['Encerrado', 'Cancelado'].includes(status) && current.status !== 'Publicado') return send(res, 409, { error: 'Somente um conteúdo publicado pode ser encerrado ou cancelado.' });
      const stamp = new Date().toISOString();
      db.prepare('UPDATE events SET status=?,updated_at=? WHERE id=?').run(status, stamp, id);
      db.prepare('INSERT INTO approval_history(id,event_id,user_id,from_status,to_status,note,created_at) VALUES(?,?,?,?,?,?,?)').run(
        randomUUID(),
        id,
        a.id,
        current.status,
        status,
        note || null,
        stamp
      );
      if (status === 'Publicado') {
        const ev = oneEvent(id);
        db.prepare('INSERT INTO news(id,title,body,category,status,updated_at) VALUES(?,?,?,?,?,?)').run(
          randomUUID(),
          `Calendário atualizado: ${ev.title}`,
          `A SECELT atualizou a agenda oficial em ${fmtLocal(new Date(stamp))}.`,
          'Calendário',
          'Publicado',
          stamp
        );
      }
      return send(res, 200, { item: oneEvent(id) });
    }
    if (method === 'PUT' && !action) {
      const a = requireUser(req, res);
      if (!a) return;
      const b = await body(req);
      const current = db.prepare('SELECT status,created_by FROM events WHERE id=?').get(id);
      if (!current) return send(res, 404, { error: 'Evento não encontrado.' });
      if (!b.title?.trim() || !b.startsAt || !b.location?.trim()) return send(res, 400, { error: 'Título, data e local são obrigatórios.' });
      if (a.role === 'Editor SECELT' && (!['Rascunho', 'Reprovado'].includes(current.status) || current.created_by !== a.id)) return send(res, 403, { error: 'Você só pode ajustar seus próprios rascunhos.' });
      if (a.role === 'Administrador Geral' && !['Rascunho', 'Reprovado', 'Publicado'].includes(current.status)) return send(res, 409, { error: 'Um item aguardando decisão não pode ser editado.' });
      const stamp = new Date().toISOString();
      db.prepare(`UPDATE events SET title=?,description=?,category=?,starts_at=?,ends_at=?,location=?,age_range=?,drink_rule=?,organizer_type=?,is_free=?,capacity=?,updated_at=? WHERE id=?`).run(
        b.title.trim(),
        b.description || '',
        b.category || 'Cultura',
        b.startsAt,
        b.endsAt || null,
        b.location.trim(),
        b.ageRange || 'Livre',
        b.drinkRule || 'Não informado',
        b.organizerType || 'Prefeitura',
        b.isFree === false ? 0 : 1,
        Math.max(0, Number(b.capacity) || 0),
        stamp,
        id
      );
      if (current.status === 'Publicado') db.prepare('INSERT INTO news(id,title,body,category,status,updated_at) VALUES(?,?,?,?,?,?)').run(
        randomUUID(),
        `Calendário atualizado: ${b.title.trim()}`,
        `A SECELT atualizou a agenda oficial em ${fmtLocal(new Date(stamp))}.`,
        'Calendário',
        'Publicado',
        stamp
      );
      return send(res, 200, { item: oneEvent(id) });
    }
    if (method === 'GET' && action === 'history') {
      if (!requireUser(req, res)) return;
      return send(
        res,
        200,
        {
          items: db.prepare(`SELECT h.id,h.from_status fromStatus,h.to_status toStatus,h.note,h.created_at createdAt,u.name user FROM approval_history h JOIN admin_users u ON u.id=h.user_id WHERE h.event_id=? ORDER BY h.created_at DESC`).all(id)
        }
      );
    }
    if (method === 'GET' && action === 'registrations') {
      if (!requireUser(req, res, true)) return;
      return send(
        res,
        200,
        {
          items: db.prepare(`SELECT r.id,c.name,c.email,r.created_at createdAt,r.checkin_status checkinStatus FROM registrations r JOIN citizens c ON c.id=r.citizen_id WHERE r.event_id=? ORDER BY r.created_at`).all(id)
        }
      );
    }
  }
  return send(res, 404, { error: 'Rota não encontrada.' });
}
