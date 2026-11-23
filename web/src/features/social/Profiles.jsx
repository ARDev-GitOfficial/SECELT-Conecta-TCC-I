import { ArrowRight, Bookmark, Check, Heart, LayoutDashboard, LogOut, MapPin, Plus, Users, Waves } from 'lucide-react';
import { useState } from 'react';
import { routeHash } from '../../app/routes.js';
import { PROFILE, postMetrics } from './model.js';
import { PostCard } from './PostCard.jsx';
import { ThemePicker } from './ThemePicker.jsx';
import { Avatar, EmptyState, PageBadge, PhotoCredit, shortNumber } from './ui.jsx';

export function PageProfile({ page, posts, cover, state, toggle }) {
  const following = state.active && state.followed.includes(page.id);
  return <section className="sg-page-profile sg-glass">
    <div className="sg-profile-cover">
      {cover && <><img src={cover.fileUrl} alt={cover.altText} /><PhotoCredit media={cover} compact /></>}
    </div>
    <div className="sg-page-profile-body">
      <div className="sg-profile-identity">
        <Avatar name={page.name} page={page} size="xl" />
        <button className={`sg-primary ${following ? 'is-following' : ''}`} onClick={() => toggle('followed', page.id)}>
          {following ? <Check size={17} /> : <Plus size={17} />} {following ? 'Seguindo' : 'Seguir página'}
        </button>
      </div>
      <h1>{page.name} <PageBadge page={page} /></h1>
      <span className="sg-profile-handle">@{page.handle}</span>
      <p>{page.bio}</p>
      <div className="sg-profile-metadata">
        <span><MapPin size={15} /> São Miguel do Guamá</span>
        <span>{page.kind === 'official' ? 'Página oficial da SECELT' : 'Parceiro autorizado'}</span>
      </div>
      <div className="sg-profile-stats">
        <span><b>{posts.length}</b> publicações</span>
        <span><b>{shortNumber(posts.reduce((n, p) => n + postMetrics(p, state).likes, 0))}</b> curtidas</span>
      </div>
    </div>
  </section>;
}

export function CitizenProfile({ posts, pages, navigate, state, setState, requireCitizen, cardProps, onAdmin }) {
  const [tab, setTab] = useState('Salvos');
  if (!state.active) return <div className="sg-visitor-profile sg-glass">
    <div className="sg-visitor-art">
      <Avatar name={PROFILE.name} size="xl" />
      <span className="sg-profile-orbit" />
    </div>
    <span className="sg-kicker">SUAS CONEXÕES COMEÇAM AQUI</span>
    <h1>O seu lugar<br />no <em>Conecta.</em></h1>
    <p>Acompanhe quem faz a cidade acontecer.<br />Guarde histórias. Participe das conversas.</p>
    <button className="sg-primary" onClick={() => requireCitizen()} >Continuar como Ana <ArrowRight size={18} />
    </button>
    <div className="sg-visitor-settings">
      <span className="sg-side-label">DO SEU JEITO</span>
      <ThemePicker />
      {onAdmin && <button className="sg-text-button" onClick={onAdmin}><LayoutDashboard size={16} /> Área de publicação</button>}
    </div>
  </div>;
  const saved = posts.filter(p => state.saved.includes(p.id) && !state.hiddenPosts.includes(p.id)),
    liked = posts.filter(p => state.likes.includes(p.id) && !state.hiddenPosts.includes(p.id)),
    followed = pages.filter(p => state.followed.includes(p.id));
  return <>
    <section className="sg-citizen-profile sg-glass">
      <div className="sg-citizen-cover"><Waves size={130} /><span>SUA CIDADE. SUAS CONEXÕES.</span></div>
      <div className="sg-page-profile-body">
        <div className="sg-profile-identity">
          <Avatar name={PROFILE.name} size="xl" />
          <button
            className="sg-icon-button"
            aria-label="Sair do perfil"
            onClick={() => setState(s => ({ ...s, active: false }))}
          >
            <LogOut size={20} />
          </button>
        </div>
        <h1>{PROFILE.name}</h1>
        <span className="sg-profile-handle">@{PROFILE.handle}</span>
        <p>Vivendo e descobrindo São Miguel do Guamá. 💙</p>
        <div className="sg-profile-metadata"><MapPin size={15} /> {PROFILE.city}</div>
        <div className="sg-profile-stats">
          <button onClick={() => setTab('Seguindo')}><b>{followed.length}</b> seguindo</button>
          <button onClick={() => setTab('Salvos')}><b>{saved.length}</b> {saved.length === 1 ? 'salvo' : 'salvos'}</button>
          <button onClick={() => setTab('Curtidas')}>
            <b>{liked.length}</b> {liked.length === 1 ? 'curtida' : 'curtidas'}
          </button>
        </div>
      </div>
    </section>
    <section className="sg-appearance-card sg-glass">
      <div><b>A sua versão do Conecta</b><small>Escolha como a cidade aparece para você.</small></div>
      <ThemePicker />
    </section>
    <div className="sg-profile-tabs">
      {[['Salvos', Bookmark], ['Seguindo', Users], ['Curtidas', Heart]].map(([t, Icon]) => <button key={t} className={tab === t ? 'active' : ''} aria-pressed={tab === t} onClick={() => setTab(t)}>
        <Icon size={17} />
        {t}
      </button>)}
    </div>
    {tab === 'Seguindo'
      ? followed.length
        ? followed.map(page => <div className="sg-followed-row sg-glass" key={page.id}>
          <a href={routeHash({ page: 'publisher', id: page.id })}>
            <Avatar name={page.name} page={page} />
            <span><b>{page.name} <PageBadge page={page} /></b><small>@{page.handle}</small></span>
          </a>
          <button className="sg-follow-button following" onClick={() => cardProps.toggle('followed', page.id)}>
            <Check size={15} /> Seguindo</button>
        </div>)
        : <EmptyState
          icon={Users}
          title="Boas conexões estão por perto."
          action={<button className="sg-primary" onClick={() => navigate({ page: 'explore' })}>Explorar páginas</button>}
        />
      : ((tab === 'Salvos' ? saved : liked).length
        ? (tab === 'Salvos' ? saved : liked).map(post => <PostCard key={post.id} post={post} {...cardProps} />)
        : <EmptyState
          icon={tab === 'Salvos' ? Bookmark : Heart}
          title={tab === 'Salvos' ? 'Histórias para guardar.' : 'O que faz você se conectar?'}
        >
          {tab === 'Salvos'
            ? 'Toque no marcador de uma publicação para encontrá-la aqui.'
            : 'As publicações que você curtir aparecerão aqui.'}
        </EmptyState>)}
    {onAdmin && <button className="sg-profile-admin sg-text-button" onClick={onAdmin}>
      <LayoutDashboard size={17} /> Área de publicação</button>}
  </>;
}
