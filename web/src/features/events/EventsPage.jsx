import { BadgeCheck, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dayKey, fmtDate, fmtDateTime } from '../../shared/dates.js';
import { CalendarMonth } from './CalendarMonth.jsx';

export function EventsPage({ events, loading, search, setSearch, onOpen }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState('');
  useEffect(
    () => {
      if (!selected && events.length) {
        const next = [...events].filter(e => e.status === 'Publicado').sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];
        setSelected(dayKey(next?.startsAt || new Date()));
      }
    },
    [events, selected]
  );
  const onMonth = offset => {
    const d = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(d);
    setSelected(dayKey(d));
  };
  const updated = events.reduce((a, e) => !a || e.updatedAt > a ? e.updatedAt : a, '');
  const dayEvents = events.filter(e => dayKey(e.startsAt) === selected && (e.title + ' ' + e.location + ' ' + e.category).toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-banner events-banner">
      <span className="eyebrow">AGENDA PÚBLICA</span>
      <h1>Calendário<br /><em>de eventos.</em></h1>
      <p>Consulte datas, locais e informações de inscrição.</p>
      <div className="calendar-update">
        <RefreshCw size={18} />
        <span>
          <small>ÚLTIMA ATUALIZAÇÃO DO CALENDÁRIO</small>
          <b>{updated ? 'Atualizado em ' + fmtDateTime(updated) : 'Aguardando a primeira publicação'}</b>
        </span>
        <span className="verified"><BadgeCheck size={13} /> Oficial</span>
      </div>
      <div className="event-banner-photo">
        <img src="/assets/tourism-igreja-matriz.jpg" alt="Igreja Matriz em São Miguel do Guamá" />
        <small className="photo-credit">
          <a
            href="https://commons.wikimedia.org/wiki/File:Primeira_igreja_de_S%C3%A3o_Miguel_do_Guam%C3%A1,_ao_p%C3%B4r_do_sol.jpg"
            target="_blank"
            rel="noreferrer"
          >Igreja Matriz · Vanessa S. Braga</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
        </small>
      </div>
    </div>
    <section className="section-wrap content-section event-calendar-page">
      <div className="calendar-toolbar">
        <div><span className="eyebrow muted">AGENDA MUNICIPAL</span><h2>Selecione uma data</h2></div>
        <label className="search-box">
          <Search size={15} />
          <input placeholder="Buscar evento ou local" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
      </div>
      <CalendarMonth
        events={events}
        month={month}
        selected={selected}
        onSelect={setSelected}
        onMonth={onMonth}
      />
      <div className="day-agenda">
        <div className="day-agenda-head">
          <div>
            <span className="eyebrow muted">EVENTOS DO DIA</span>
            <h2>
              {selected
                ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'America/Sao_Paulo' }).format(new Date(selected + 'T12:00:00'))
                : 'Escolha uma data'}
            </h2>
          </div>
          <span className="index">{dayEvents.length} {dayEvents.length === 1 ? 'EVENTO' : 'EVENTOS'}</span>
        </div>
        <div className="event-list">
          {loading
            ? <p>Carregando agenda…</p>
            : dayEvents.length
              ? dayEvents.map(e => <EventRow key={e.id} event={e} onOpen={onOpen} />)
              : <p className="empty-state">Nenhum evento nesta data. Toque em outro dia para consultar a agenda.</p>}
        </div>
        <div className="history-note">
          <span className="status-dot green" />
          <span>Eventos encerrados e cancelados continuam visíveis para consulta histórica.</span>
        </div>
      </div>
    </section>
  </>;
}
function EventRow({ event, onOpen }) {
  const status = event.status || 'Publicado',
    canceled = status === 'Cancelado',
    closed = status === 'Encerrado',
    photo = event.photos?.[0];
  return <button
    className={'event-row ' + (canceled ? 'event-cancelled' : '') + ' ' + (closed ? 'event-closed' : '')}
    onClick={() => onOpen(event.id)}
  >
    {photo && <img className="event-row-photo" src={photo.fileUrl} alt={photo.altText || event.title} loading="lazy" />}
    <span className="date-block">
      <b>{fmtDate(event.startsAt, { day: '2-digit' })}</b>
      <small>{fmtDate(event.startsAt, { month: 'short' }).replace('.', '').toUpperCase()}</small>
    </span>
    <span className="event-info">
      <small>{event.category.toUpperCase()} · {status.toUpperCase()}</small>
      <b>{event.title}</b>
      <span>
        {new Date(event.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} <i>·</i> {event.location}
      </span>
    </span>
    <span className="free-tag">{event.isFree ? 'GRATUITO' : 'PAGO'}</span>
    <ChevronRight size={17} className="event-arrow" />
  </button>;
}
