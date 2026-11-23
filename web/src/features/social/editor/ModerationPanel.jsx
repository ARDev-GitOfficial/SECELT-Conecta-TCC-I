import { ArrowRight, Check, Eye, FileText, Flag, ShieldCheck, X } from 'lucide-react';
import { routeHash } from '../../../app/routes.js';
import { useCommunity } from '../community.jsx';
import { Avatar, EmptyState, relativeTime } from '../ui.jsx';

export function ModerationPanel({ notify }) {
  const { state, setState } = useCommunity();
  const reports = state.reports.filter(r => r.status === 'pending');
  const resolve = (report, remove) => {
    setState(s => {
      const next = { ...s, reports: s.reports.map(r => r.id === report.id ? { ...r, status: remove ? 'removed' : 'reviewed' } : r) };
      if (remove && report.type === 'post') next.hiddenPosts = [...new Set([...s.hiddenPosts, report.postId])];
      if (remove && report.type === 'comment') next.comments = { ...s.comments, [report.postId]: (s.comments[report.postId] || []).map(c => c.id === report.targetId ? { ...c, removed: true } : c) };
      return next;
    });
    notify(remove ? 'Conteúdo ocultado.' : 'Denúncia revisada.');
  };
  const comments = Object.entries(state.comments).flatMap(([postId, items]) => items.filter(c => !c.removed).map(c => ({ ...c, postId }))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <>
    <div className="sg-editor-title">
      <div>
        <span className="sg-kicker">CUIDAR DA CONVERSA</span>
        <h2>Um espaço de respeito.</h2>
        <p>Revise denúncias e acompanhe os comentários.</p>
      </div>
    </div>
    <div className="sg-section-label"><Flag size={16} /> DENÚNCIAS PENDENTES <span>{reports.length}</span></div>
    {reports.length
      ? reports.map(report => <article className="sg-report-item sg-glass" key={report.id}>
        <span className="sg-status pending">{report.reason}</span>
        <h3>{report.title}</h3>
        <p>Recebida {relativeTime(report.createdAt)}</p>
        <div>
          <button className="sg-secondary" onClick={() => resolve(report, false)}>
            <Check size={15} /> Manter conteúdo</button>
          <button className="sg-danger-button" onClick={() => resolve(report, true)}>
            <Eye size={15} /> Ocultar conteúdo</button>
        </div>
      </article>)
      : <EmptyState icon={ShieldCheck} title="Tudo em dia por aqui.">Nenhuma denúncia pendente de revisão.</EmptyState>}
    <div className="sg-section-label"><FileText size={16} /> COMENTÁRIOS RECENTES</div>
    {comments.map(comment => <div className="sg-moderation-comment sg-glass" key={comment.id}>
      <Avatar name={comment.author} />
      <div>
        <b>{comment.author}</b>
        <p>{comment.text}</p>
        <a href={routeHash({ page: 'post', id: comment.postId })}>Ver publicação <ArrowRight size={13} /></a>
      </div>
      <button
        className="sg-icon-button"
        aria-label="Remover comentário"
        onClick={() => {
          setState(s => ({
            ...s,
            comments: { ...s.comments, [comment.postId]: (s.comments[comment.postId] || []).map(c => c.id === comment.id ? { ...c, removed: true } : c) }
          }));
          notify('Comentário removido.');
        }}
      >
        <X size={18} />
      </button>
    </div>)}
  </>;
}
