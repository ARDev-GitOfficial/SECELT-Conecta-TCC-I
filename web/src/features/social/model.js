export const COMMUNITY_KEY = 'secelt-community-v1';
export const PROFILE = { name: 'Ana Souza', handle: 'ana.souza', city: 'São Miguel do Guamá, PA' };
export const initialCommunity = () => ({
  version: 1,
  active: false,
  theme: 'black',
  followed: ['secelt', 'cultura-guama'],
  likes: [],
  saved: [],
  comments: {},
  reports: [],
  seenStories: [],
  hiddenPosts: []
});

export function readCommunity(storage) {
  try {
    const value = JSON.parse(storage.getItem(COMMUNITY_KEY));
    if (!value || value.version !== 1) return initialCommunity();
    const base = initialCommunity();
    for (const key of ['followed', 'likes', 'saved', 'seenStories', 'hiddenPosts']) base[key] = Array.isArray(value[key]) ? [...new Set(value[key].filter(v => typeof v === 'string'))] : base[key];
    base.active = value.active === true;
    base.theme = value.theme === 'blue' ? 'blue' : 'black';
    base.comments = value.comments && typeof value.comments === 'object' && !Array.isArray(value.comments)
      ? Object.fromEntries(Object.entries(value.comments).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.filter(c => c && typeof c.id === 'string' && typeof c.text === 'string')]))
      : {};
    base.reports = Array.isArray(value.reports)
      ? value.reports.filter(r => r && typeof r.id === 'string' && typeof r.postId === 'string')
      : [];
    return base;
  } catch { return initialCommunity(); }
}

export function postMetrics(post, state) {
  return {
    likes: Math.max(0, Number(post.baseLikes) || 0) + (state.likes.includes(post.id) ? 1 : 0),
    comments: Math.max(0, Number(post.baseComments) || 0) + (state.comments[post.id] || []).filter(c => !c.removed).length
  };
}

export function rankFeed(items, state, now = Date.now()) {
  const unique = [...new Map(items.map(p => [p.id, p])).values()].filter(p => !state.hiddenPosts.includes(p.id));
  const engagement = p => {
    const m = postMetrics(p, state);
    return m.likes + 2 * m.comments;
  };
  const max = Math.max(1, ...unique.map(engagement));
  const score = post => {
    const age = Math.max(0, now - (Date.parse(post.publishedAt) || 0)) / 86400000;
    const recent = 2 ** (-age / 7);
    const popular = Math.log1p(engagement(post)) / Math.log1p(max);
    return .4 * Number(state.active && state.followed.includes(post.publisherId)) + .3 * recent + .2 * popular + .1 * Number(!!post.recommended);
  };
  return unique.sort((a, b) => score(b) - score(a) || (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0) || a.id.localeCompare(b.id));
}
