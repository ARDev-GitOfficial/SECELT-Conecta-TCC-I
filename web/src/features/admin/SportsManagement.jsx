import { useEffect, useState } from 'react';
import { api } from '../../shared/api.js';

export function SportsAdmin({ competitions }) {
  return <article className="admin-panel table-panel">
    <div className="admin-panel-head">
      <div><h3>Competições municipais</h3><p>Equipes, participantes e partidas cadastradas</p></div>
    </div>
    <table>
      <thead><tr><th>COMPETIÇÃO</th><th>MODALIDADE</th><th>EDIÇÃO</th><th>STATUS</th></tr></thead>
      <tbody>
        {competitions.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.sport}</td><td>{c.edition}</td><td>{c.status}</td></tr>)}
      </tbody>
    </table>
  </article>;
}
export function TeamAdmin({ token }) {
  const [items, setItems] = useState([]);
  useEffect(() => { api('/admin/teams', { token }).then(d => setItems(d.items)).catch(() => { }); }, [token]);
  return <article className="admin-panel table-panel">
    <div className="admin-panel-head"><div><h3>Equipes e competições</h3></div></div>
    <table>
      <thead><tr><th>EQUIPE</th><th>COMPETIÇÃO</th><th>TÉCNICO</th></tr></thead>
      <tbody>{items.map(x => <tr key={x.id}><td>{x.name}</td><td>{x.competition}</td><td>{x.coach}</td></tr>)}</tbody>
    </table>
  </article>;
}
