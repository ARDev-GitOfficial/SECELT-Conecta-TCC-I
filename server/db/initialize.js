import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../config.js';
import { db } from './connection.js';
import { seedCatalog } from './seed.js';
import { seedSocial } from './social-seed.js';

export function initializeDatabase() {
  db.exec(readFileSync(join(ROOT, 'database', 'schema.sql'), 'utf8'));
  const touristColumns = new Set(db.prepare('PRAGMA table_info(tourist_points)').all().map(c => c.name));
  for (const [name, type] of [['place_id', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']]) if (!touristColumns.has(name)) db.exec(`ALTER TABLE tourist_points ADD COLUMN ${name} ${type}`);
  const now = new Date().toISOString();
  db.prepare('UPDATE tourist_points SET updated_at=? WHERE updated_at IS NULL').run(now);
  seedCatalog(db, now);
  db.exec(readFileSync(join(ROOT, 'database', 'social.sql'), 'utf8'));
  seedSocial(db);
  db.exec('BEGIN IMMEDIATE');
  try {
    if (!db.prepare('SELECT 1 FROM social_migrations WHERE id=?').get('municipal-catalog-2026-11')) {
      db.exec(readFileSync(join(ROOT, 'database', 'municipal-catalog.sql'), 'utf8'));
      db.prepare('INSERT INTO social_migrations (id,applied_at) VALUES (?,?)').run('municipal-catalog-2026-11', now);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
