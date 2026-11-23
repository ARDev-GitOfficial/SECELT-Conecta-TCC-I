import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Flag, MessageCircle, Play, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SocialDialog } from '../../shared/Dialog.jsx';
import { useCommunity } from './community.jsx';
import { PROFILE } from './model.js';
import { Avatar, PageBadge, PhotoCredit, relativeTime } from './ui.jsx';

export function CommentsDialog({ post, onClose, onReport, navigate }) {
  const { state, setState, requireCitizen } = useCommunity();
  const [text, setText] = useState('');
  const comments = (state.comments[post.id] || []).filter(c => !c.removed);
  const submit = e => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    requireCitizen(() => {
      setState(s => ({
        ...s,
        comments: {
          ...s.comments,
          [post.id]: [
            ...(s.comments[post.id] || []),
            { id: crypto.randomUUID(), text: value.slice(0, 1500), author: PROFILE.name, createdAt: new Date().toISOString() }
          ]
        }
      }));
      setText('');
    });
  };
  return <SocialDialog title="Comentários da publicação" onClose={onClose} className="sg-comments-dialog">
    <div className="sg-dialog-heading">
      <span className="sg-kicker">A CONVERSA CONTINUA</span>
      <h2>Comentários</h2>
      <p>{post.title}</p>
    </div>
    <div className="sg-comment-list">
      {comments.length
        ? comments.map(comment => <div className="sg-comment" key={comment.id}>
          <Avatar name={comment.author} />
          <div>
            <b>{comment.author}<time>{relativeTime(comment.createdAt)}</time></b>
            <p>{comment.text}</p>
            <button
              className="sg-comment-remove"
              onClick={() => setState(s => ({ ...s, comments: { ...s.comments, [post.id]: (s.comments[post.id] || []).map(c => c.id === comment.id ? { ...c, removed: true } : c) } }))}
            >Excluir</button>
            <button
              className="sg-comment-remove sg-comment-report"
              aria-label="Denunciar comentário"
              onClick={() => onReport(post, comment)}
            >Denunciar</button>
          </div>
        </div>)
        : <div className="sg-comments-empty">
          <MessageCircle size={36} />
          <h3>Uma boa conversa começa com você.</h3>
          <p>Compartilhe sua opinião com respeito.</p>
        </div>}
    </div>
    <form className="sg-comment-form" onSubmit={submit}>
      <Avatar name={PROFILE.name} />
      <label className="sg-sr-only" htmlFor="new-comment">Seu comentário</label>
      <input
        id="new-comment"
        placeholder="Adicione um comentário…"
        maxLength={1500}
        value={text}
        onChange={e => setText(e.target.value)}
        autoComplete="off"
      />
      <button className="sg-icon-button" aria-label="Publicar comentário" disabled={!text.trim()}>
        <Send size={20} />
      </button>
    </form>
  </SocialDialog>;
}

export function ReportDialog({ post, comment, onClose, notify }) {
  const { state, setState } = useCommunity();
  const [reason, setReason] = useState('Informação incorreta');
  const submit = e => {
    e.preventDefault();
    const targetId = comment?.id || post.id;
    if (state.reports.some(r => r.targetId === targetId && r.status === 'pending')) {
      notify('Este conteúdo já foi enviado para revisão.');
      onClose();
      return;
    }
    setState(s => ({
      ...s,
      reports: [
        ...s.reports,
        {
          id: crypto.randomUUID(),
          postId: post.id,
          targetId,
          type: comment ? 'comment' : 'post',
          reason,
          status: 'pending',
          title: post.title,
          createdAt: new Date().toISOString()
        }
      ]
    }));
    notify('Denúncia enviada para revisão.');
    onClose();
  };
  return <SocialDialog title="Denunciar conteúdo" onClose={onClose} className="sg-small-dialog">
    <span className="sg-empty-icon"><Flag size={27} /></span>
    <h2>Como podemos ajudar?</h2>
    <p>Conte por que esta publicação precisa de atenção.</p>
    <form className="sg-form" onSubmit={submit}>
      <label>Motivo<select value={reason} onChange={e => setReason(e.target.value)}>
        {['Informação incorreta', 'Conteúdo ofensivo', 'Spam ou propaganda', 'Uso indevido de imagem', 'Outro motivo'].map(r => <option key={r}>{r}</option>)}
      </select>
      </label>
      <button className="sg-primary sg-full">Enviar para revisão</button>
    </form>
  </SocialDialog>;
}

export function StoryViewer({ items, initialIndex = 0, onClose, navigate }) {
  const { setState } = useCommunity(), [index, setIndex] = useState(initialIndex), [notice, setNotice] = useState(false);
  const story = items[index], media = story?.media[0];
  useEffect(
    () => {
      if (story) setState(s => s.seenStories.includes(story.id) ? s : { ...s, seenStories: [...s.seenStories, story.id] });
      setNotice(false);
    },
    [story?.id]
  );
  useEffect(
    () => {
      const handler = e => {
        if (e.target.matches('input,textarea,select')) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setIndex(i => Math.min(items.length - 1, i + 1));
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setIndex(i => Math.max(0, i - 1));
        }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    },
    [items.length]
  );
  if (!story) return null;
  return <SocialDialog title={`Story de ${story.publisher.name}`} onClose={onClose} className="sg-story-dialog">
    <div
      className="sg-story-background"
      style={{ backgroundImage: media ? `url("${media.fileUrl}")` : undefined }}
    />
    <div className="sg-story-progress" aria-label={`Story ${index + 1} de ${items.length}`}>
      {items.map((s, i) => <span key={s.id} className={i <= index ? 'complete' : ''} />)}
    </div>
    <button
      className="sg-story-author"
      onClick={() => {
        onClose();
        navigate({ page: 'publisher', id: story.publisherId });
      }}
    >
      <Avatar name={story.publisher.name} page={story.publisher} />
      <span>
        <b>{story.publisher.name} <PageBadge page={story.publisher} /></b>
        <small>{relativeTime(story.publishedAt)}</small>
      </span>
    </button>
    {media && <img className="sg-story-photo" src={media.fileUrl} alt={media.altText || story.title} />}
    <div className="sg-story-caption">
      <span className="sg-kicker">{story.category}</span>
      <h2>{story.title}</h2>
      <p>{story.caption}</p>
      {story.format === 'video' && <button className="sg-story-video-button" onClick={() => setNotice(true)}>
        <Play size={18} /> Ver disponibilidade</button>}
      {notice && <p role="status">Este vídeo ainda não está disponível.</p>}
      {story.eventId && <button className="sg-primary" onClick={() => {
        onClose();
        navigate({ page: 'event', id: story.eventId });
      }}>Ver evento <ArrowUpRight size={17} />
      </button>}
      <PhotoCredit media={media} />
    </div>
    {index > 0 && <button className="sg-story-step previous" aria-label="Story anterior" onClick={() => setIndex(i => i - 1)}>
      <ChevronLeft />
    </button>}
    {index < items.length - 1
      ? <button className="sg-story-step next" aria-label="Próximo Story" onClick={() => setIndex(i => i + 1)}>
        <ChevronRight />
      </button>
      : <button className="sg-story-step next" aria-label="Fechar Stories" onClick={onClose}><Check /></button>}
  </SocialDialog>;
}
