import { imageFormat, maxImageSize } from '../media/formats.js';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import { ROOT, MEDIA_DIR } from '../config.js';
import { requireUser, userFrom } from '../auth/session.js';
import { send, body } from '../http.js';
import { mediaItems } from '../catalog.js';

export async function mediaRoutes({ req, res, pathname, method, url }) {
  if (pathname === '/api/media' && method === 'GET') {
    const section = String(url.searchParams.get('section') || '').trim();
    if (section && !['Turismo', 'Esporte', 'Eventos'].includes(section)) return send(res, 400, { error: 'Módulo de fotos inválido.' });
    const items = section ? mediaItems(section) : ['Turismo', 'Esporte', 'Eventos'].flatMap(name => mediaItems(name));
    return send(res, 200, { items });
  }
  const mediaFile = pathname.match(/^\/api\/media\/([\w-]+)\/file$/);
  if (mediaFile && method === 'GET') {
    const item = db.prepare('SELECT file_path filePath,mime_type mimeType,status,created_by createdBy FROM media_assets WHERE id=?').get(mediaFile[1]);
    if (!item) return send(res, 404, { error: 'Imagem não encontrada.' });
    if (item.status !== 'Publicado') {
      const viewer = userFrom(req);
      if (!viewer || (viewer.role !== 'Administrador Geral' && viewer.id !== item.createdBy)) return send(res, 404, { error: 'Imagem não encontrada.' });
    }
    const file = resolve(ROOT, item.filePath),
      publicAssets = resolve(ROOT, 'web', 'public', 'assets'),
      privateUploads = resolve(MEDIA_DIR),
      within = (base) => file === base || file.startsWith(base + (process.platform === 'win32' ? '\\' : '/'));
    if (!(within(publicAssets) || within(privateUploads)) || !existsSync(file)) return send(res, 404, { error: 'Arquivo de imagem indisponível.' });
    res.writeHead(
      200,
      {
        'Content-Type': item.mimeType,
        'Cache-Control': item.status === 'Publicado' ? 'public, max-age=86400' : 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex'
      }
    );
    return res.end(readFileSync(file));
  }
  if (pathname === '/api/admin/media' && method === 'GET') {
    const a = requireUser(req, res);
    if (!a) return;
    const items = db.prepare(`SELECT id,section,entity_type entityType,entity_id entityId,title,alt_text altText,'/api/media/'||id||'/file' fileUrl,source_url sourceUrl,author,license_name licenseName,license_url licenseUrl,rights_note rightsNote,status,updated_at updatedAt,created_by createdBy FROM media_assets ${a.role === 'Administrador Geral' ? '' : 'WHERE status=\'Publicado\' OR created_by=?'} ORDER BY updated_at DESC,title`).all(...(a.role === 'Administrador Geral' ? [] : [a.id]));
    return send(res, 200, { items });
  }
  if (pathname === '/api/admin/media' && method === 'POST') {
    const a = requireUser(req, res);
    if (!a) return;
    const b = await body(req, 12e6);
    const sections = ['Turismo', 'Esporte', 'Eventos'],
      entities = { Turismo: ['municipality', 'tourist_point'], Esporte: ['competition', 'news'], Eventos: ['event', 'news'] };
    if (!sections.includes(b.section) || !entities[b.section]?.includes(b.entityType)) return send(res, 400, { error: 'Selecione um módulo e um tipo de vínculo válidos.' });
    if (!String(b.title || '').trim() || !String(b.altText || '').trim() || !String(b.author || '').trim() || !String(b.licenseName || '').trim() || !String(b.rightsNote || '').trim()) return send(res, 400, { error: 'Título, descrição da imagem, autoria, licença e comprovação de uso são obrigatórios.' });
    if (b.localityConfirmed !== true || b.rightsConfirmed !== true) return send(res, 400, { error: 'Confirme que a imagem é de São Miguel do Guamá e que pode ser usada no sistema.' });
    if (b.entityType === 'municipality' && b.entityId !== 'sao-miguel-do-guama') return send(res, 400, { error: 'A galeria municipal deve apontar para São Miguel do Guamá.' });
    if (b.entityType === 'tourist_point' && !db.prepare('SELECT id FROM tourist_points WHERE id=?').get(b.entityId)) return send(res, 400, { error: 'Ponto turístico não encontrado.' });
    if (b.entityType === 'event' && !db.prepare('SELECT id FROM events WHERE id=?').get(b.entityId)) return send(res, 400, { error: 'Evento não encontrado.' });
    if (b.entityType === 'competition' && !db.prepare('SELECT id FROM competitions WHERE id=?').get(b.entityId)) return send(res, 400, { error: 'Competição não encontrada.' });
    if (b.entityType === 'news' && !db.prepare('SELECT id FROM news WHERE id=?').get(b.entityId)) return send(res, 400, { error: 'Publicação não encontrada.' });
    const mimeType = String(b.mimeType || ''),
      format = imageFormat(mimeType),
      encoded = String(b.imageData || '').replace(/^data:image\/(?:jpeg|png|webp);base64,/i, '');
    if (!format || !encoded || encoded.length > 11e6) return send(res, 400, { error: 'Envie uma imagem JPG, PNG ou WebP com até 8 MB.' });
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > maxImageSize || !format.matches(bytes)) return send(res, 400, { error: 'O arquivo não corresponde ao formato informado ou excede 8 MB.' });
    if (b.sourceUrl) {
      try {
        const source = new URL(b.sourceUrl);
        if (!['https:', 'http:'].includes(source.protocol)) throw Error();
      } catch { return send(res, 400, { error: 'Informe um link de origem válido.' }); }
    }
    if (b.licenseUrl) {
      try { if (new URL(b.licenseUrl).protocol !== 'https:') throw Error(); } catch { return send(res, 400, { error: 'Informe um link de licença HTTPS válido.' }); }
    }
    const id = randomUUID(),
      fileName = `${id}.${format.extension}`,
      filePath = join(MEDIA_DIR, fileName),
      status = a.role === 'Administrador Geral' ? 'Publicado' : 'Rascunho',
      stamp = new Date().toISOString();
    try {
      writeFileSync(filePath, bytes, { flag: 'wx' });
      db.prepare(`INSERT INTO media_assets(id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,rights_note,status,created_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id,
        b.section,
        b.entityType,
        String(b.entityId || '').trim(),
        b.title.trim(),
        b.altText.trim(),
        `data/media/${fileName}`,
        mimeType,
        String(b.sourceUrl || '').trim(),
        b.author.trim(),
        b.licenseName.trim(),
        String(b.licenseUrl || '').trim(),
        b.rightsNote.trim(),
        status,
        a.id,
        stamp
      );
    } catch (error) {
      if (existsSync(filePath)) unlinkSync(filePath);
      throw error;
    }
    return send(
      res,
      201,
      {
        item: db.prepare(`SELECT id,section,entity_type entityType,entity_id entityId,title,alt_text altText,'/api/media/'||id||'/file' fileUrl,source_url sourceUrl,author,license_name licenseName,license_url licenseUrl,rights_note rightsNote,status,updated_at updatedAt,created_by createdBy FROM media_assets WHERE id=?`).get(id)
      }
    );
  }
  const mediaAdmin = pathname.match(/^\/api\/admin\/media\/([\w-]+)\/status$/);
  if (mediaAdmin && method === 'PATCH') {
    const a = requireUser(req, res);
    if (!a) return;
    const { status } = await body(req),
      current = db.prepare('SELECT status,created_by FROM media_assets WHERE id=?').get(mediaAdmin[1]);
    if (!current) return send(res, 404, { error: 'Foto não encontrada.' });
    if (status === 'Aguardando Aprovação') {
      if (!['Rascunho', 'Reprovado'].includes(current.status)) return send(res, 409, { error: 'Somente fotos em rascunho podem ser enviadas à revisão.' });
      if (a.role !== 'Administrador Geral' && current.created_by !== a.id) return send(res, 403, { error: 'Você só pode enviar suas próprias fotos.' });
    } else if (a.role !== 'Administrador Geral') return send(res, 403, { error: 'Esta ação exige o perfil Administrador Geral.' });
    if (!['Aguardando Aprovação', 'Publicado', 'Reprovado', 'Arquivado'].includes(status)) return send(res, 400, { error: 'Status inválido.' });
    if (status === 'Publicado' && current.status !== 'Aguardando Aprovação' && a.role !== 'Administrador Geral') return send(res, 409, { error: 'Somente fotos em revisão podem ser publicadas.' });
    db.prepare('UPDATE media_assets SET status=?,updated_at=? WHERE id=?').run(status, new Date().toISOString(), mediaAdmin[1]);
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'Rota não encontrada.' });
}
