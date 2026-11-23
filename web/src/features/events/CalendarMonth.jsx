import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dayKey } from '../../shared/dates.js';

export function CalendarMonth({ events, month, selected, onSelect, onMonth }) {
  const start = month.getDay(),
    offset = (start + 6) % 7,
    count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    total = Math.ceil((offset + count) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  const eventDays = new Set(events.map(e => dayKey(e.startsAt)));
  const monthText = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);
  const label = monthText.charAt(0).toLocaleUpperCase('pt-BR') + monthText.slice(1);
  return <div className="calendar-month">
    <div className="month-head">
      <button aria-label="Mês anterior" onClick={() => onMonth(-1)}><ChevronLeft size={18} /></button>
      <h3>{label}</h3>
      <button aria-label="Próximo mês" onClick={() => onMonth(1)}><ChevronRight size={18} /></button>
    </div>
    <div className="calendar-weekdays">
      {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(d => <span key={d}>{d}</span>)}
    </div>
    <div className="calendar-days">
      {cells.map((date, i) => {
        const key = dayKey(date);
        const sameMonth = date.getMonth() === month.getMonth();
        return <button
          key={key + '-' + i}
          className={(sameMonth ? '' : 'other-month') + ' ' + (selected === key ? 'selected' : '') + ' ' + (eventDays.has(key) ? 'has-events' : '')}
          onClick={() => onSelect(key)}
          aria-label={new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date)}
        >
          <span>{date.getDate()}</span>
          {eventDays.has(key) && <i />}
        </button>;
      })}
    </div>
  </div>;
}
