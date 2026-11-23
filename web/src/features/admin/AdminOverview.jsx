import { BadgeCheck, CalendarDays, ChevronRight, Clock3, FileText, MapPin, Plus } from 'lucide-react';
import { statGlassConfig } from '../../effects/statGlass.js';
import { Button } from '../../shared/Button.jsx';
import { fmtDateTime } from '../../shared/dates.js';
import { AdminTable, ApprovalItem } from './EventManagement.jsx';
import { useStatGlass } from '../../effects/useStatGlass.js';

export function AdminOverview({ user, events, places, overview, isAdmin, onCreate, onCreatePlace, onEdit, onStatus, openEvents }) {
  const stats = useStatGlass();
  const queue = events.filter(event => event.status === 'Aguardando Aprovação');
  return <>
    <div className="welcome-row">
      <div><h2>Olá, {user.name.split(' ')[0]}</h2><p>Acompanhe conteúdos, publicações e a agenda oficial.</p></div>
      <div className="admin-actions">
        <Button onClick={onCreate}><Plus size={15} /> Novo evento</Button>
        <button className="button outline" onClick={onCreatePlace}><MapPin size={14} /> Novo ponto</button>
      </div>
    </div>
    <div className="stat-grid" ref={stats}>
      <span className="liquid-scene stat-scene" aria-hidden="true" />
      {[
        ['AGUARDANDO APROVAÇÃO', String(overview.pending).padStart(2, '0'), 'Requer revisão', Clock3, 'amber'],
        ['EVENTOS PUBLICADOS', String(overview.published).padStart(2, '0'), 'Visíveis na agenda', FileText, 'blue'],
        [
          'PONTOS TURÍSTICOS',
          String(places.filter(p => p.status === 'Publicado').length).padStart(2, '0'),
          'Na galeria pública',
          MapPin,
          'green'
        ]
      ].map(([title, value, caption, Icon, color]) => <article className="stat-card liquid-target" data-config={statGlassConfig} key={title}>
        <span>{title}</span>
        <b>{value}</b>
        <small><i className={`status-dot ${color === 'amber' ? 'amber' : 'green'}`} />{caption}</small>
        <Icon className={`stat-icon ${color}-icon`} size={18} />
      </article>)}
    </div>
    <div className="admin-columns">
      <article className="admin-panel queue-panel">
        <div className="admin-panel-head">
          <div><h3>Fila de aprovação</h3><p>Eventos enviados para revisão</p></div>
          <span className="queue-count">{String(queue.length).padStart(2, '0')} PENDENTES</span>
        </div>
        {queue.length
          ? queue.slice(0, 4).map(e => <ApprovalItem key={e.id} event={e} isAdmin={isAdmin} onStatus={onStatus} />)
          : <div className="empty-inline"><BadgeCheck size={19} />A fila está vazia.</div>}
        <button className="text-link queue-link" onClick={openEvents}>Abrir eventos →</button>
      </article>
      <article className="admin-panel calendar-panel">
        <div className="admin-panel-head">
          <div><h3>Calendário oficial</h3><p>Atualização mais recente</p></div>
          <CalendarDays className="calendar-icon" />
        </div>
        <div className="calendar-last">
          <span className="status-dot green" />
          <b>{overview.calendarUpdated ? 'Agenda atualizada' : 'Aguardando publicação'}</b>
        </div>
        <strong>{fmtDateTime(overview.calendarUpdated) || '—'}</strong>
        <p>{events.filter(e => e.status === 'Publicado').length} eventos disponíveis ao público.</p>
        <button className="button outline full" onClick={openEvents}>Abrir calendário <ChevronRight size={14} />
        </button>
      </article>
    </div>
    <AdminTable events={events.slice(0, 5)} onStatus={onStatus} onEdit={onEdit} isAdmin={isAdmin} />
  </>;
}
