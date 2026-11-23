import { ArrowUpRight, CalendarDays, Check, ChevronRight, Compass, Image as ImageIcon, MapPin, Play, Search, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { routeHash } from '../../app/routes.js';
import { dateLabel } from './dateLabel.js';
import { Avatar, EmptyState, PageBadge, PhotoCredit } from './ui.jsx';

export function Explore({ pages, posts, events, places, navigate, state, toggle }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('Tudo');
  const q = query.trim().toLocaleLowerCase('pt-BR');
  const matches = (...texts) => !q || texts.join(' ').toLocaleLowerCase('pt-BR').includes(q);
  const filteredPages = pages.filter(p => matches(p.name, p.handle, p.bio)),
    filteredPosts = posts.filter(p => matches(p.title, p.caption, p.category, p.publisher.name) && (filter === 'Tudo' || p.category === filter));
  const eventResults = q ? events.filter(e => matches(e.title, e.location, e.category)) : [],
    placeResults = q ? places.filter(p => matches(p.name, p.description, p.category)) : [];
  return <>
    <div className="sg-page-heading">
      <div>
        <span className="sg-kicker">TEM MUITO POR AQUI</span>
        <h1>Um novo olhar <em>sobre Guamá.</em></h1>
        <p>Encontre páginas, histórias e lugares.</p>
      </div>
    </div>
    <label className="sg-explore-search sg-glass">
      <Search size={21} />
      <input
        aria-label="Buscar publicações, páginas, eventos ou lugares"
        placeholder="O que você quer descobrir?"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {query && <button className="sg-text-button" onClick={() => setQuery('')}>Limpar</button>}
    </label>
    {!q && <div className="sg-explore-shortcuts">
      <a className="sg-glass" href={routeHash({ page: 'sports' })}>
        <span className="sg-shortcut-icon green"><Trophy size={24} /></span>
        <span><b>Esporte</b><small>Jogos e resultados</small></span>
        <ArrowUpRight size={20} />
      </a>
      <a className="sg-glass" href={routeHash({ page: 'tourism' })}>
        <span className="sg-shortcut-icon blue"><MapPin size={24} /></span>
        <span><b>Turismo</b><small>Redescubra a cidade</small></span>
        <ArrowUpRight size={20} />
      </a>
    </div>}
    <div className="sg-section-label">
      <Users size={16} /> PÁGINAS PARA ACOMPANHAR <span>{filteredPages.length}</span>
    </div>
    <div className="sg-explore-pages">
      {filteredPages.map(page => <div className="sg-explore-page sg-glass" key={page.id}>
        <a href={routeHash({ page: 'publisher', id: page.id })}>
          <Avatar name={page.name} page={page} size="lg" />
          <b>{page.name} <PageBadge page={page} /></b>
          <small>@{page.handle}</small>
        </a>
        <button
          className={`sg-follow-button ${state.active && state.followed.includes(page.id) ? 'following' : ''}`}
          onClick={() => toggle('followed', page.id)}
        >
          {state.active && state.followed.includes(page.id) ? <><Check size={14} /> Seguindo</> : 'Seguir'}
        </button>
      </div>)}
    </div>
    {eventResults.length > 0 && <>
      <div className="sg-section-label"><CalendarDays size={16} /> NA AGENDA</div>
      {eventResults.map(e => <a key={e.id} className="sg-search-result sg-glass" href={routeHash({ page: 'event', id: e.id })}>
        <CalendarDays size={22} />
        <span><b>{e.title}</b><small>{dateLabel(e.startsAt)} · {e.location} · {e.status}</small></span>
        <ChevronRight size={18} />
      </a>)}
    </>}
    {placeResults.length > 0 && <>
      <div className="sg-section-label"><MapPin size={16} /> LUGARES</div>
      {placeResults.map(p => <a key={p.id} className="sg-search-result sg-glass" href={routeHash({ page: 'tourism' })}>
        <MapPin size={22} />
        <span><b>{p.name}</b><small>{p.description}</small></span>
        <ChevronRight size={18} />
      </a>)}
    </>}
    <div className="sg-section-label"><Compass size={16} /> HISTÓRIAS DA CIDADE</div>
    <div className="sg-feed-filters">
      {['Tudo', 'Cultura', 'Esporte', 'Turismo', 'Lazer'].map(t => <button className={filter === t ? 'active' : ''} key={t} aria-pressed={filter === t} onClick={() => setFilter(t)}>
        {t}
      </button>)}
    </div>
    <div className="sg-discovery-grid">
      {filteredPosts.map(post => <a key={post.id} href={routeHash({ page: 'post', id: post.id })} className="sg-discovery-tile sg-glass">
        {post.media[0]
          ? <img src={post.media[0].fileUrl} alt={post.media[0].altText || post.title} loading="lazy" />
          : <div className="sg-discovery-art"><Trophy size={35} /><b>{post.title}</b></div>}
        {post.media[0] && <PhotoCredit media={post.media[0]} compact linked={false} />}
        <span className="sg-discovery-kind">
          {post.format === 'video' ? <Play size={17} /> : post.media.length > 1 ? <ImageIcon size={17} /> : null}
        </span>
        <span className="sg-discovery-caption"><small>{post.category}</small><b>{post.title}</b></span>
      </a>)}
    </div>
    {!filteredPages.length && !filteredPosts.length && !eventResults.length && !placeResults.length && <EmptyState icon={Search} title="Ainda não encontramos esse assunto.">Experimente outro nome, lugar ou categoria.</EmptyState>}
  </>;
}
