import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api.js';
import { Art } from '../../shared/Brand.jsx';
import { fmtDate, fmtDateTime } from '../../shared/dates.js';
import { StatusTag } from '../../shared/StatusTag.jsx';

export function ApprovalItem({ event, isAdmin, onStatus }) {
  return <div className="approval-item">
    <div className="approval-thumb"><Art kind="admin-art a1" /></div>
    <div className="approval-details">
      <span className="content-type">{event.category.toUpperCase()} · {fmtDate(event.startsAt).toUpperCase()}</span>
      <b>{event.title}</b>
      <small>{event.location} · {fmtDateTime(event.updatedAt)}</small>
    </div>
    <span className="pending-tag">Aguardando</span>
    <div className="approval-actions">
      {isAdmin
        ? <>
          <button className="approve" onClick={() => onStatus(event.id, 'Publicado')}><Check size={12} /> Aprovar</button>
          <button className="reject" onClick={() => onStatus(event.id, 'Reprovado')}><X size={12} /> Devolver</button>
        </>
        : <span className="role-note">Somente Administrador Geral publica</span>}
    </div>
  </div>;
}
export function AdminTable({ events, onStatus, onEdit, isAdmin }) {
  return <article className="admin-panel table-panel">
    <div className="admin-panel-head">
      <div><h3>Agenda e conteúdos</h3><p>Registros salvos no sistema</p></div>
      <span className="queue-count">{events.length} REGISTROS</span>
    </div>
    <div className="table-scroll">
      <table>
        <thead><tr><th>EVENTO</th><th>MÓDULO</th><th>LOCAL</th><th>DATA</th><th>STATUS</th><th>AÇÃO</th></tr></thead>
        <tbody>
          {events.map(e => <tr key={e.id}>
            <td><b>{e.title}</b></td>
            <td>{e.category}</td>
            <td>{e.location}</td>
            <td>{fmtDateTime(e.startsAt)}</td>
            <td><StatusTag status={e.status} /></td>
            <td className="row-actions">
              {['Rascunho', 'Reprovado'].includes(e.status) && <>
                <button className="submit-review" onClick={() => onEdit(e.id)}><Pencil size={11} /> Ajustar</button>
                <button className="submit-review" onClick={() => onStatus(e.id, 'Aguardando Aprovação')}>Enviar à fila</button>
              </>}
              {e.status === 'Aguardando Aprovação' && isAdmin && <>
                <button className="approve mini-action" onClick={() => onStatus(e.id, 'Publicado')}>Aprovar</button>
                <button className="reject mini-action" onClick={() => onStatus(e.id, 'Reprovado')}>Devolver</button>
              </>}
              {e.status === 'Publicado' && isAdmin && <>
                <button className="submit-review" onClick={() => onEdit(e.id)}><Pencil size={11} /> Editar</button>
                <button className="mini-action" onClick={() => onStatus(e.id, 'Encerrado')}>Encerrar</button>
                <button className="reject mini-action" onClick={() => onStatus(e.id, 'Cancelado')}>Cancelar</button>
              </>}
            </td>
          </tr>)}
        </tbody>
      </table>
      {!events.length && <p className="empty-state">Nenhum evento encontrado neste filtro.</p>}
    </div>
  </article>;
}
export function RegistrationAdmin({ events, token }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState('');
  useEffect(
    () => {
      if (selected) api(`/admin/events/${selected}/registrations`, { token }).then(d => setList(d.items)).catch(() => setList([]));
    },
    [selected, token]
  );
  const eligible = events.filter(e => e.status === 'Publicado');
  return <article className="admin-panel table-panel">
    <div className="admin-panel-head">
      <div><h3>Inscrições por evento</h3><p>Inscrições confirmadas neste evento</p></div>
      <select className="filter-select" value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">Selecione um evento</option>
        {eligible.map(e => <option value={e.id} key={e.id}>{e.title}</option>)}
      </select>
    </div>
    <table>
      <thead><tr><th>NOME</th><th>E-MAIL</th><th>DATA DA INSCRIÇÃO</th><th>CHECK-IN</th></tr></thead>
      <tbody>
        {list.map(r => <tr key={r.id}>
          <td>{r.name}</td>
          <td>{r.email}</td>
          <td>{fmtDateTime(r.createdAt)}</td>
          <td>{r.checkinStatus}</td>
        </tr>)}
      </tbody>
    </table>
    {selected && !list.length && <p className="empty-state">Ainda não há inscrições para este evento.</p>}
  </article>;
}
