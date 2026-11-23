import { db } from './db/connection.js';

export function mediaItems(section, entityType = null, entityId = null) {
  const conditions = ['section=?', "status='Publicado'"], params = [section];
  if (entityType) {
    conditions.push('entity_type=?');
    params.push(entityType);
  }
  if (entityId) {
    conditions.push('entity_id=?');
    params.push(entityId);
  }
  return db.prepare(`SELECT id,section,entity_type entityType,entity_id entityId,title,alt_text altText,'/api/media/'||id||'/file' fileUrl,source_url sourceUrl,author,license_name licenseName,license_url licenseUrl,rights_note rightsNote,status,updated_at updatedAt FROM media_assets WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC,title`).all(...params);
}
export function attachPhotos(items, section, type) {
  return items.map(item => ({ ...item, photos: mediaItems(section, type, item.id) }));
}
export function publishedNews() {
  const items = db.prepare(`SELECT n.id,n.title,n.body,n.category,n.updated_at updatedAt,s.source_url sourceUrl
    FROM news n LEFT JOIN municipal_news_sources s ON s.news_id=n.id
    WHERE n.status='Publicado' ORDER BY n.updated_at DESC,n.id`).all();
  const photosByPlace = mediaItems('Turismo', 'tourist_point');
  return items.map(item => ({
    ...item,
    photos: [
      ...mediaItems(item.category === 'Esporte' ? 'Esporte' : 'Eventos', 'news', item.id),
      ...photosByPlace.filter(photo => item.sourceUrl && photo.sourceUrl === item.sourceUrl)
    ]
  }));
}
