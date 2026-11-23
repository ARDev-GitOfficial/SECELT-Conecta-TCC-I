import { lazy, Suspense, useEffect, useState } from 'react';
import { usePageEffects } from '../effects/usePageEffects.js';
import { LoginForm } from '../features/admin/Login.jsx';
import { Ticket } from '../features/events/EventDetails.jsx';
import { SocialProvider } from '../features/social/community.jsx';
import { SocialExperience } from '../features/social/SocialExperience.jsx';
import { api } from '../shared/api.js';
import { Modal } from '../shared/Modal.jsx';
import { AppBoundary } from './AppBoundary.jsx';
import { useSocialRoute } from './navigation.js';
import { portalScreens } from './portalScreens.jsx';
import { routeHash } from './routes.js';
import { usePortalData } from './usePortalData.js';
import { useSession } from './useSession.js';
import { useToast } from './useToast.js';

const readOnly = import.meta.env.VITE_SECELT_READ_ONLY === 'true';
const AdminWorkspace = readOnly ? null : lazy(() => import('../features/admin/AdminWorkspace.jsx'));

export function Application() {
  return <SocialProvider><AppBoundary><App /></AppBoundary></SocialProvider>;
}

function App() {
  const [requestedRoute, navigate] = useSocialRoute();
  const redirectAdmin = readOnly && requestedRoute.page === 'admin';
  const route = redirectAdmin ? { page: 'feed' } : requestedRoute;
  const isAdmin = !readOnly && route.page === 'admin';
  const screen = portalScreens[route.page] ?? portalScreens.feed;
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, notify] = useToast();
  const session = useSession({ navigate, notify, setModal, enabled: !readOnly });
  const { token, user, clearSession, login } = session;
  const data = usePortalData({ token, user, clearSession, notify, publicEnabled: !screen.standalone });
  const { loadAdmin, loadPublic } = data;

  usePageEffects(route.page, data);
  useEffect(() => {
    if (redirectAdmin) location.replace(routeHash({ page: 'feed' }));
  }, [redirectAdmin]);
  useEffect(() => {
    if (isAdmin) loadAdmin();
  }, [isAdmin, loadAdmin]);
  useEffect(() => {
    const title = isAdmin ? 'Publicações' : screen.title;
    document.title = title ? `${title} · SECELT Conecta` : 'SECELT Conecta';
  }, [isAdmin, screen.title]);

  const openAdmin = () => token ? navigate('admin') : setModal({ type: 'login' });
  const registerForEvent = async (event, name, email) => {
    try {
      const result = await api(`/events?id=${event.id}`, { method: 'POST', body: { name, email } });
      setModal({ type: 'ticket', qr: result.qrCode, event });
      loadPublic();
    } catch (error) {
      notify(error.message);
    }
  };

  return <div className={isAdmin ? 'shell' : 'shell social-shell'}>
    {isAdmin
      ? <Suspense fallback={<p role="status">Carregando painel…</p>}>
        <AdminWorkspace data={data} session={session} modal={modal} setModal={setModal} notify={notify} onExit={() => navigate('feed')} />
      </Suspense>
      : <SocialExperience
        screen={screen}
        route={route}
        navigate={navigate}
        catalog={data}
        onAdmin={readOnly ? undefined : openAdmin}
        onRegister={readOnly ? undefined : registerForEvent}
        notify={notify}
        search={search}
        setSearch={setSearch}
      />}
    {!readOnly && modal?.type === 'login' && <Modal onClose={() => setModal(null)}><LoginForm onSubmit={login} /></Modal>}
    {!readOnly && modal?.type === 'ticket' && <Modal onClose={() => setModal(null)}><Ticket event={modal.event} qr={modal.qr} /></Modal>}
    {toast && <div role="status" className="toast show">{toast}</div>}
  </div>;
}
