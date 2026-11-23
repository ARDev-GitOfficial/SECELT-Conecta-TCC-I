import { useEffect, useState } from 'react';
import { routeHash } from '../../app/routes.js';
import { SocialDialog } from '../../shared/Dialog.jsx';
import { CommentsDialog, ReportDialog, StoryViewer } from './Dialogs.jsx';
import { PhotoCredit } from './ui.jsx';

export function useSocialOverlay({ route, navigate, notify, community }) {
  const [overlay, setOverlay] = useState(null);
  const { state, toggle, requireCitizen } = community;
  useEffect(() => { setOverlay(null); }, [route.page, route.id]);

  const close = () => setOverlay(null);
  const showStories = (items, index) => setOverlay({ type: 'stories', items, index });
  const onComments = post => requireCitizen(() => setOverlay({ type: 'comments', post }));
  const onReport = (post, comment) => requireCitizen(() => setOverlay({ type: 'report', post, comment }));
  const onPhoto = media => setOverlay({ type: 'photo', media });
  const onShare = async post => {
    const url = new URL(routeHash({ page: 'post', id: post.id }), location.href).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        notify('Link da publicação copiado.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setOverlay({ type: 'share', url });
    }
  };
  const cardProps = { state, toggle, navigate, onComments, onReport, onShare, onPhoto };

  return { overlay, close, showStories, cardProps };
}

export function SocialOverlay({ overlay, onClose, onReport, navigate, notify }) {
  switch (overlay?.type) {
    case 'comments':
      return <CommentsDialog post={overlay.post} onClose={onClose} onReport={onReport} navigate={navigate} />;
    case 'report':
      return <ReportDialog post={overlay.post} comment={overlay.comment} onClose={onClose} notify={notify} />;
    case 'photo':
      return <SocialDialog title={overlay.media.altText || 'Fotografia'} onClose={onClose} className="sg-lightbox">
        <img src={overlay.media.fileUrl} alt={overlay.media.altText || overlay.media.title} />
        <PhotoCredit media={overlay.media} />
      </SocialDialog>;
    case 'stories':
      return <StoryViewer items={overlay.items} initialIndex={overlay.index} navigate={navigate} onClose={onClose} />;
    case 'share':
      return <SocialDialog title="Compartilhar publicação" onClose={onClose}>
        <h2>Compartilhe uma boa história.</h2>
        <p>Copie o link abaixo.</p>
        <input className="sg-share-url" readOnly value={overlay.url} onFocus={event => event.target.select()} />
      </SocialDialog>;
    default:
      return null;
  }
}
