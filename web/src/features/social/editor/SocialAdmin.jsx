import { Archive, ArrowLeft, Check, Clock3, Eye, FileText, Image as ImageIcon, Layers, LogOut, Pencil, Play, Plus, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { routeHash } from '../../../app/routes.js';
import { api } from '../../../shared/api.js';
import { SocialDialog } from '../../../shared/Dialog.jsx';
import { ThemePicker } from '../ThemePicker.jsx';
import { EmptyState, relativeTime } from '../ui.jsx';
import { ComposeDialog } from './ComposeDialog.jsx';
import { ModerationPanel } from './ModerationPanel.jsx';
import { PageEditor } from './PageEditor.jsx';
import { AuthPhoto, PublicationPreview } from './PublicationPreview.jsx';

const STATUS_LABELS = {
  Todos: null,
  'Em revisão': 'Aguardando Aprovação',
  Publicados: 'Publicado',
  Rascunhos: ['Rascunho', 'Reprovado'],
  Retirados: 'Arquivado'
};
export function SocialAdmin({ token, user, events = [], section = 'Publicações', notify, onPublicChange, onExit, onLogout, embedded = false }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState('Todos'),
    [dialog, setDialog] = useState(null);
  const [partnerTab, setPartnerTab] = useState('Publicações');
  const activeSection = embedded ? section : partnerTab, isAdmin = user.role === 'Administrador Geral';
  const load = useCallback(async () => {
    setError('');
    try { setData(await api('/admin/social', { token })); } catch (e) { setError(e.message); }
  }, [token]);
  useEffect(() => { load(); }, [load]);
  const execute = async callback => {
    if (busy) return;
    setBusy(true);
    try {
      await callback();
      await load();
      onPublicChange?.();
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  };
  const changeStatus = (item, status, note = '') => execute(async () => {
    await api(`/admin/social/content/${item.id}/status`, { token, method: 'PATCH', body: { status, note } });
    notify(status === 'Publicado'
      ? 'Publicação aprovada e disponível.'
      : status === 'Arquivado'
        ? 'Conteúdo retirado.'
        : status === 'Reprovado' ? 'Conteúdo devolvido para ajustes.' : 'Conteúdo enviado para revisão.');
    setDialog(null);
  });
  const revise = item => execute(async () => {
    const result = await api(`/admin/social/content/${item.id}/revision`, { token, method: 'POST' });
    setDialog({ type: 'compose', item: result.item });
  });
  const items = (data?.items || []).filter(i => i.type === (activeSection === 'Stories' ? 'story' : 'post'));
  const shown = items.filter(i => {
    const status = STATUS_LABELS[filter];
    return !status || (Array.isArray(status) ? status.includes(i.status) : i.status === status);
  });
  return <div className={`sg-editorial ${embedded ? 'embedded' : ''}`}>
    {!embedded && <>
      <header className="sg-partner-header sg-glass">
        <a href={routeHash({ page: 'feed' })} onClick={onExit}>
          <img src="/assets/brand.svg" alt="" />
          <span><b>SECELT Conecta</b><small>Área de publicação</small></span>
        </a>
        <div>
          <ThemePicker compact />
          <button className="sg-text-button" onClick={onExit}><Eye size={17} /> Ver site</button>
          <button className="sg-icon-button" onClick={onLogout} aria-label="Sair da área de publicação">
            <LogOut size={19} />
          </button>
        </div>
      </header>
      <div className="sg-partner-intro">
        <span className="sg-kicker">OLÁ, {user.name.toLocaleUpperCase('pt-BR')}</span>
        <h1>Boas histórias<br />começam <em>com você.</em></h1>
        <p>Prepare seus conteúdos e acompanhe cada etapa da publicação.</p>
      </div>
      <div className="sg-profile-tabs">
        {['Publicações', 'Stories', 'Páginas'].map(tab => <button key={tab} className={activeSection === tab ? 'active' : ''} onClick={() => setPartnerTab(tab)}>{tab}</button>)}
      </div>
    </>}
    {error && <div role="alert" className="sg-error sg-glass">
      <p>{error}</p>
      <button className="sg-primary" onClick={load}>Tentar novamente</button>
    </div>}
    {!data && !error && <p role="status" className="sg-editor-loading">Carregando sua área de publicação…</p>}
    {data && (activeSection === 'Moderação'
      ? isAdmin
        ? <ModerationPanel notify={notify} />
        : <EmptyState icon={ShieldCheck} title="A moderação é feita pela SECELT." />
      : activeSection === 'Páginas'
        ? <>
          <div className="sg-editor-title">
            <div>
              <span className="sg-kicker">IDENTIDADE E CONEXÃO</span>
              <h2>As páginas que você representa.</h2>
              <p>Uma apresentação clara aproxima o público.</p>
            </div>
          </div>
          <div className="sg-page-edit-grid">
            {data.pages.map(page => <PageEditor page={page} key={page.id} token={token} notify={notify} onSaved={load} />)}
          </div>
        </>
        : <>
          <div className="sg-editor-title">
            <div>
              <span className="sg-kicker">
                {activeSection === 'Stories' ? 'REGISTROS E NOVIDADES' : 'HISTÓRIAS QUE APROXIMAM'}
              </span>
              <h2>{activeSection === 'Stories' ? 'Stories das suas páginas.' : 'O próximo post começa aqui.'}</h2>
              <p>
                {activeSection === 'Stories'
                  ? 'Ficam disponíveis até serem retirados pela página.'
                  : 'Crie, revise e acompanhe suas publicações.'}
              </p>
            </div>
            <div>
              <button className="sg-icon-button sg-glass" onClick={load} aria-label="Atualizar publicações">
                <RefreshCw size={18} />
              </button>
              <button
                className="sg-primary"
                onClick={() => setDialog({ type: 'compose', contentType: activeSection === 'Stories' ? 'story' : 'post' })}
              >
                <Plus size={18} />
                {activeSection === 'Stories' ? 'Novo Story' : 'Nova publicação'}
              </button>
            </div>
          </div>
          <div className="sg-editor-stats">
            {[
              [items.filter(i => i.status === 'Publicado').length, 'publicados', ImageIcon],
              [items.filter(i => i.status === 'Aguardando Aprovação').length, 'em revisão', Clock3],
              [items.filter(i => ['Rascunho', 'Reprovado'].includes(i.status)).length, 'em preparação', Pencil]
            ].map(([count, label, Icon]) => <div className="sg-glass" key={label}><Icon size={23} /><b>{count}</b><span>{label}</span></div>)}
          </div>
          <div className="sg-editor-filters">
            {Object.keys(STATUS_LABELS).map(label => <button
              key={label}
              aria-pressed={filter === label}
              className={filter === label ? 'active' : ''}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>)}
          </div>
          <div className="sg-editor-list">
            {shown.map(item => <article className="sg-editor-item sg-glass" key={item.id}>
              <div className="sg-editor-item-main">
                <div className="sg-editor-thumb">
                  {item.media[0] ? <AuthPhoto media={item.media[0]} token={token} /> : <FileText size={28} />}
                  <span>
                    {item.type === 'story'
                      ? <Layers size={14} />
                      : item.format === 'video' ? <Play size={14} /> : <ImageIcon size={14} />}
                  </span>
                </div>
                <div>
                  <span className={`sg-status ${item.status === 'Publicado'
                    ? 'published'
                    : item.status === 'Aguardando Aprovação' ? 'pending' : item.status === 'Reprovado' ? 'returned' : ''}`}>
                    {item.status === 'Reprovado' ? 'Ajustes solicitados' : item.status}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.publisher.name} · {item.category} · {relativeTime(item.updatedAt)}</p>
                  {item.replacesId && <small className="sg-revision-label">Nova versão · a anterior fica pública até a aprovação</small>}
                  {data.history.filter(h => h.content_id === item.id && h.to_status === 'Reprovado' && h.note).slice(0, 1).map(h => <small key={h.id} className="sg-review-note">Revisão: {h.note}</small>)}
                </div>
              </div>
              <div className="sg-editor-item-actions">
                <button className="sg-secondary" onClick={() => setDialog({ type: 'preview', item })}>
                  <Eye size={15} />
                  {item.status === 'Aguardando Aprovação' && isAdmin ? 'Revisar conteúdo' : 'Prévia'}
                </button>
                {['Rascunho', 'Reprovado'].includes(item.status) && <>
                  <button className="sg-secondary" disabled={busy} onClick={() => setDialog({ type: 'compose', item })}>
                    <Pencil size={15} /> Editar</button>
                  <button className="sg-primary" disabled={busy} onClick={() => changeStatus(item, 'Aguardando Aprovação')}>
                    <Send size={15} /> Enviar à revisão</button>
                </>}
                {item.status === 'Aguardando Aprovação' && isAdmin && <>
                  <button className="sg-secondary" disabled={busy} onClick={() => setDialog({ type: 'return', item })}>
                    <ArrowLeft size={15} /> Devolver</button>
                  <button className="sg-primary" disabled={busy} onClick={() => changeStatus(item, 'Publicado')}>
                    <Check size={16} /> Aprovar</button>
                </>}
                {item.status === 'Aguardando Aprovação' && !isAdmin && <span className="sg-awaiting"><Clock3 size={15} /> Aguardando a SECELT</span>}
                {item.status === 'Publicado' && <>
                  <a
                    className="sg-secondary"
                    href={routeHash({ page: item.type === 'story' ? 'publisher' : 'post', id: item.type === 'story' ? item.publisherId : item.rootId })}
                  >
                    <Eye size={15} /> Ver no site</a>
                  <button className="sg-secondary" disabled={busy} onClick={() => revise(item)}>
                    <Pencil size={15} /> Nova versão</button>
                </>}
                {item.status !== 'Arquivado' && <button
                  className="sg-icon-button sg-archive"
                  disabled={busy}
                  onClick={() => changeStatus(item, 'Arquivado')}
                  aria-label={`Retirar ${item.title}`}
                  title="Retirar conteúdo"
                >
                  <Archive size={17} />
                </button>}
              </div>
            </article>)}
          </div>
          {!shown.length && <EmptyState icon={ImageIcon} title="Espaço para a próxima boa história.">Nenhum conteúdo neste filtro.</EmptyState>}
        </>)}
    {dialog?.type === 'compose' && data && <ComposeDialog
      item={dialog.item}
      contentType={dialog.contentType}
      data={data}
      token={token}
      isAdmin={isAdmin}
      events={events}
      onClose={() => setDialog(null)}
      notify={notify}
      onSaved={async () => {
        setDialog(null);
        await load();
        onPublicChange?.();
      }}
      onMedia={media => setData(d => ({ ...d, media: [media, ...d.media] }))}
    />}
    {dialog?.type === 'preview' && <PublicationPreview
      item={dialog.item}
      token={token}
      isAdmin={isAdmin}
      busy={busy}
      onClose={() => setDialog(null)}
      onApprove={() => changeStatus(dialog.item, 'Publicado')}
      onReturn={() => setDialog({ type: 'return', item: dialog.item })}
    />}
    {dialog?.type === 'return' && <SocialDialog title="Devolver conteúdo para ajustes" onClose={() => setDialog(null)}>
      <span className="sg-kicker">REVISÃO DE CONTEÚDO</span>
      <h2>O que precisa melhorar?</h2>
      <p>{dialog.item.title}</p>
      <form
        className="sg-form"
        onSubmit={e => {
          e.preventDefault();
          changeStatus(dialog.item, 'Reprovado', new FormData(e.currentTarget).get('note'));
        }}
      >
        <label>Orientação para a página<textarea name="note" maxLength={1000} rows={4} required placeholder="Explique os ajustes necessários…" />
        </label>
        <button className="sg-primary" disabled={busy}>Devolver com orientação</button>
      </form>
    </SocialDialog>}
  </div>;
}
