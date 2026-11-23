import { Home } from 'lucide-react';
import { UserForm } from './Accounts.jsx';
import { adminActions } from './actions.js';
import { AdminPage } from './AdminPage.jsx';
import { LoginPage } from './Login.jsx';
import { EventForm } from '../events/EventForm.jsx';
import { MediaForm } from '../media/MediaForm.jsx';
import { SocialAdmin } from '../social/editor/SocialAdmin.jsx';
import { ThemePicker } from '../social/ThemePicker.jsx';
import { PlaceForm } from '../tourism/PlaceForm.jsx';
import { BrandMark } from '../../shared/Brand.jsx';
import { Modal } from '../../shared/Modal.jsx';

export default function AdminWorkspace({ data, session, modal, setModal, notify, onExit }) {
  const { events, adminEvents, adminPlaces, adminMedia, sports, news, overview, googlePhotosEnabled, loadPublic, loadAdmin } = data;
  const { user, token, login, logout } = session;
  const selectedAdminEvent = modal?.type === 'edit-event' ? adminEvents.find(e => e.id === modal.id) : null;
  const selectedAdminPlace = modal?.type === 'edit-place' ? adminPlaces.find(p => p.id === modal.id) : null;
  const { saveEvent, savePlace, saveMedia, saveUser, changeStatus, changeMediaStatus, changePlaceStatus } = adminActions({ token, user, modal, setModal, notify, selectedAdminEvent, loadAdmin, loadPublic });
  const placeForm = () => <PlaceForm
    key={modal.id || 'new'}
    event={selectedAdminPlace}
    token={token}
    onSubmit={savePlace}
    googlePhotosEnabled={googlePhotosEnabled}
  />;
  const dialogs = {
    'new-event': () => <EventForm onSubmit={saveEvent} />,
    'edit-event': () => selectedAdminEvent && <EventForm event={selectedAdminEvent} onSubmit={saveEvent} />,
    'new-place': placeForm,
    'edit-place': placeForm,
    'new-user': () => <UserForm onSubmit={saveUser} />,
    'new-media': () => <MediaForm
      places={adminPlaces}
      events={adminEvents}
      news={news}
      competitions={sports.competitions}
      onSubmit={saveMedia}
      isAdmin={user?.role === 'Administrador Geral'}
    />
  };
  const dialog = dialogs[modal?.type]?.();

  return <>
    {user?.role !== 'Parceiro autorizado' && <header className="topbar">
      <button className="brand" onClick={onExit}>
        <BrandMark />
        <span><b>SECELT</b><small>Conecta</small></span>
      </button>
      <div className="top-right">
        <ThemePicker compact />
        <button className="admin-entry" onClick={onExit}><Home size={15} /> Ver site</button>
      </div>
    </header>}
    {user
      ? (user.role === 'Parceiro autorizado'
        ? <SocialAdmin
          token={token}
          user={user}
          events={events}
          notify={notify}
          onPublicChange={loadPublic}
          onExit={onExit}
          onLogout={logout}
        />
        : <AdminPage
          renderSocial={section => <SocialAdmin
            embedded
            section={section}
            token={token}
            user={user}
            events={events}
            notify={notify}
            onPublicChange={loadPublic}
          />}
          token={token}
          user={user}
          overview={overview}
          events={adminEvents}
          places={adminPlaces}
          media={adminMedia}
          competitions={sports.competitions}
          onCreate={() => setModal({ type: 'new-event' })}
          onCreatePlace={() => setModal({ type: 'new-place' })}
          onCreateMedia={() => setModal({ type: 'new-media' })}
          onMediaStatus={changeMediaStatus}
          onCreateUser={() => setModal({ type: 'new-user' })}
          onEdit={id => setModal({ type: 'edit-event', id })}
          onEditPlace={id => setModal({ type: 'edit-place', id })}
          onStatus={changeStatus}
          onPlaceStatus={changePlaceStatus}
          onLogout={logout}
          onRefresh={() => loadAdmin()}
        />)
      : <LoginPage onSubmit={login} />}
    {dialog && <Modal onClose={() => setModal(null)}>{dialog}</Modal>}
  </>;
}
