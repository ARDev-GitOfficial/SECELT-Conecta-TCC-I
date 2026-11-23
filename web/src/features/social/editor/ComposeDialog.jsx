import { ArrowDown, ArrowUp, FileText, Send, Upload } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../shared/api.js';
import { SocialDialog } from '../../../shared/Dialog.jsx';
import { AuthPhoto } from './PublicationPreview.jsx';

export function ComposeDialog({ item, contentType, data, token, isAdmin, events, onClose, notify, onSaved, onMedia }) {
  const [form, setForm] = useState(() => ({
    publisherId: item?.publisherId || data.pages[0]?.id || '',
    type: item?.type || contentType || 'post',
    format: item?.format || 'photo',
    title: item?.title || '',
    caption: item?.caption || '',
    category: item?.category || 'Comunidade',
    mediaIds: item?.media.map(m => m.id) || [],
    eventId: item?.eventId || '',
    recommended: item?.recommended || false
  }));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [uploadOpen, setUploadOpen] = useState(false);
  const field = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const selectMedia = id => setForm(f => ({
    ...f,
    mediaIds: f.mediaIds.includes(id)
      ? f.mediaIds.filter(v => v !== id)
      : f.format === 'carousel' ? [...f.mediaIds, id].slice(0, 10) : [id]
  }));
  const move = (index, direction) => setForm(f => {
    const ids = [...f.mediaIds];
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    return { ...f, mediaIds: ids };
  });
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    const intent = e.nativeEvent.submitter?.value;
    setBusy(true);
    setError('');
    try {
      const result = await api(item ? `/admin/social/content/${item.id}` : '/admin/social/content', { token, method: item ? 'PUT' : 'POST', body: form });
      if (intent === 'review') await api(`/admin/social/content/${result.item.id}/status`, { token, method: 'PATCH', body: { status: 'Aguardando Aprovação' } });
      notify(intent === 'review' ? 'Conteúdo enviado para revisão.' : 'Rascunho salvo.');
      await onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <SocialDialog
    title={item ? 'Editar publicação' : 'Criar publicação'}
    onClose={onClose}
    className="sg-compose-dialog"
  >
    <div className="sg-dialog-heading">
      <span className="sg-kicker">
        {form.type === 'story' ? 'UMA NOVIDADE PARA COMPARTILHAR' : 'DO SEU OLHAR PARA A CIDADE'}
      </span>
      <h2>
        {item
          ? 'Vamos lapidar essa história.'
          : form.type === 'story' ? 'Crie um novo Story.' : 'Qual é a próxima história?'}
      </h2>
      <p>Prepare o conteúdo. A SECELT cuida da revisão.</p>
    </div>
    <form className="sg-form" onSubmit={submit}>
      <div className="sg-form-row">
        <label>Página autora<select
          value={form.publisherId}
          disabled={!!item}
          required
          onChange={e => field('publisherId', e.target.value)}
        >
          {data.pages.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
        </select>
        </label>
        <label>Formato<select
          value={form.format}
          onChange={e => {
            const format = e.target.value;
            setForm(f => ({ ...f, format, mediaIds: format === 'text' ? [] : format === 'carousel' ? f.mediaIds : f.mediaIds.slice(0, 1) }));
          }}
        >
          <option value="photo">Foto</option>
          {form.type !== 'story' && <option value="carousel">Carrossel de fotos</option>}
          <option value="video">Capa de vídeo</option>
          {form.type !== 'story' && <option value="text">Texto</option>}
        </select>
        </label>
      </div>
      <label>Título<input
        value={form.title}
        maxLength={160}
        required
        placeholder="Uma frase que convida a descobrir…"
        onChange={e => field('title', e.target.value)}
      />
      </label>
      <label>Legenda<textarea
        rows={4}
        value={form.caption}
        maxLength={5000}
        required
        placeholder="Conte a história. Dê os detalhes. Convide para participar."
        onChange={e => field('caption', e.target.value)}
      />
        <span className="sg-field-counter">{form.caption.length}/5.000</span>
      </label>
      <div className="sg-form-row">
        <label>Assunto<select value={form.category} onChange={e => field('category', e.target.value)}>
          {data.categories.map(c => <option key={c}>{c}</option>)}
        </select>
        </label>
        <label>Vincular a um evento<select value={form.eventId} onChange={e => field('eventId', e.target.value)}>
          <option value="">Sem evento vinculado</option>
          {events.filter(e => ['Publicado', 'Encerrado', 'Cancelado'].includes(e.status)).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        </label>
      </div>
      {form.format !== 'text' && <section className="sg-media-selector">
        <div className="sg-media-selector-heading">
          <div>
            <b>{form.format === 'video' ? 'Imagem de capa' : 'Fotos da publicação'}</b>
            <small>
              {form.format === 'carousel'
                ? 'Escolha até dez fotos, na ordem em que devem aparecer.'
                : form.format === 'video'
                  ? 'Apenas a capa será exibida. A reprodução de vídeos ainda não está disponível.'
                  : 'Escolha uma imagem para contar essa história.'}
            </small>
          </div>
          <button className="sg-secondary" type="button" onClick={() => setUploadOpen(true)}>
            <Upload size={15} /> Enviar foto</button>
        </div>
        <div className="sg-media-grid">
          {data.media.map(media => <button
            type="button"
            className={form.mediaIds.includes(media.id) ? 'selected' : ''}
            key={media.id}
            aria-label={`Selecionar ${media.title}`}
            aria-pressed={form.mediaIds.includes(media.id)}
            onClick={() => selectMedia(media.id)}
          >
            <AuthPhoto media={media} token={token} />
            {form.mediaIds.includes(media.id) && <span className="sg-media-order">{form.mediaIds.indexOf(media.id) + 1}</span>}
            <small>{media.title}</small>
          </button>)}
        </div>
        {form.mediaIds.length > 1 && <div className="sg-selected-order">
          {form.mediaIds.map((id, i) => <div key={id}>
            <span>{i + 1}. {data.media.find(m => m.id === id)?.title}</span>
            <button
              type="button"
              className="sg-icon-button"
              disabled={i === 0}
              aria-label={`Mover foto ${i + 1} para antes`}
              onClick={() => move(i, -1)}
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              className="sg-icon-button"
              disabled={i === form.mediaIds.length - 1}
              aria-label={`Mover foto ${i + 1} para depois`}
              onClick={() => move(i, 1)}
            >
              <ArrowDown size={15} />
            </button>
          </div>)}
        </div>}
      </section>}
      {isAdmin && <label className="sg-checkbox">
        <input type="checkbox" checked={form.recommended} onChange={e => field('recommended', e.target.checked)} /> Recomendar esta publicação no feed</label>}
      {error && <p className="sg-inline-error" role="alert">{error}</p>}
      <div className="sg-compose-footer">
        <button className="sg-secondary" disabled={busy} type="submit" value="draft">
          <FileText size={16} /> Salvar rascunho</button>
        <button className="sg-primary" disabled={busy} type="submit" value="review">
          <Send size={16} /> {busy ? 'Salvando…' : 'Enviar para revisão'}
        </button>
      </div>
    </form>
    {uploadOpen && <UploadDialog
      publisherId={form.publisherId}
      token={token}
      onClose={() => setUploadOpen(false)}
      onUploaded={media => {
        onMedia(media);
        selectMedia(media.id);
        setUploadOpen(false);
        notify('Foto adicionada.');
      }}
    />}
  </SocialDialog>;
}

function UploadDialog({ publisherId, token, onClose, onUploaded }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget), file = form.get('photo');
    if (!file?.size || file.size > 8 * 1024 * 1024) {
      setError('Escolha uma foto JPG, PNG ou WebP de até 8 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error('Não foi possível ler a foto.'));
        reader.readAsDataURL(file);
      });
      const result = await api(
        '/admin/social/media',
        {
          token,
          method: 'POST',
          body: {
            publisherId,
            mimeType: file.type,
            imageData,
            altText: form.get('altText'),
            author: form.get('author'),
            licenseName: form.get('licenseName'),
            sourceUrl: form.get('sourceUrl'),
            licenseUrl: form.get('licenseUrl'),
            rightsConfirmed: form.get('rightsConfirmed') === 'on'
          }
        }
      );
      onUploaded(result.item);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <SocialDialog title="Enviar fotografia" onClose={onClose}>
    <span className="sg-kicker">ACERVO DA PÁGINA</span>
    <h2>Um novo olhar.</h2>
    <form className="sg-form" onSubmit={submit}>
      <label>Foto<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required /></label>
      <label>Descrição da imagem<input name="altText" maxLength={500} required placeholder="Descreva a imagem para quem não pode vê-la" />
      </label>
      <div className="sg-form-row">
        <label>Autoria<input name="author" required maxLength={160} /></label>
        <label>Licença ou autorização<input name="licenseName" required maxLength={160} placeholder="Ex.: Uso autorizado pelo autor" />
        </label>
      </div>
      <label>Link de origem (opcional)<input type="url" name="sourceUrl" /></label>
      <label>Link da licença (opcional)<input type="url" name="licenseUrl" /></label>
      <label className="sg-checkbox">
        <input type="checkbox" name="rightsConfirmed" required /> Tenho autorização para publicar esta foto e os créditos estão corretos.</label>
      {error && <p className="sg-inline-error" role="alert">{error}</p>}
      <button className="sg-primary" disabled={busy}>
        <Upload size={17} />
        {busy ? 'Enviando…' : 'Adicionar fotografia'}
      </button>
    </form>
  </SocialDialog>;
}
