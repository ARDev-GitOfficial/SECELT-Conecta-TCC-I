import { ArrowUpRight, CalendarDays, Check, ChevronRight, MapPin, Plus, Search, Users } from 'lucide-react';
import { routeHash } from '../../app/routes.js';
import { PROFILE } from './model.js';
import { NavItems } from './navigation.jsx';
import { ThemePicker } from './ThemePicker.jsx';
import { Avatar } from './ui.jsx';

export function SocialHeader({ state, requireCitizen, navigate }) {
  const openProfile = () => navigate('profile');
  return <>
    <a
      className="sg-skip"
      href="#conteudo"
      onClick={event => {
        event.preventDefault();
        const main = document.getElementById('conteudo');
        main?.focus();
        main?.scrollIntoView({ block: 'start' });
      }}
    >Pular para o conteúdo</a>
    <header className="sg-topbar">
      <div className="sg-topbar-inner">
        <a className="sg-logo" href={routeHash({ page: 'feed' })}>
          <img src="/assets/brand.svg" alt="" />
          <span><b>SECELT<span className="sg-logo-dot">.</span></b><small>conecta</small></span>
        </a>
        <button className="sg-header-search sg-glass" onClick={() => navigate('explore')}>
          <Search size={18} />
          <span>O que você quer descobrir?</span>
        </button>
        <div className="sg-header-actions">
          <ThemePicker compact />
          <button
            className="sg-avatar-button"
            aria-label={state.active ? 'Abrir meu perfil' : 'Entrar no Conecta'}
            onClick={() => requireCitizen(openProfile)}
          >
            <Avatar name={state.active ? PROFILE.name : 'Você'} />
          </button>
        </div>
      </div>
    </header>
  </>;
}

export function SocialSidebar({ route, navigate, onAdmin }) {
  return <aside className="sg-sidebar">
    <nav aria-label="Navegação principal"><NavItems route={route} navigate={navigate} /></nav>
    <div className="sg-sidebar-divider" />
    <span className="sg-side-label">SUA CIDADE</span>
    <a className="sg-location sg-glass" href={routeHash({ page: 'explore' })}>
      <span><MapPin size={20} /></span>
      <div><b>São Miguel do Guamá</b><small>Pará, Brasil</small></div>
      <ArrowUpRight size={15} />
    </a>
    {onAdmin && <button className="sg-publish-button" onClick={onAdmin}><Plus size={19} /> Área de publicação</button>}
    <div className="sg-sidebar-bottom"><p>São Miguel do Guamá · PA</p></div>
  </aside>;
}

const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

export function SocialRail({ events, pages, state, toggle }) {
  const now = Date.now();
  const upcoming = events
    .filter(event => event.status === 'Publicado' && Date.parse(event.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, 2);

  return <aside className="sg-right-rail">
    <div className="sg-rail-heading"><span>SEU PRÓXIMO ENCONTRO</span><CalendarDays size={17} /></div>
    <section className="sg-agenda-card sg-glass">
      <span className="sg-mini-label">NA AGENDA</span>
      <h2>A cidade<br />te espera<span>.</span></h2>
      <p>Encontre a programação e escolha o seu próximo encontro.</p>
      {upcoming.map(event => {
        const date = new Date(event.startsAt);
        return <a className="sg-mini-event" key={event.id} href={routeHash({ page: 'event', id: event.id })}>
          <span><b>{date.getDate()}</b><small>{month.format(date).replace('.', '')}</small></span>
          <div><b>{event.title}</b><small>{event.location}</small></div>
          <ChevronRight size={15} />
        </a>;
      })}
      <a className="sg-rail-link" href={routeHash({ page: 'events' })}>Ver agenda completa <ArrowUpRight size={16} /></a>
    </section>
    <div className="sg-rail-heading"><span>CONEXÕES DA CIDADE</span><Users size={16} /></div>
    <section className="sg-suggestions sg-glass">
      {pages.filter(page => page.id !== 'secelt').slice(0, 3).map(page => {
        const following = state.active && state.followed.includes(page.id);
        return <div className="sg-suggestion" key={page.id}>
          <a href={routeHash({ page: 'publisher', id: page.id })}>
            <Avatar name={page.name} page={page} />
            <span><b>{page.name}</b><small>@{page.handle}</small></span>
          </a>
          <button
            className={`sg-follow-small ${following ? 'following' : ''}`}
            aria-label={`${following ? 'Deixar de seguir' : 'Seguir'} ${page.name}`}
            onClick={() => toggle('followed', page.id)}
          >
            {following ? <Check size={17} /> : <Plus size={17} />}
          </button>
        </div>;
      })}
      <a className="sg-rail-link" href={routeHash({ page: 'explore' })}>Descobrir mais páginas <ArrowUpRight size={16} /></a>
    </section>
  </aside>;
}
