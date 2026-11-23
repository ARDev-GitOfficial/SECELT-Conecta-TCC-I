import { Check } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../shared/api.js';
import { Avatar, PageBadge } from '../ui.jsx';

export function PageEditor({ page, token, notify, onSaved }) {
  const [busy, setBusy] = useState(false), [name, setName] = useState(page.name), [bio, setBio] = useState(page.bio);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/admin/social/pages/${page.id}`, { token, method: 'PUT', body: { name, bio } });
      notify('Página atualizada.');
      onSaved();
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  };
  return <form className="sg-page-editor sg-glass sg-form" onSubmit={submit}>
    <div className="sg-page-editor-header">
      <Avatar name={page.name} page={page} size="lg" />
      <div>
        <b>@{page.handle} <PageBadge page={page} /></b>
        <small>{page.kind === 'official' ? 'Página oficial' : 'Parceiro autorizado'}</small>
      </div>
    </div>
    <label>Nome da página<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} />
    </label>
    <label>Apresentação<textarea maxLength={500} rows={3} value={bio} onChange={e => setBio(e.target.value)} />
    </label>
    <button className="sg-secondary" disabled={busy}>
      <Check size={16} />
      {busy ? 'Salvando…' : 'Salvar apresentação'}
    </button>
  </form>;
}
