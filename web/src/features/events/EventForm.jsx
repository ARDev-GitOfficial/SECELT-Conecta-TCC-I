import { ChevronRight } from 'lucide-react';
import { Button } from '../../shared/Button.jsx';

export function EventForm({ onSubmit, event }) {
  const dt = event?.startsAt
    ? new Date(new Date(event.startsAt).getTime() - new Date(event.startsAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : '';
  return <div className="form-modal">
    <span className="eyebrow green-text">
      {event?.status === 'Publicado'
        ? 'EDIÇÃO DO CALENDÁRIO'
        : event ? 'AJUSTE DE CONTEÚDO' : 'NOVO CONTEÚDO · RASCUNHO'}
    </span>
    <h2>
      {event?.status === 'Publicado'
        ? 'Editar evento publicado'
        : event ? 'Revise o rascunho.' : 'Cadastre um evento.'}
    </h2>
    <p>
      {event?.status === 'Publicado'
        ? 'A alteração aparece na agenda pública e gera um registro de atualização.'
        : event
          ? 'Atualize as informações devolvidas pela revisão.'
          : 'Depois de salvar, você poderá enviar o rascunho à fila de aprovação.'}
    </p>
    <form className="event-form" onSubmit={onSubmit}>
      <label>Título do evento<input
        name="title"
        placeholder="Ex.: Festival de Cultura Guamaense"
        defaultValue={event?.title || ''}
        required
      />
      </label>
      <label>Descrição<textarea
        name="description"
        placeholder="Conte o que o público precisa saber"
        defaultValue={event?.description || ''}
      />
      </label>
      <div className="form-row">
        <label>Categoria<select name="category" defaultValue={event?.category || 'Cultura'}>
          <option>Cultura</option>
          <option>Esporte</option>
          <option>Lazer</option>
        </select>
        </label>
        <label>Data e horário<input name="startsAt" type="datetime-local" defaultValue={dt} required /></label>
      </div>
      <label>Local<input
        name="location"
        placeholder="Praça, estádio ou endereço"
        defaultValue={event?.location || ''}
        required
      />
      </label>
      <div className="form-row">
        <label>Faixa etária<input name="ageRange" defaultValue={event?.ageRange || 'Livre'} /></label>
        <label>Vagas<input name="capacity" type="number" min="0" defaultValue={event?.capacity ?? 100} /></label>
      </div>
      <label>Regra de bebida<input name="drinkRule" defaultValue={event?.drinkRule || 'Não informado'} /></label>
      <div className="form-row">
        <label>Organizador<select name="organizerType" defaultValue={event?.organizerType || 'Prefeitura'}>
          <option>Prefeitura</option>
          <option>SECELT</option>
          <option>Privado</option>
        </select>
        </label>
        <label className="checkbox-line">
          <input name="isFree" type="checkbox" defaultChecked={event ? !!event.isFree : true} /> Evento gratuito</label>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="button outline"
          onClick={() => document.dispatchEvent(new Event('close-dialog'))}
        >Cancelar</button>
        <Button type="submit">{event ? 'Salvar ajustes' : 'Salvar rascunho'} <ChevronRight size={15} /></Button>
      </div>
    </form>
  </div>;
}
