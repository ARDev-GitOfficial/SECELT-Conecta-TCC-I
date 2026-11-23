import { api } from '../../shared/api.js';

export function adminActions({ token, user, modal, setModal, notify, selectedAdminEvent, loadAdmin, loadPublic }) {
  function saveDraft(resource, editing, body) {
    const path = '/admin/' + resource + (editing ? '/' + modal.id : '');
    return api(path, {method: editing ? 'PUT' : 'POST', token, body});
  }

  function statusAction(resource, published, updated) {
    return async (id, status) => {
      try {
        await api('/admin/' + resource + '/' + id + '/status', { method: 'PATCH', token, body: { status } });
        notify(status === 'Publicado' ? published : updated);
        await loadAdmin();
        await loadPublic();
      }
      catch (error) { notify(error.message); }
    };
  }
  const saveEvent = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get('title'),
      description: f.get('description'),
      category: f.get('category'),
      startsAt: new Date(f.get('startsAt')).toISOString(),
      location: f.get('location'),
      ageRange: f.get('ageRange'),
      drinkRule: f.get('drinkRule'),
      organizerType: f.get('organizerType'),
      isFree: f.get('isFree') === 'on',
      capacity: Number(f.get('capacity'))
    };
    const wasPublished = selectedAdminEvent?.status === 'Publicado';
    try {
      await saveDraft('events', modal?.type === 'edit-event', body);
      setModal(null);
      notify(modal?.type === 'edit-event'
        ? (wasPublished ? 'Calendário atualizado e nota publicada no feed.' : 'Ajustes salvos no rascunho.')
        : 'Rascunho salvo. Envie para aprovação quando estiver pronto.');
      await loadAdmin();
      await loadPublic();
    } catch (e) { notify(e.message); }
  };
  const savePlace = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get('name'),
      description: f.get('description'),
      category: f.get('category'),
      address: f.get('address'),
      placeId: f.get('placeId'),
      latitude: f.get('latitude'),
      longitude: f.get('longitude')
    };
    try {
      await saveDraft('tourism', modal?.type === 'edit-place', body);
      setModal(null);
      notify('Ponto turístico salvo como rascunho.');
      await loadAdmin();
    } catch (e) { notify(e.message); }
  };
  const saveMedia = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), file = f.get('imageFile');
    if (!(file instanceof File) || !file.size) {
      notify('Escolha uma foto para continuar.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('A imagem deve ter no máximo 8 MB.');
      return;
    }
    const entityKey = String(f.get('entityKey') || ''),
      split = entityKey.indexOf(':'),
      entityType = entityKey.slice(0, split),
      entityId = entityKey.slice(split + 1);
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
      });
      await api(
        '/admin/media',
        {
          method: 'POST',
          token,
          body: {
            section: f.get('section'),
            entityType,
            entityId,
            title: f.get('title'),
            altText: f.get('altText'),
            author: f.get('author'),
            sourceUrl: f.get('sourceUrl'),
            licenseName: f.get('licenseName'),
            licenseUrl: f.get('licenseUrl'),
            rightsNote: f.get('rightsNote'),
            localityConfirmed: f.get('localityConfirmed') === 'on',
            rightsConfirmed: f.get('rightsConfirmed') === 'on',
            mimeType: file.type,
            imageData
          }
        }
      );
      setModal(null);
      notify(user?.role === 'Administrador Geral'
        ? 'Foto adicionada ao acervo público.'
        : 'Foto salva como rascunho para revisão.');
      await loadAdmin();
      await loadPublic();
    } catch (e) { notify(e.message); }
  };
  const saveUser = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api('/admin/users', { method: 'POST', token, body: { name: f.get('name'), email: f.get('email'), password: f.get('password'), role: f.get('role') } });
      setModal(null);
      notify('Conta de servidor criada com sucesso.');
      loadAdmin();
    } catch (e) { notify(e.message); }
  };
  return {
    saveEvent,
    savePlace,
    saveMedia,
    saveUser,
    changeStatus: statusAction('events', 'Evento publicado na agenda.', 'Status do evento atualizado.'),
    changeMediaStatus: statusAction('media', 'Foto publicada no acervo.', 'Status da foto atualizado.'),
    changePlaceStatus: statusAction('tourism', 'Ponto turístico publicado.', 'Status do local atualizado.')
  };
}
