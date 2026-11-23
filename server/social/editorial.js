import { imageFormat, maxImageSize } from '../media/formats.js';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CATEGORIES, PARTNER_ROLE, fail, clean, safeLink } from './rules.js';

export function socialEditorial({ db, userFrom, mediaView, body, ROOT, MEDIA_DIR }) {
  function actor(req) {
    const user = userFrom(req);
    if (!user) fail('Entre na área de publicação para continuar.', 401);
    if (!['Administrador Geral', 'Editor SECELT', PARTNER_ROLE].includes(user.role)) fail('Acesso indisponível.', 403);
    return user;
  }
  function canManage(user, pageId) {
    return user.role === 'Administrador Geral' || !!db.prepare('SELECT 1 FROM social_page_members WHERE page_id=? AND user_id=?').get(pageId, user.id);
  }
  function own(user, id) {
    const row = db.prepare('SELECT * FROM social_content WHERE id=?').get(id);
    if (!row) fail('Publicação não encontrada.', 404);
    if (!canManage(user, row.publisher_id)) fail('Você só pode gerenciar conteúdos das suas páginas.', 403);
    return row;
  }
  function transaction(callback) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      db.exec('COMMIT');
      return result;
    }
    catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  function history(id, user, from, to, note = '') {
    db.prepare('INSERT INTO social_history VALUES(?,?,?,?,?,?,?)').run(
      randomUUID(),
      id,
      user.id,
      from,
      to,
      clean(note, 1000),
      new Date().toISOString()
    );
  }
  function validate(input, user, current) {
    const publisherId = clean(input.publisherId, 100);
    if (!db.prepare('SELECT 1 FROM social_pages WHERE id=? AND active=1').get(publisherId) || !canManage(user, publisherId)) fail('Escolha uma página que você pode gerenciar.', 403);
    if (current && current.publisher_id !== publisherId) fail('A página autora não pode ser alterada.');
    const type = input.type, format = input.format, title = clean(input.title, 160), caption = clean(input.caption);
    if (!['post', 'story'].includes(type) || !['photo', 'carousel', 'video', 'text'].includes(format)) fail('Escolha um tipo e um formato válidos.');
    if (current && type !== current.type) fail('O tipo do conteúdo não pode ser alterado.');
    if (!title || !caption) fail('Preencha o título e a legenda.');
    if (!CATEGORIES.includes(input.category)) fail('Escolha uma categoria válida.');
    const mediaIds = Array.isArray(input.mediaIds) ? [...new Set(input.mediaIds.map(String))] : [];
    if (mediaIds.length > 10) fail('Use no máximo dez fotos.');
    if ((format !== 'text' || type === 'story') && !mediaIds.length) fail('Escolha ao menos uma foto ou capa.');
    if (['photo', 'video'].includes(format) && mediaIds.length !== 1) fail('Escolha uma única foto ou capa para este formato.');
    if (type === 'story' && !['photo', 'video'].includes(format)) fail('Stories usam uma foto ou uma capa de vídeo.');
    for (const id of mediaIds) {
      const media = mediaView(id);
      if (!media || (media.status !== 'Publicado' && user.role !== 'Administrador Geral' && media.createdBy !== user.id)) fail('Uma das imagens não está disponível para esta página.');
    }
    const eventId = input.eventId || null;
    if (eventId && !db.prepare("SELECT 1 FROM events WHERE id=? AND status IN ('Publicado','Encerrado','Cancelado')").get(eventId)) fail('O evento vinculado não está disponível.');
    return {
      publisherId,
      type,
      format,
      title,
      caption,
      category: input.category,
      mediaIds,
      eventId,
      recommended: user.role === 'Administrador Geral' ? !!input.recommended : !!current?.recommended
    };
  }
  async function upload(req, user) {
    const input = await body(req, 12e6), publisherId = clean(input.publisherId, 100);
    if (!canManage(user, publisherId) || !db.prepare('SELECT 1 FROM social_pages WHERE id=?').get(publisherId)) fail('Página não autorizada.', 403);
    const format = imageFormat(input.mimeType);
    if (!format || typeof input.imageData !== 'string' || !input.imageData.startsWith(`data:${input.mimeType};base64,`)) fail('Envie uma foto JPG, PNG ou WebP.');
    const bytes = Buffer.from(input.imageData.split(',')[1], 'base64');
    if (bytes.length > maxImageSize || !format.matches(bytes)) fail('Foto inválida ou maior que 8 MB.');
    if (!clean(input.altText, 500) || !clean(input.author, 160) || !clean(input.licenseName, 160) || input.rightsConfirmed !== true) fail('Informe a descrição, autoria, licença e confirme a autorização de uso.');
    const sourceUrl = safeLink(input.sourceUrl), licenseUrl = safeLink(input.licenseUrl);
    const id = randomUUID(), file = join(MEDIA_DIR, `${id}.${format.extension}`);
    try {
      writeFileSync(file, bytes, { flag: 'wx' });
      db.prepare(`INSERT INTO media_assets(id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,rights_note,status,created_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id,
        'Eventos',
        'social',
        publisherId,
        clean(input.altText, 160),
        clean(input.altText, 500),
        relative(ROOT, file).replaceAll('\\', '/'),
        input.mimeType,
        sourceUrl,
        clean(input.author, 160),
        clean(input.licenseName, 160),
        licenseUrl,
        'Uso autorizado pelo responsável pelo envio.',
        'Rascunho',
        user.id,
        new Date().toISOString()
      );
    } catch (error) {
      try { unlinkSync(file); } catch { }
      throw error;
    }
    return { item: mediaView(id) };
  }
  return { actor, canManage, own, transaction, history, validate, upload };
}
