import { Pencil, Plus } from 'lucide-react';
import { fmtDateTime } from '../../shared/dates.js';
import { StatusTag } from '../../shared/StatusTag.jsx';

export function TourismAdmin({ places, isAdmin, onCreate, onEdit, onStatus }) {
  const action = p => <div className="row-actions">
    {['Rascunho', 'Reprovado'].includes(p.status) && <>
      <button className="submit-review" onClick={() => onEdit(p.id)}><Pencil size={11} /> Ajustar</button>
      <button className="submit-review" onClick={() => onStatus(p.id, 'Aguardando Aprovação')}>Enviar à fila</button>
    </>}
    {p.status === 'Aguardando Aprovação' && isAdmin && <>
      <button className="approve mini-action" onClick={() => onStatus(p.id, 'Publicado')}>Publicar</button>
      <button className="reject mini-action" onClick={() => onStatus(p.id, 'Reprovado')}>Devolver</button>
    </>}
    {p.status === 'Publicado' && isAdmin && <>
      <button className="submit-review" onClick={() => onEdit(p.id)}><Pencil size={11} /> Editar</button>
      <button className="reject mini-action" onClick={() => onStatus(p.id, 'Arquivado')}>Arquivar</button>
    </>}
  </div>;
  return <>
    <div className="welcome-row">
      <div>
        <h2>Locais da galeria</h2>
        <p>O editor envia rascunhos; o Administrador Geral publica na área pública.</p>
      </div>
      <button className="button blue" onClick={onCreate}><Plus size={15} /> Novo ponto turístico</button>
    </div>
    <article className="admin-panel table-panel">
      <div className="admin-panel-head">
        <div><h3>Pontos turísticos e de lazer</h3><p>Cadastros salvos no SQLite</p></div>
        <span className="queue-count">{places.length} LOCAIS</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>LOCAL</th><th>CATEGORIA</th><th>ENDEREÇO</th><th>ATUALIZADO</th><th>STATUS</th><th>AÇÃO</th></tr>
          </thead>
          <tbody>
            {places.map(p => <tr key={p.id}>
              <td><b>{p.name}</b></td>
              <td>{p.category}</td>
              <td>{p.address}</td>
              <td>{fmtDateTime(p.updatedAt)}</td>
              <td><StatusTag status={p.status} /></td>
              <td>{action(p)}</td>
            </tr>)}
          </tbody>
        </table>
        {!places.length && <p className="empty-state">Nenhum ponto turístico cadastrado.</p>}
      </div>
    </article>
  </>;
}
