import { ArrowUpRight, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Flag, Heart, MessageCircle, MoreHorizontal, Play, Send, Trophy, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { routeHash } from '../../app/routes.js';
import { SocialDialog } from '../../shared/Dialog.jsx';
import { postMetrics } from './model.js';
import { Avatar, PageBadge, PhotoCredit, relativeTime, shortNumber } from './ui.jsx';

export function PostCard({ post, state, toggle, navigate, onComments, onReport, onShare, onPhoto, expanded = false }) {
  const [index, setIndex] = useState(0),
    [more, setMore] = useState(expanded),
    [menu, setMenu] = useState(false),
    [videoNotice, setVideoNotice] = useState(false);
  const metrics = postMetrics(post, state),
    liked = state.likes.includes(post.id),
    saved = state.saved.includes(post.id),
    media = post.media[index];
  useEffect(
    () => {
      if (!menu) return;
      const close = e => { if (!e.target.closest('.sg-post-menu-wrap')) setMenu(false); };
      document.addEventListener('pointerdown', close);
      return () => document.removeEventListener('pointerdown', close);
    },
    [menu]
  );
  return <article className="sg-post sg-glass" aria-label={`Publicação de ${post.publisher.name}`}>
    <header className="sg-post-header">
      <a className="sg-post-author" href={routeHash({ page: 'publisher', id: post.publisherId })}>
        <Avatar name={post.publisher.name} page={post.publisher} />
        <span>
          <span>
            <b>{post.publisher.name}</b>
            <PageBadge page={post.publisher} />
            <time dateTime={post.publishedAt} title={new Date(post.publishedAt).toLocaleString('pt-BR')}>· {relativeTime(post.publishedAt)}
            </time>
          </span>
          <small>São Miguel do Guamá · {post.category}</small>
        </span>
      </a>
      <div className="sg-post-menu-wrap">
        <button
          className="sg-icon-button"
          aria-label={`Opções da publicação ${post.title}`}
          aria-expanded={menu}
          onClick={() => setMenu(v => !v)}
        >
          <MoreHorizontal size={22} />
        </button>
        {menu && <div className="sg-post-menu sg-glass">
          <button onClick={() => {
            setMenu(false);
            onShare(post);
          }}><Send size={16} /> Compartilhar</button>
          <button onClick={() => {
            setMenu(false);
            onReport(post);
          }}><Flag size={16} /> Denunciar publicação</button>
        </div>}
      </div>
    </header>
    {media
      ? <div className={`sg-post-media ${post.format === 'video' ? 'is-video' : ''}`}>
        <button
          className="sg-media-open"
          aria-label={post.format === 'video'
            ? 'Ver disponibilidade do vídeo'
            : `Ampliar foto ${index + 1} de ${post.media.length}`}
          onClick={() => post.format === 'video' ? setVideoNotice(true) : onPhoto(media)}
        >
          <img src={media.fileUrl} alt={media.altText || post.title} loading="lazy" decoding="async" />
          {post.format === 'video' && <span className="sg-video-cover"><span><Play size={28} fill="currentColor" /></span><b>Vídeo</b></span>}
        </button>
        {post.media.length > 1 && <>
          <span className="sg-carousel-count">{index + 1}/{post.media.length}</span>
          {index > 0 && <button className="sg-carousel-arrow previous" aria-label="Foto anterior" onClick={() => setIndex(i => i - 1)}>
            <ChevronLeft size={20} />
          </button>}
          {index < post.media.length - 1 && <button className="sg-carousel-arrow next" aria-label="Próxima foto" onClick={() => setIndex(i => i + 1)}>
            <ChevronRight size={20} />
          </button>}
        </>}
        <PhotoCredit media={media} compact />
      </div>
      : <a
        className={`sg-text-post ${post.category === 'Esporte' ? 'sports' : ''}`}
        href={routeHash({ page: 'post', id: post.id })}
      >
        <span className="sg-mini-label">
          {post.category === 'Esporte' ? <Trophy size={18} /> : <Waves size={18} />} {post.category}
        </span>
        <h2>{post.title}</h2>
        <span className="sg-text-post-bottom">Guamá tem histórias para contar. <ArrowUpRight size={23} /></span>
      </a>}
    <div className="sg-post-body">
      <div className="sg-post-actions">
        <div>
          <button
            className={`sg-icon-button ${liked ? 'liked' : ''}`}
            aria-label={`${liked ? 'Descurtir' : 'Curtir'} publicação`}
            aria-pressed={liked}
            onClick={() => toggle('likes', post.id)}
          >
            <Heart size={23} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button className="sg-icon-button" aria-label="Abrir comentários" onClick={() => onComments(post)}>
            <MessageCircle size={23} />
          </button>
          <button className="sg-icon-button" aria-label="Compartilhar publicação" onClick={() => onShare(post)}>
            <Send size={22} />
          </button>
        </div>
        {post.media.length > 1 && <div className="sg-carousel-dots" aria-label="Fotos do carrossel">
          {post.media.map((m, i) => <button
            key={m.id}
            aria-label={`Ir para foto ${i + 1}`}
            aria-pressed={i === index}
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
          />)}
        </div>}
        <button
          className={`sg-icon-button ${saved ? 'saved' : ''}`}
          aria-label={`${saved ? 'Remover dos salvos' : 'Salvar publicação'}`}
          aria-pressed={saved}
          onClick={() => toggle('saved', post.id)}
        >
          <Bookmark size={23} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="sg-like-count">
        {metrics.likes > 0
          ? <><b>{shortNumber(metrics.likes)}</b> {metrics.likes === 1 ? 'curtida' : 'curtidas'}</>
          : 'Seja o primeiro a curtir'}
      </div>
      {media && <h2 className="sg-post-title"><a href={routeHash({ page: 'post', id: post.id })}>{post.title}</a></h2>}
      <p className={`sg-caption ${more ? 'expanded' : ''}`}>
        <a href={routeHash({ page: 'publisher', id: post.publisherId })}>@{post.publisher.handle}</a> {post.caption}
      </p>
      {post.caption.length > 100 && <button className="sg-caption-toggle" aria-expanded={more} onClick={() => setMore(v => !v)}>
        {more ? 'ver menos' : 'mais'}
      </button>}
      {post.sourceUrl && <a className="sg-event-link" href={post.sourceUrl} target="_blank" rel="noreferrer">
        <span>Ler notícia na Prefeitura</span>
        <ArrowUpRight size={17} />
      </a>}
      {post.eventId && <a className="sg-event-link" href={routeHash({ page: 'event', id: post.eventId })}>
        <CalendarDays size={17} />
        <span>Veja o evento e participe</span>
        <ArrowUpRight size={17} />
      </a>}
      <button className="sg-view-comments" onClick={() => onComments(post)}>
        {metrics.comments
          ? `Ver ${metrics.comments === 1 ? 'o comentário' : `os ${metrics.comments} comentários`}`
          : 'Comece uma conversa…'}
      </button>
    </div>
    {videoNotice && <SocialDialog
      title="Disponibilidade do vídeo"
      onClose={() => setVideoNotice(false)}
      className="sg-small-dialog"
    >
      <span className="sg-empty-icon"><Play size={27} /></span>
      <h2>Uma nova história vem aí.</h2>
      <p>Este vídeo ainda não está disponível. Continue acompanhando as publicações da página.</p>
      <button className="sg-primary" onClick={() => setVideoNotice(false)}>Continuar explorando</button>
    </SocialDialog>}
  </article>;
}
