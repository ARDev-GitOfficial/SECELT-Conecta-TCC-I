CREATE TABLE IF NOT EXISTS social_pages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('official','partner')),
  bio TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#389bf8',
  cover_media_id TEXT REFERENCES media_assets(id),
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS social_page_members (
  page_id TEXT NOT NULL REFERENCES social_pages(id),
  user_id INTEGER NOT NULL REFERENCES admin_users(id),
  PRIMARY KEY(page_id,user_id)
);
CREATE TABLE IF NOT EXISTS social_content (
  id TEXT PRIMARY KEY,
  root_id TEXT NOT NULL,
  replaces_id TEXT REFERENCES social_content(id),
  publisher_id TEXT NOT NULL REFERENCES social_pages(id),
  type TEXT NOT NULL CHECK(type IN ('post','story')),
  format TEXT NOT NULL CHECK(format IN ('photo','carousel','video','text')),
  title TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Comunidade',
  media_ids TEXT NOT NULL DEFAULT '[]',
  event_id TEXT REFERENCES events(id),
  recommended INTEGER NOT NULL DEFAULT 0,
  base_likes INTEGER NOT NULL DEFAULT 0,
  base_comments INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Rascunho' CHECK(status IN ('Rascunho','Aguardando Aprovação','Publicado','Reprovado','Arquivado')),
  created_by INTEGER REFERENCES admin_users(id),
  created_at TEXT NOT NULL,
  published_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS social_history (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES social_content(id),
  user_id INTEGER NOT NULL REFERENCES admin_users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS social_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_social_feed ON social_content(type,status,published_at);
CREATE INDEX IF NOT EXISTS idx_social_publisher ON social_content(publisher_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_live_root ON social_content(root_id) WHERE status='Publicado';
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_pending_root ON social_content(root_id) WHERE status IN ('Rascunho','Reprovado','Aguardando Aprovação');
