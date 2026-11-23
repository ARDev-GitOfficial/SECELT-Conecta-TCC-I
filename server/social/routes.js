import { randomUUID } from 'node:crypto';
import { socialViews } from './views.js';
import { socialEditorial } from './editorial.js';
import { CATEGORIES, editable, clean, fail } from './rules.js';

export function createSocial({ db, ROOT, MEDIA_DIR, userFrom, send, body, publishedNews }) {
  const { pageRows, pageView, mediaView, toView, legacyPosts, publicContent } = socialViews(db, publishedNews);
  const { actor, canManage, own, transaction, history, validate, upload } = socialEditorial({ db, userFrom, mediaView, body, ROOT, MEDIA_DIR });
  async function route(req, res, url) {
    const path = url.pathname, method = req.method;
    if (!path.startsWith('/api/social/') && !path.startsWith('/api/admin/social')) return false;
    try {
      if (method === 'GET' && path === '/api/social/feed') {
        send(res, 200, { items: [...publicContent('post'), ...legacyPosts()], pages: pageRows().map(pageView), stories: publicContent('story') });
        return true;
      }
      if (method === 'GET' && path === '/api/social/pages') {
        send(res, 200, { items: pageRows().map(pageView) });
        return true;
      }
      const publicPost = path.match(/^\/api\/social\/posts\/([\w-]+)$/);
      if (publicPost && method === 'GET') {
        const post = [...publicContent('post'), ...legacyPosts()].find(p => p.id === publicPost[1]);
        if (!post) fail('Publicação não encontrada.', 404);
        send(res, 200, { item: post });
        return true;
      }
      if (method === 'GET' && path === '/api/social/stories') {
        send(res, 200, { items: publicContent('story') });
        return true;
      }
      if (!path.startsWith('/api/admin/social')) fail('Página não encontrada.', 404);
      const user = actor(req);
      if (path === '/api/admin/social' && method === 'GET') {
        const pages = pageRows().filter(p => canManage(user, p.id)).map(pageView);
        const items = db.prepare('SELECT * FROM social_content ORDER BY updated_at DESC,id').all().filter(p => canManage(user, p.publisher_id)).map(r => toView(r));
        const media = db.prepare("SELECT id FROM media_assets WHERE status='Publicado' OR created_by=? ORDER BY updated_at DESC,id").all(user.id).map(m => mediaView(m.id));
        send(
          res,
          200,
          {
            pages,
            items,
            media,
            categories: CATEGORIES,
            history: db.prepare('SELECT * FROM social_history ORDER BY created_at DESC').all().filter(h => items.some(i => i.id === h.content_id))
          }
        );
        return true;
      }
      if (path === '/api/admin/social/media' && method === 'POST') {
        send(res, 201, await upload(req, user));
        return true;
      }
      const pageMatch = path.match(/^\/api\/admin\/social\/pages\/([\w-]+)$/);
      if (pageMatch && method === 'PUT') {
        if (!canManage(user, pageMatch[1])) fail('Página não autorizada.', 403);
        const input = await body(req), name = clean(input.name, 100), bio = clean(input.bio, 500);
        if (!name) fail('Informe o nome da página.');
        const result = db.prepare('UPDATE social_pages SET name=?,bio=? WHERE id=?').run(name, bio, pageMatch[1]);
        if (!result.changes) fail('Página não encontrada.', 404);
        send(res, 200, { ok: true });
        return true;
      }
      if (path === '/api/admin/social/content' && method === 'POST') {
        const input = validate(await body(req), user), id = randomUUID(), stamp = new Date().toISOString();
        transaction(() => {
          db.prepare(`INSERT INTO social_content(id,root_id,publisher_id,type,format,title,caption,category,media_ids,event_id,recommended,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            id,
            id,
            input.publisherId,
            input.type,
            input.format,
            input.title,
            input.caption,
            input.category,
            JSON.stringify(input.mediaIds),
            input.eventId,
            Number(input.recommended),
            user.id,
            stamp,
            stamp
          );
          history(id, user, null, 'Rascunho');
        });
        send(res, 201, { item: toView(db.prepare('SELECT * FROM social_content WHERE id=?').get(id)) });
        return true;
      }
      const match = path.match(/^\/api\/admin\/social\/content\/([\w-]+)(?:\/(status|revision))?$/);
      if (!match) fail('Rota não encontrada.', 404);
      const [, id, action] = match, current = own(user, id);
      if (method === 'PUT' && !action) {
        const payload = await body(req), fresh = own(user, id);
        if (!editable.includes(fresh.status)) fail('Crie uma nova versão para alterar um conteúdo publicado ou aguarde a revisão.', 409);
        const input = validate(payload, user, fresh);
        db.prepare('UPDATE social_content SET format=?,title=?,caption=?,category=?,media_ids=?,event_id=?,recommended=?,updated_at=? WHERE id=?').run(
          input.format,
          input.title,
          input.caption,
          input.category,
          JSON.stringify(input.mediaIds),
          input.eventId,
          Number(input.recommended),
          new Date().toISOString(),
          id
        );
        send(res, 200, { item: toView(db.prepare('SELECT * FROM social_content WHERE id=?').get(id)) });
        return true;
      }
      if (method === 'POST' && action === 'revision') {
        if (current.status !== 'Publicado') fail('Somente conteúdo publicado pode receber uma nova versão.', 409);
        if (db.prepare("SELECT 1 FROM social_content WHERE root_id=? AND status IN ('Rascunho','Reprovado','Aguardando Aprovação')").get(current.root_id)) fail('Esta publicação já tem uma versão em preparação.', 409);
        const next = randomUUID(), stamp = new Date().toISOString();
        transaction(() => {
          db.prepare(`INSERT INTO social_content(id,root_id,replaces_id,publisher_id,type,format,title,caption,category,media_ids,event_id,recommended,base_likes,base_comments,status,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            next,
            current.root_id,
            id,
            current.publisher_id,
            current.type,
            current.format,
            current.title,
            current.caption,
            current.category,
            current.media_ids,
            current.event_id,
            current.recommended,
            current.base_likes,
            current.base_comments,
            'Rascunho',
            user.id,
            stamp,
            stamp
          );
          history(next, user, null, 'Rascunho', 'Nova versão');
        });
        send(res, 201, { item: toView(db.prepare('SELECT * FROM social_content WHERE id=?').get(next)) });
        return true;
      }
      if (method === 'PATCH' && action === 'status') {
        const { status, note } = await body(req), isAdmin = user.role === 'Administrador Geral';
        if (status === 'Aguardando Aprovação') {
          if (!editable.includes(current.status)) fail('Somente rascunhos ou devolvidos podem ir à revisão.', 409);
        }
        else if (['Publicado', 'Reprovado'].includes(status)) {
          if (!isAdmin) fail('Somente a SECELT pode decidir a aprovação.', 403);
          if (current.status !== 'Aguardando Aprovação') fail('Envie o conteúdo à revisão antes da decisão.', 409);
        } else if (status === 'Arquivado') {
          if (current.status === 'Arquivado') fail('O conteúdo já foi retirado.', 409);
          if (current.replaces_id && current.status === 'Publicado' && !isAdmin && !canManage(user, current.publisher_id)) fail('Página não autorizada.', 403);
        } else fail('Status inválido.');
        const stamp = new Date().toISOString();
        transaction(() => {
          const fresh = own(user, id);
          if (fresh.status !== current.status || fresh.updated_at !== current.updated_at) fail('Este conteúdo foi atualizado. Recarregue a lista para continuar.', 409);
          if (status === 'Publicado') {
            const replaced = db.prepare("SELECT id,status FROM social_content WHERE root_id=? AND status='Publicado' AND id<>?").all(current.root_id, id);
            db.prepare("UPDATE social_content SET status='Arquivado',updated_at=? WHERE root_id=? AND status='Publicado' AND id<>?").run(
              stamp,
              current.root_id,
              id
            );
            for (const previous of replaced) history(previous.id, user, previous.status, 'Arquivado', 'Substituída pela nova versão aprovada.');
            for (const mediaId of JSON.parse(current.media_ids)) db.prepare("UPDATE media_assets SET status='Publicado',updated_at=? WHERE id=? AND entity_type='social'").run(stamp, mediaId);
          }
          db.prepare('UPDATE social_content SET status=?,published_at=CASE WHEN ?=\'Publicado\' THEN ? ELSE published_at END,updated_at=? WHERE id=?').run(
            status,
            status,
            current.published_at || stamp,
            stamp,
            id
          );
          history(id, user, current.status, status, note);
        });
        send(res, 200, { item: toView(db.prepare('SELECT * FROM social_content WHERE id=?').get(id)) });
        return true;
      }
      fail('Método não permitido.', 405);
    } catch (error) {
      send(res, error.status || (error.message === 'Payload too large' ? 413 : 400), { error: error.message || 'Não foi possível concluir.' });
      return true;
    }
  }
  return { route };
}
