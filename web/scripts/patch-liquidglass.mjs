import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  path.join(root, 'node_modules/@ybouane/liquidglass/src/shaders.ts'),
  path.join(root, 'node_modules/@ybouane/liquidglass/dist/index.js'),
];

const replaceOne = (source, pattern, replacement, label, file) => {
  const matches = pattern.global
    ? [...source.matchAll(pattern)]
    : source.match(pattern)
      ? [source.match(pattern)]
      : [];
  if (matches.length !== 1) {
    throw new Error(`Patch ${label} esperado uma vez em ${file}; encontrado ${matches.length}.`);
  }
  return source.replace(pattern, replacement);
};

for (const file of files) {
  let source = await readFile(file, 'utf8');
  if (source.includes('float edgeLens = smoothstep(0.04, 0.92, edge);')) {
    const patched = source
      .replace(/^[\t ]*\/\/ SECELT_EDGE_WATER_LENS[^\r\n]*\r?\n/m, '')
      .replace(/float caS = [^;]+;/, 'float caS = 0.0;');
    if (patched !== source) await writeFile(file, patched, 'utf8');
    continue;
  }

  source = replaceOne(
    source,
    /^[\t ]*vec2 centerDir = -v_localPx \/ max\(half_, vec2\(1\.0\)\);\r?\n[\t ]*refrPx \+= centerDir \* u_refract \* 4\.0 \* depth;[\t ]*$/m,
    '',
    'remoção da distorção central',
    file,
  );
  source = replaceOne(
    source,
    /refrPx = -v_localPx \* u_refract \* depth \* 0\.35;/,
    'refrPx = -v_localPx * u_refract * (1.0 - depth) * 0.22;',
    'refração periférica dome',
    file,
  );
  source = replaceOne(
    source,
    /^[\t ]*vec2 refr = refrPx \* pxToUV;[\t ]*$/m,
    (line) => `${line.slice(0, line.indexOf('vec2'))}float edgeLens = smoothstep(0.04, 0.92, edge);\n${line.slice(0, line.indexOf('vec2'))}refrPx *= edgeLens;\n${line}`,
    'máscara de refração periférica',
    file,
  );
  source = replaceOne(
    source,
    /^([\t ]*vec2 micro = .*;)[\t ]*$/m,
    (line) => `${line}\n${line.slice(0, line.indexOf('vec2'))}micro *= edgeLens;`,
    'distorção de água na borda',
    file,
  );
  source = replaceOne(
    source,
    /float caS = u_chroma \* 18\.0 \* \(edge \* 0\.7 \+ 0\.3\) \* 2\.0;/,
    'float caS = 0.0;',
    'remoção da separação RGB',
    file,
  );
  source = replaceOne(
    source,
    /float edgeMix = \(1\.0 - edge \* 0\.15\);/,
    'float edgeMix = edgeLens * 0.18;',
    'centro nítido e aro refrativo',
    file,
  );
  source = replaceOne(
    source,
    /float edge = smoothstep\(maxD \* 0\.35, 0\.0, inside\);/,
    'float edge = 1.0 - smoothstep(0.0, maxD * 0.35, inside);',
    'perfil estável do aro óptico',
    file,
  );

  await writeFile(file, source, 'utf8');
}
