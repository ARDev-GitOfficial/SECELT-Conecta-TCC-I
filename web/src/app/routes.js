const routeNames = {
  feed: 'feed',
  explore: 'explorar',
  events: 'agenda',
  download: 'baixar-app',
  profile: 'perfil',
  sports: 'esporte',
  tourism: 'turismo',
  publisher: 'pagina',
  post: 'publicacao',
  event: 'evento'
};
const pages = Object.fromEntries(Object.entries(routeNames).map(([page, name]) => [name, page]));

export function routeHash({ page = 'feed', id } = {}) {
  if (page === 'admin') return '#admin';
  return '#/' + (Object.hasOwn(routeNames, page) ? routeNames[page] : 'feed') + (id ? '/' + encodeURIComponent(id) : '');
}
export function parseRoute(hash = '') {
  if (hash === '#admin' || hash === '#/admin') return { page: 'admin' };
  const [name, rawId] = hash.replace(/^#\/?/, '').split('/');
  let id;
  try { id = rawId ? decodeURIComponent(rawId) : undefined; } catch { }
  return { page: Object.hasOwn(pages, name) ? pages[name] : 'feed', ...(id ? { id } : {}) };
}
