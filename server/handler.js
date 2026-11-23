import { readFileSync, existsSync } from 'node:fs';
import { join, relative, isAbsolute, extname, sep } from 'node:path';
import { ROOT } from './config.js';
import { route } from './router.js';
import { send } from './http.js';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};
const apkName = 'SECELT-Conecta-demo.apk';

export async function handleRequest(req, res) {
  try {
    if (req.url.startsWith('/api/')) return await route(req, res);

    const web = join(ROOT, 'web');
    const dist = join(web, 'dist');
    const base = existsSync(join(dist, 'index.html')) ? dist : web;
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === `/downloads/${apkName}`) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end();
      }
      const apk = readFileSync(join(ROOT, apkName));
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename=${apkName}`,
        'Content-Length': apk.length,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(req.method === 'GET' ? apk : undefined);
    }
    let file = join(base, pathname === '/' ? 'index.html' : pathname);
    const relativePath = relative(base, file);
    if (relativePath === '..' || relativePath.startsWith('..' + sep) || isAbsolute(relativePath)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (!existsSync(file) && req.headers.accept?.includes('text/html')) file = join(base, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end('Not found');
    }

    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(readFileSync(file));
  } catch (error) {
    const status = error.message === 'Payload too large' ? 413 : 400;
    send(res, status, { error: error.message || 'Falha interna da API.' });
  }
}
