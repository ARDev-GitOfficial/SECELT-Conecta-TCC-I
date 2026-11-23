import { ChevronRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api.js';
import { Button } from '../../shared/Button.jsx';

export function UserAdmin({ token, onCreate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const refresh = () => api('/admin/users', { token }).then(d => setUsers(d.items)).catch(() => setUsers([])).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, [token]);
  return <article className="admin-panel table-panel">
    <div className="admin-panel-head">
      <div><h3>Contas de servidores</h3><p>Acesso institucional por perfil e princípio de menor privilégio</p></div>
      <Button onClick={onCreate}><Plus size={14} /> Nova conta</Button>
    </div>
    <div className="table-scroll">
      <table>
        <thead><tr><th>SERVIDOR</th><th>E-MAIL</th><th>PERFIL</th><th>ACESSO</th></tr></thead>
        <tbody>
          {users.map(u => <tr key={u.id}>
            <td><b>{u.name}</b></td>
            <td>{u.email}</td>
            <td>{u.role}</td>
            <td>{u.active ? 'Ativo' : 'Inativo'}</td>
          </tr>)}
        </tbody>
      </table>
      {loading && <p className="empty-state">Carregando contas…</p>}
    </div>
  </article>;
}
export function UserForm({ onSubmit }) {
  return <div className="form-modal">
    <span className="eyebrow green-text">ACESSO INSTITUCIONAL</span>
    <h2>Nova conta de servidor.</h2>
    <p>Defina um perfil compatível com a função do servidor na SECELT.</p>
    <form className="event-form" onSubmit={onSubmit}>
      <label>Nome completo<input name="name" required maxLength="120" /></label>
      <label>E-mail institucional<input name="email" type="email" required maxLength="200" /></label>
      <label>Perfil<select name="role"><option>Editor SECELT</option><option>Administrador Geral</option></select>
      </label>
      <label>Senha temporária<input name="password" type="password" minLength="10" required /></label>
      <div className="form-actions"><Button type="submit">Criar conta <ChevronRight size={15} /></Button></div>
    </form>
  </div>;
}
