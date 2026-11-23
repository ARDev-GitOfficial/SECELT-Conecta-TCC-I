import { ArrowLeft, ArrowRight, Check, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { routeHash } from '../../../app/routes.js';
import { SocialDialog } from '../../../shared/Dialog.jsx';
import { PhotoCredit } from '../ui.jsx';

export function PublicationPreview({ item, token, isAdmin, busy, onClose, onApprove, onReturn }) {
  const [index, setIndex] = useState(0), media = item.media[index];
  return <SocialDialog title="Prévia da publicação" onClose={onClose} className="sg-preview-dialog">
    <div className="sg-dialog-heading">
      <span className="sg-kicker">{item.type === 'story' ? 'PRÉVIA DO STORY' : 'PRÉVIA DA PUBLICAÇÃO'}</span>
      <h2>{item.title}</h2>
      <p>{item.publisher.name} · {item.category} · {item.status}</p>
    </div>
    {media && <>
      <div className="sg-preview-image"><AuthPhoto media={media} token={token} /></div>
      <PhotoCredit media={media} />
      {item.media.length > 1 && <div className="sg-preview-thumbs">
        {item.media.map((photo, i) => <button
          key={photo.id}
          className={index === i ? 'selected' : ''}
          aria-pressed={index === i}
          aria-label={`Conferir foto ${i + 1}`}
          onClick={() => setIndex(i)}
        >
          <AuthPhoto media={photo} token={token} />
          <span>{i + 1}</span>
        </button>)}
      </div>}
    </>}
    <p className="sg-preview-caption">{item.caption}</p>
    {item.format === 'video' && <p className="sg-review-note">Imagem de capa. A reprodução do vídeo ainda não está disponível.</p>}
    {item.eventId && <a className="sg-event-link" href={routeHash({ page: 'event', id: item.eventId })}>Abrir o evento vinculado <ArrowRight size={16} />
    </a>}
    {item.status === 'Aguardando Aprovação' && isAdmin && <div className="sg-compose-footer">
      <button className="sg-secondary" disabled={busy} onClick={onReturn}>
        <ArrowLeft size={16} /> Solicitar ajustes</button>
      <button className="sg-primary" disabled={busy} onClick={onApprove}>
        <Check size={16} /> Aprovar publicação</button>
    </div>}
  </SocialDialog>;
}

export function AuthPhoto({ media, token }) {
  const [src, setSrc] = useState(media.status === 'Publicado' ? media.fileUrl : '');
  useEffect(
    () => {
      if (media.status === 'Publicado') {
        setSrc(media.fileUrl);
        return;
      }
      let alive = true, url;
      const controller = new AbortController();
      fetch(media.fileUrl, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then(r => {
        if (!r.ok) throw Error();
        return r.blob();
      }).then(blob => {
        url = URL.createObjectURL(blob);
        if (alive) setSrc(url);
      }).catch(() => { });
      return () => {
        alive = false;
        controller.abort();
        if (url) URL.revokeObjectURL(url);
      };
    },
    [media.id, media.status, token]
  );
  return src ? <img src={src} alt={media.altText || media.title} loading="lazy" /> : <ImageIcon size={24} />;
}
