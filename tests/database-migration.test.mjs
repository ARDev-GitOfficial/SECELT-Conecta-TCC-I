import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

test('a base anterior mantém os locais cadastrados ao inicializar o esquema atual duas vezes', t => {
  const dir = mkdtempSync(join(tmpdir(), 'secelt-migration-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'secelt.sqlite');
  const old = new DatabaseSync(file);
  old.exec(`CREATE TABLE tourist_points (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
    category TEXT NOT NULL, address TEXT, latitude REAL, longitude REAL, image_url TEXT, status TEXT DEFAULT 'Publicado');
    INSERT INTO tourist_points (id,name,description,category) VALUES ('p-local','Praça do bairro','Cadastro local','Praça');`);
  old.close();

  const init = spawnSync(process.execPath, ['--input-type=module', '-e',
    "import { initializeDatabase } from './server/db/initialize.js'; initializeDatabase(); initializeDatabase();"
  ], { cwd: new URL('../', import.meta.url), env: { ...process.env, SECELT_DATA_DIR: dir }, encoding: 'utf8', windowsHide: true });
  assert.equal(init.status, 0, init.stderr);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const place = db.prepare('SELECT name, updated_at, place_id, created_by FROM tourist_points WHERE id = ?').get('p-local');
    assert.equal(place.name, 'Praça do bairro');
    assert.ok(place.updated_at);
    assert.equal(place.place_id, null);
    assert.equal(place.created_by, null);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM social_migrations WHERE id = ?').get('municipal-catalog-2026-11').n, 1);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});
