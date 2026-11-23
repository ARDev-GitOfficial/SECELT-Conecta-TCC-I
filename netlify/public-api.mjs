import catalog from './catalog.json' with { type: 'json' };

export const config = { path: '/api/*' };

const sections = ['Turismo', 'Esporte', 'Eventos'];

export default function publicApi(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  const json = (data, status = 200, headers = {}) => new Response(
    request.method === 'HEAD' ? null : JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
        ...headers
      }
    }
  );

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'A versão pública do SECELT Conecta está disponível para consulta.' }, 405, { Allow: 'GET, HEAD' });
  }

  const mediaMatch = path.match(/^\/api\/media\/([\w-]+)\/file$/);
  if (mediaMatch && Object.hasOwn(catalog.assets, mediaMatch[1])) {
    return new Response(null, { status: 302, headers: { Location: catalog.assets[mediaMatch[1]] } });
  }

  if (path === '/api/media') {
    const section = url.searchParams.get('section')?.trim();
    if (section && !sections.includes(section)) return json({ error: 'Módulo de fotos inválido.' }, 400);
    const { items } = catalog.responses[path];
    return json({ items: section ? items.filter(item => item.section === section) : items }, 200, { 'Netlify-Vary': 'query=section' });
  }

  if (Object.hasOwn(catalog.responses, path)) return json(catalog.responses[path]);
  return json({ error: 'Rota não encontrada.' }, 404);
}
