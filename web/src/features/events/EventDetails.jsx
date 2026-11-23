import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { fmtDateTime } from '../../shared/dates.js';

export function EventDetails({ event, onRegister }) {
  const [registering, setRegistering] = useState(false);
  const isCancelled = event.status === 'Cancelado',
    isClosed = event.status === 'Encerrado',
    registrationAvailable = event.status === 'Publicado' && event.isFree,
    canRegister = registrationAvailable && Boolean(onRegister);
  const submit = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onRegister(data.get('name'), data.get('email'));
  };
  return <div className="event-details">
    <span className="eyebrow green-text">{event.category} · {event.status}</span>
    <h2>{event.title}</h2>
    <p>{event.description || 'Informações publicadas pela organização do evento.'}</p>
    {event.photos?.[0] && <div className="event-detail-photo">
      <img src={event.photos[0].fileUrl} alt={event.photos[0].altText || event.title} />
      <small>
        <a href={event.photos[0].sourceUrl || '#'} target="_blank" rel="noreferrer">Foto: {event.photos[0].author}</a> · {event.photos[0].licenseName}
      </small>
    </div>}
    <div className="detail-grid">
      <div><small>DATA E HORÁRIO</small><b>{fmtDateTime(event.startsAt)}</b></div>
      <div><small>LOCAL</small><b>{event.location}</b></div>
      <div><small>FAIXA ETÁRIA</small><b>{event.ageRange || 'Livre'}</b></div>
      <div><small>ORGANIZAÇÃO</small><b>{event.organizerType || 'SECELT'}</b></div>
      <div><small>ENTRADA</small><b>{event.isFree ? 'Gratuita' : 'Paga'}</b></div>
      <div><small>REGRA DE BEBIDA</small><b>{event.drinkRule || 'Não informado'}</b></div>
    </div>
    {isCancelled && <p className="event-status-note canceled-note">Este evento foi cancelado. A informação permanece no calendário oficial.</p>}
    {isClosed && <p className="event-status-note">Este evento foi encerrado. Consulte o histórico da agenda.</p>}
    {!event.isFree && <p className="event-status-note">O app não oferece pagamento ou checkout. Consulte a organização para detalhes.</p>}
    {registrationAvailable && !onRegister && <p className="event-status-note">Inscrições indisponíveis na demonstração.</p>}
    {canRegister && !registering && <button className="button green-button full" onClick={() => setRegistering(true)}>Inscrever-se e gerar QR Code <QrCode size={16} />
    </button>}
    {registering && canRegister && <form className="register-form" onSubmit={submit}>
      <label>Nome completo<input name="name" autoComplete="name" required maxLength="120" /></label>
      <label>E-mail<input name="email" type="email" autoComplete="email" required maxLength="200" /></label>
      <div className="form-actions">
        <button type="button" className="button outline" onClick={() => setRegistering(false)}>Voltar</button>
        <button className="button green-button" type="submit">Gerar ingresso <QrCode size={15} /></button>
      </div>
    </form>}
  </div>;
}
export function Ticket({ event, qr }) {
  return <div className="ticket-modal">
    <span className="eyebrow green-text">INSCRIÇÃO CONFIRMADA</span>
    <h2>Ingresso digital</h2>
    <p>{event.title}</p>
    <div className="ticket-code"><QRCodeSVG value={qr} size={204} level="M" includeMargin /></div>
    <b>{fmtDateTime(event.startsAt)}</b>
    <small>{event.location}</small>
    <p>Apresente este código na entrada do evento.</p>
  </div>;
}
