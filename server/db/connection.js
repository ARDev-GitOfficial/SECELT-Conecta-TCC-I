import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATA, MEDIA_DIR } from '../config.js';

mkdirSync(MEDIA_DIR, { recursive: true });
export const db = new DatabaseSync(join(DATA, 'secelt.sqlite')); db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
