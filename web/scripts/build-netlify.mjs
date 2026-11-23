import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import { buildPublicCatalog } from './public-catalog.mjs';

const web = resolve(import.meta.dirname, '..');
const netlify = resolve(web, '..', 'netlify');
const functions = resolve(netlify, 'functions-generated');
const entry = resolve(functions, 'public-api.mjs');
const catalog = resolve(functions, 'catalog.json');
const configuredOrigin = process.env.SECELT_API_ORIGIN?.trim();
const api = configuredOrigin ? URL.parse(configuredOrigin) : null;

if (configuredOrigin && (api?.protocol !== 'https:' || api.href !== `${api.origin}/`)) {
  throw new Error('SECELT_API_ORIGIN deve ser uma origem HTTPS sem caminho, credenciais ou parâmetros.');
}

process.env.VITE_SECELT_READ_ONLY = String(!api);
await build({ root: web });

if (api) {
  await writeFile(resolve(web, 'dist', '_redirects'), `/api/* ${api.origin}/api/:splat 200!\n`);
  await Promise.all([rm(entry, { force: true }), rm(catalog, { force: true })]);
} else {
  const data = await buildPublicCatalog(resolve(web, '..'));
  await mkdir(functions, { recursive: true });
  await writeFile(catalog, JSON.stringify(data));
  await copyFile(resolve(netlify, 'public-api.mjs'), entry);
}
