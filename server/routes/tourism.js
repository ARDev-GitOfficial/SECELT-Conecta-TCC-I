import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import { mapsPhotosEnabled } from '../config.js';
import { requireUser } from '../auth/session.js';
import { send, body } from '../http.js';
import { mediaItems, attachPhotos } from '../catalog.js';

const coordinate = value => value === null || value === undefined || String(value).trim() === ''
  ? null
  : (Number.isFinite(Number(value)) ? Number(value) : null);

export async function tourismRoutes({ req, res, pathname, method, url }) {
  if (pathname === '/api/tourism' && method === 'GET') {
    const items = db.prepare(`SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt FROM tourist_points WHERE status='Publicado' ORDER BY name`).all();
    return send(res, 200, { items: attachPhotos(items, 'Turismo', 'tourist_point'), gallery: mediaItems('Turismo'), googlePhotosEnabled: mapsPhotosEnabled });
  }
  const touristVisual = pathname.match(/^\/api\/tourism\/([\w-]+)\/(visual|photo)$/);
  if (touristVisual && method === 'GET') {
    const [, id, kind] = touristVisual;
    const point = db.prepare('SELECT id,place_id placeId FROM tourist_points WHERE id=? AND status=\'Publicado\'').get(id);
    if (!point) return send(res, 404, { error: 'Ponto turístico não encontrado.' });
    if (!mapsPhotosEnabled || !point.placeId) return send(res, 404, { error: 'Foto da API indisponível; exibindo imagem local.' });
    try {
      if (kind === 'visual') {
        const response = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(point.placeId)}`,
          { headers: { 'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY, 'X-Goog-FieldMask': 'photos,googleMapsUri' } }
        );
        if (!response.ok) throw Error('Não foi possível consultar a foto deste local.');
        const details = await response.json(),
          sourceUrl = details.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(point.placeId)}`;
        const photos = (details.photos || []).slice(0, 10).map(photo => ({
          photoName: photo.name,
          authorAttributions: (photo.authorAttributions || []).map(x => ({ displayName: x.displayName, uri: x.uri?.startsWith('//') ? `https:${x.uri}` : x.uri })).filter(x => x.displayName),
          source: 'Google Maps',
          sourceUrl
        }));
        if (!photos.length) return send(res, 404, { error: 'Este local ainda não tem fotos disponíveis.' });
        return send(res, 200, { photos, source: 'Google Maps', sourceUrl });
      }
      const photoName = url.searchParams.get('name') || '';
      if (!new RegExp(`^places/${point.placeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/photos/[A-Za-z0-9_-]+$`).test(photoName)) return send(res, 400, { error: 'Foto não vinculada a este ponto turístico.' });
      const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
      mediaUrl.searchParams.set('maxWidthPx', '1200');
      mediaUrl.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY);
      const response = await fetch(mediaUrl, { redirect: 'follow' });
      if (!response.ok) throw Error('A foto não está disponível agora.');
      res.writeHead(
        200,
        {
          'Content-Type': response.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      );
      return res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      return send(res, 502, { error: error.message || 'Falha ao consultar imagem do Google Maps.' });
    }
  }
  if (pathname === '/api/admin/tourism' && method === 'GET') {
    const a = requireUser(req, res);
    if (!a) return;
    const ownOnly = a.role !== 'Administrador Geral';
    const items = db.prepare(`SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt,created_by createdBy FROM tourist_points ${ownOnly ? "WHERE status='Publicado' OR created_by=?" : ""} ORDER BY updated_at DESC,name`).all(...(ownOnly ? [a.id] : []));
    return send(res, 200, { items: items.map(p => ({ ...p, photos: mediaItems('Turismo', 'tourist_point', p.id) })), googlePhotosEnabled: mapsPhotosEnabled });
  }
  if (pathname === '/api/admin/maps/places' && method === 'GET') {
    const a = requireUser(req, res);
    if (!a) return;
    if (!mapsPhotosEnabled) return send(res, 503, { error: 'Busca de fotos desligada. Configure GOOGLE_MAPS_API_KEY e GOOGLE_MAPS_PHOTOS_ENABLED=true no servidor.' });
    const query = String(url.searchParams.get('q') || '').trim();
    if (query.length < 3) return send(res, 400, { error: 'Digite pelo menos três letras para buscar.' });
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
        },
        body: JSON.stringify({ textQuery: `${query}, São Miguel do Guamá, Pará`, languageCode: 'pt-BR', maxResultCount: 5 })
      }
    );
    if (!response.ok) return send(res, 502, { error: 'Não foi possível pesquisar locais no Google Maps.' });
    const result = await response.json();
    return send(
      res,
      200,
      {
        items: (result.places || []).map(x => ({ placeId: x.id, suggestion: x.displayName?.text || 'Local encontrado', addressSuggestion: x.formattedAddress || '' }))
      }
    );
  }
  if (pathname === '/api/admin/tourism' && method === 'POST') {
    const a = requireUser(req, res);
    if (!a) return;
    const b = await body(req);
    if (!b.name?.trim() || !b.address?.trim()) return send(res, 400, { error: 'Nome e endereço são obrigatórios.' });
    const id = randomUUID(), stamp = new Date().toISOString(), status = 'Rascunho';
    db.prepare(`INSERT INTO tourist_points(id,name,description,category,address,latitude,longitude,image_url,status,place_id,created_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id,
      b.name.trim(),
      String(b.description || ''),
      b.category || 'Lazer',
      b.address.trim(),
      coordinate(b.latitude),
      coordinate(b.longitude),
      null,
      status,
      b.placeId || null,
      a.id,
      stamp
    );
    return send(
      res,
      201,
      {
        item: db.prepare('SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt,created_by createdBy FROM tourist_points WHERE id=?').get(id)
      }
    );
  }
  const touristAdmin = pathname.match(/^\/api\/admin\/tourism\/([\w-]+)(?:\/(status))?$/);
  if (touristAdmin) {
    const [, id, action] = touristAdmin;
    if (method === 'PUT' && !action) {
      const a = requireUser(req, res);
      if (!a) return;
      const b = await body(req);
      const current = db.prepare('SELECT status,created_by FROM tourist_points WHERE id=?').get(id);
      if (!current) return send(res, 404, { error: 'Ponto turístico não encontrado.' });
      if (a.role !== 'Administrador Geral' && (!['Rascunho', 'Reprovado'].includes(current.status) || current.created_by !== a.id)) return send(res, 403, { error: 'Você só pode editar seus próprios rascunhos.' });
      if (!b.name?.trim() || !b.address?.trim()) return send(res, 400, { error: 'Nome e endereço são obrigatórios.' });
      const stamp = new Date().toISOString();
      db.prepare(`UPDATE tourist_points SET name=?,description=?,category=?,address=?,latitude=?,longitude=?,image_url=NULL,place_id=?,updated_at=? WHERE id=?`).run(
        b.name.trim(),
        String(b.description || ''),
        b.category || 'Lazer',
        b.address.trim(),
        coordinate(b.latitude),
        coordinate(b.longitude),
        b.placeId || null,
        stamp,
        id
      );
      return send(
        res,
        200,
        {
          item: db.prepare('SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt,created_by createdBy FROM tourist_points WHERE id=?').get(id)
        }
      );
    }
    if (method === 'PATCH' && action === 'status') {
      const a = requireUser(req, res);
      if (!a) return;
      const { status } = await body(req);
      const current = db.prepare('SELECT status,created_by FROM tourist_points WHERE id=?').get(id);
      if (!current) return send(res, 404, { error: 'Ponto turístico não encontrado.' });
      if (status === 'Aguardando Aprovação') {
        if (!['Rascunho', 'Reprovado'].includes(current.status)) return send(res, 409, { error: 'Somente rascunhos podem ser enviados para revisão.' });
        if (a.role === 'Editor SECELT' && current.created_by !== a.id) return send(res, 403, { error: 'Você só pode enviar seus próprios rascunhos.' });
      } else if (a.role !== 'Administrador Geral') return send(res, 403, { error: 'Esta ação exige o perfil Administrador Geral.' });
      if (status === 'Publicado' && current.status !== 'Aguardando Aprovação') return send(res, 409, { error: 'Somente itens em revisão podem ser publicados.' });
      if (!['Aguardando Aprovação', 'Publicado', 'Reprovado', 'Arquivado'].includes(status)) return send(res, 400, { error: 'Status inválido.' });
      db.prepare('UPDATE tourist_points SET status=?,updated_at=? WHERE id=?').run(status, new Date().toISOString(), id);
      return send(res, 200, { ok: true });
    }
  }
  return send(res, 404, { error: 'Rota não encontrada.' });
}
