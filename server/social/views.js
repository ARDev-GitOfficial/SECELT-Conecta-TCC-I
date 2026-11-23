export function socialViews(db, publishedNews) {
  const pageRows = () => db.prepare('SELECT * FROM social_pages WHERE active=1 ORDER BY kind,name').all();
  const pageView = p => ({ id: p.id, name: p.name, handle: p.handle, kind: p.kind, bio: p.bio, color: p.color, coverMediaId: p.cover_media_id });
  function mediaView(id) {
    return db.prepare(`SELECT id,title,alt_text altText,'/api/media/'||id||'/file' fileUrl,source_url sourceUrl,
      author,license_name licenseName,license_url licenseUrl,status,created_by createdBy FROM media_assets WHERE id=?`).get(id);
  }
  function toView(row, publicView = false) {
    const publisher = db.prepare('SELECT * FROM social_pages WHERE id=?').get(row.publisher_id);
    return {
      id: publicView ? row.root_id : row.id,
      rootId: row.root_id,
      replacesId: row.replaces_id,
      publisherId: row.publisher_id,
      publisher: pageView(publisher),
      type: row.type,
      format: row.format,
      title: row.title,
      caption: row.caption,
      category: row.category,
      media: JSON.parse(row.media_ids).map(mediaView).filter(m => m && (!publicView || m.status === 'Publicado')),
      eventId: row.event_id,
      recommended: !!row.recommended,
      baseLikes: row.base_likes,
      baseComments: row.base_comments,
      status: row.status,
      createdBy: row.created_by,
      publishedAt: row.published_at,
      updatedAt: row.updated_at
    };
  }
  function legacyPosts() {
    const publisher = pageView(db.prepare("SELECT * FROM social_pages WHERE id='secelt'").get());
    return publishedNews().map(n => ({
      id: `news-${n.id}`,
      rootId: `news-${n.id}`,
      publisherId: 'secelt',
      publisher,
      type: 'post',
      format: n.photos.length > 1 ? 'carousel' : n.photos.length ? 'photo' : 'text',
      title: n.title,
      caption: n.body,
      category: n.category,
      sourceUrl: n.sourceUrl,
      media: n.photos,
      eventId: null,
      recommended: false,
      baseLikes: 0,
      baseComments: 0,
      status: 'Publicado',
      publishedAt: n.updatedAt,
      updatedAt: n.updatedAt
    }));
  }
  function publicContent(type) {
    return db.prepare("SELECT c.* FROM social_content c JOIN social_pages p ON p.id=c.publisher_id WHERE c.type=? AND c.status='Publicado' AND p.active=1 ORDER BY c.published_at DESC,c.id").all(type).map(r => toView(r, true));
  }
  return { pageRows, pageView, mediaView, toView, legacyPosts, publicContent };
}
