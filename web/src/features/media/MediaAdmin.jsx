import { Image as ImageIcon, ImagePlus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusTag } from '../../shared/StatusTag.jsx';

function MediaPreview({ item, token }) {
  const [src, setSrc] = useState('');
  useEffect(
    () => {
      let alive = true, objectUrl = '';
      fetch(item.fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(res => res.ok ? res.blob() : Promise.reject()).then(blob => {
        objectUrl = URL.createObjectURL(blob);
        if (alive) setSrc(objectUrl);
      }).catch(() => { });
      return () => {
        alive = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    },
    [item.fileUrl, token]
  );
  return <div className="media-thumb">{src ? <img src={src} alt={item.altText} /> : <ImageIcon size={20} />}</div>;
}
export function MediaAdmin({ media, isAdmin, token, onCreate, onStatus }) {
  const [filter, setFilter] = useState('Todos'), items = media.filter(item => filter === 'Todos' || item.section === filter);
  const action = item => <div className="row-actions media-actions">
    {['Rascunho', 'Reprovado'].includes(item.status) && <button className="submit-review" onClick={() => onStatus(item.id, 'Aguardando Aprovação')}>Enviar à fila</button>}
    {item.status === 'Aguardando Aprovação' && isAdmin && <>
      <button className="approve mini-action" onClick={() => onStatus(item.id, 'Publicado')}>Publicar</button>
      <button className="reject mini-action" onClick={() => onStatus(item.id, 'Reprovado')}>Devolver</button>
    </>}
    {item.status === 'Publicado' && isAdmin && <button className="reject mini-action" onClick={() => onStatus(item.id, 'Arquivado')}>Arquivar</button>}
  </div>;
  return <>
    <div className="welcome-row">
      <div>
        <h2>Fotos de São Miguel do Guamá</h2>
        <p>Créditos e origem acompanham cada imagem. Fotos novas passam pela revisão administrativa.</p>
      </div>
      <button className="button blue" onClick={onCreate}><ImagePlus size={15} /> Adicionar foto</button>
    </div>
    <div className="media-filter-row">
      {['Todos', 'Turismo', 'Esporte', 'Eventos'].map(section => <button className={filter === section ? 'selected' : ''} key={section} onClick={() => setFilter(section)}>
        {section}
      </button>)}
      <span>{items.length} {items.length === 1 ? 'FOTO' : 'FOTOS'}</span>
    </div>
    <article className="admin-panel table-panel">
      <div className="admin-panel-head">
        <div><h3>Acervo visual</h3><p>Arquivos no projeto ou enviados por servidores</p></div>
        <span className="queue-count">
          {String(items.filter(x => x.status === 'Aguardando Aprovação').length).padStart(2, '0')} EM REVISÃO</span>
      </div>
      <div className="table-scroll">
        <table className="media-admin-table">
          <thead>
            <tr><th>FOTO E TÍTULO</th><th>MÓDULO / VÍNCULO</th><th>AUTORIA / LICENÇA</th><th>STATUS</th><th>AÇÃO</th></tr>
          </thead>
          <tbody>
            {items.map(item => <tr key={item.id}>
              <td>
                <div className="media-title-cell">
                  <MediaPreview item={item} token={token} />
                  <div><b>{item.title}</b><small>{item.altText}</small></div>
                </div>
              </td>
              <td>
                {item.section}
                <small className="media-relation">{item.entityType === 'municipality' ? 'Galeria municipal' : item.entityId}</small>
              </td>
              <td>
                <b>{item.author}</b>
                <small>{item.licenseName}</small>
                {item.sourceUrl && <a className="media-source" href={item.sourceUrl} target="_blank" rel="noreferrer">Ver origem</a>}
                {item.licenseUrl && <a className="media-source" href={item.licenseUrl} target="_blank" rel="noreferrer">Ver licença</a>}
              </td>
              <td><StatusTag status={item.status} /></td>
              <td>{action(item)}</td>
            </tr>)}
          </tbody>
        </table>
        {!items.length && <p className="empty-state">Nenhuma foto nesta categoria.</p>}
      </div>
    </article>
    <p className="media-rights-note">
      <ShieldCheck size={15} /> Só publique imagens identificadas como fotografias de São Miguel do Guamá e com licença ou autorização registrada.</p>
  </>;
}
