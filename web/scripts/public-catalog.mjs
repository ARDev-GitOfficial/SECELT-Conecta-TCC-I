import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const publicPaths = [
  '/api/events', '/api/news', '/api/sports', '/api/tourism', '/api/media',
  '/api/social/feed', '/api/social/pages', '/api/social/stories'
];

async function readPublicRoute(route, path) {
  let status;
  let body;
  await route({ url: path, method: 'GET', headers: {} }, {
    writeHead(code) { status = code; },
    end(value) { body = value; }
  });
  if (status !== 200) throw new Error(`Falha ao preparar ${path} (${status}).`);
  return JSON.parse(body);
}

export async function buildPublicCatalog(root) {
  const dataDir = await mkdtemp(join(tmpdir(), 'secelt-netlify-'));
  process.env.SECELT_DATA_DIR = dataDir;
  process.env.GOOGLE_MAPS_PHOTOS_ENABLED = 'false';

  let database;
  try {
    const { db } = await import('../../server/db/connection.js');
    database = db;
    const { route } = await import('../../server/router.js');
    const entries = await Promise.all(publicPaths.map(async path => [path, await readPublicRoute(route, path)]));
    const responses = Object.fromEntries(entries);
    const assets = {};
    const media = database.prepare("SELECT id,file_path filePath FROM media_assets WHERE status='Publicado'").all();

    for (const { id, filePath } of media) {
      const asset = /^web\/public\/assets\/([\w-]+\.(?:jpe?g|webp|png))$/i.exec(filePath)?.[1];
      if (!asset) throw new Error(`A imagem pública ${id} precisa ser incluída no acervo do portal.`);
      await access(join(root, filePath));
      assets[id] = `/assets/${asset}`;
    }

    for (const item of responses['/api/social/feed'].items) {
      responses[`/api/social/posts/${item.id}`] = { item };
    }

    responses['/api/health'] = { ok: true, database: 'SQLite', persistent: false, readOnly: true };
    return { responses, assets };
  } finally {
    database?.close();
    await rm(dataDir, { recursive: true, force: true });
  }
}
