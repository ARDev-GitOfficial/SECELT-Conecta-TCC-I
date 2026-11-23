import { CalendarDays, Compass, Download, Home, UserRound } from 'lucide-react';
import { routeHash } from '../../app/routes.js';

const NAV = [
  ['feed', 'Feed', Home],
  ['explore', 'Explorar', Compass],
  ['events', 'Agenda', CalendarDays],
  ['download', 'Baixar app', Download],
  ['profile', 'Perfil', UserRound]
];

const parentPages = { sports: 'explore', tourism: 'explore', event: 'events', publisher: 'feed', post: 'feed' };

export function NavItems({ route, navigate, mobile = false }) {
  const selected = parentPages[route.page] ?? route.page;
  return NAV.map(([page, label, Icon]) => <a
    key={page}
    href={routeHash({ page })}
    onClick={e => {
      e.preventDefault();
      navigate({ page });
    }}
    className={`sg-nav-link ${selected === page ? 'active' : ''}`}
    aria-current={selected === page ? 'page' : undefined}
  >
    <span><Icon size={mobile ? 21 : 22} aria-hidden="true" /></span>
    <b>{label}</b>
    {!mobile && selected === page && <i />}
  </a>);
}
