import { CalendarDays, Image as ImageIcon, LayoutDashboard, LogOut, MapPin, Newspaper, Plus, QrCode, RefreshCw, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '../../shared/Brand.jsx';
import { Button } from '../../shared/Button.jsx';
import { dayKey } from '../../shared/dates.js';
import { CalendarMonth } from '../events/CalendarMonth.jsx';
import { MediaAdmin } from '../media/MediaAdmin.jsx';
import { TourismAdmin } from '../tourism/TourismAdmin.jsx';
import { UserAdmin } from './Accounts.jsx';
import { AdminTable, RegistrationAdmin } from './EventManagement.jsx';
import { SportsAdmin, TeamAdmin } from './SportsManagement.jsx';
import { AdminOverview } from './AdminOverview.jsx';

export function AdminPage({
  token,
  user,
  overview,
  events,
  places,
  media,
  competitions,
  onCreate,
  onCreatePlace,
  onCreateMedia,
  onMediaStatus,
  onCreateUser,
  onEdit,
  onEditPlace,
  onStatus,
  onPlaceStatus,
  onLogout,
  onRefresh,
  renderSocial
}) {
  const isAdmin = user.role === 'Administrador Geral';
  const [tab, setTab] = useState('Publicações'),
    [filter, setFilter] = useState('Todos'),
    [selectedDate, setSelectedDate] = useState(''),
    [month, setMonth] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  const filtered = events.filter(e => (filter === 'Todos' || e.status === filter) && (!selectedDate || dayKey(e.startsAt) === selectedDate));
  const monthMove = direction => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
    setSelectedDate('');
  };
  const socialTab = () => renderSocial?.(tab);
  const tabs = [
    ['Publicações', Newspaper, socialTab],
    ['Stories', ImageIcon, socialTab],
    ['Páginas', Users, socialTab],
    ...(isAdmin ? [['Moderação', ShieldCheck, socialTab]] : []),
    [
      'Resumo',
      LayoutDashboard,
      () => <AdminOverview
        {...{ user, events, places, overview, isAdmin, onCreate, onCreatePlace, onEdit, onStatus }}
        openEvents={() => setTab('Eventos')}
      />
    ],
    [
      'Eventos',
      CalendarDays,
      () => <>
        <div className="welcome-row">
          <div>
            <h2>Agenda e calendário</h2>
            <p>Selecione uma data para filtrar os registros e editar o calendário.</p>
          </div>
          <Button onClick={onCreate}><Plus size={15} /> Novo evento</Button>
        </div>
        <div className="admin-calendar">
          <div className="admin-calendar-head">
            <div>
              <b>Calendário de gestão</b>
              <small>
                {selectedDate
                  ? 'Filtrado por ' + new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(selectedDate + 'T12:00:00'))
                  : 'Toque em uma data para filtrar a tabela'}
              </small>
            </div>
            {selectedDate && <button className="text-link" onClick={() => setSelectedDate('')}>Limpar data</button>}
          </div>
          <CalendarMonth
            events={events}
            month={month}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onMonth={monthMove}
          />
        </div>
        <div className="table-toolbar">
          <div className="filter-chips">
            {['Todos', 'Rascunho', 'Aguardando Aprovação', 'Publicado', 'Reprovado', 'Encerrado', 'Cancelado'].map(s => <button className={filter === s ? 'selected' : ''} key={s} onClick={() => setFilter(s)}>{s}</button>)}
          </div>
        </div>
        <AdminTable events={filtered} onStatus={onStatus} onEdit={onEdit} isAdmin={isAdmin} />
      </>
    ],
    [
      'Turismo',
      MapPin,
      () => <TourismAdmin
        places={places}
        isAdmin={isAdmin}
        onCreate={onCreatePlace}
        onEdit={onEditPlace}
        onStatus={onPlaceStatus}
      />
    ],
    ['Esporte', Trophy, () => <SportsAdmin competitions={competitions} />],
    [
      'Acervo',
      ImageIcon,
      () => <MediaAdmin
        media={media}
        isAdmin={isAdmin}
        token={token}
        onCreate={onCreateMedia}
        onStatus={onMediaStatus}
      />
    ],
    ['Equipe', Users, () => <TeamAdmin token={token} />],
    ...(isAdmin
      ? [
        ['Inscrições', QrCode, () => <RegistrationAdmin events={events} token={token} />],
        ['Servidores', Users, () => <UserAdmin token={token} onCreate={onCreateUser} />]
      ]
      : [])
  ];
  const activeTab = tabs.find(([name]) => name === tab) || tabs[0];
  const renderSection = activeTab[2];
  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <div className="admin-logo"><BrandMark /><span><b>SECELT</b><small>PAINEL DE GESTÃO</small></span></div>
      <small className="side-label">GESTÃO DE CONTEÚDO</small>
      {tabs.map(([name, I]) => <button
        key={name}
        className={'side-link ' + (tab === name ? 'chosen' : '')}
        onClick={() => setTab(name)}
      >
        <I size={16} />
        {name}
        {name === 'Eventos' && <i>{events.length}</i>}
      </button>)}
      <div className="sidebar-bottom">
        <span className="avatar">{user.name.split(' ').map(s => s[0]).slice(0, 2).join('')}</span>
        <span><b>{user.name}</b><small>{user.role}</small></span>
        <button title="Sair" onClick={onLogout}><LogOut size={15} /></button>
      </div>
    </aside>
    <section className="admin-main">
      <header className="admin-top">
        <div>
          <span className="eyebrow muted">ADMINISTRAÇÃO</span>
          <h1>{tab === 'Resumo' ? 'Visão geral' : tab}</h1>
        </div>
        <button className="admin-profile" onClick={onRefresh}>
          <span className="avatar">{user.name.split(' ').map(s => s[0]).slice(0, 2).join('')}</span>
          {user.name}
          <RefreshCw size={13} />
        </button>
      </header>
      <nav className="sg-admin-mobile-tabs" aria-label="Gestão">
        {tabs.map(([name, Icon]) => <button
          key={name}
          className={tab === name ? 'active' : ''}
          aria-pressed={tab === name}
          onClick={() => setTab(name)}
        >
          <Icon size={15} />
          {name}
        </button>)}
        <button onClick={onLogout}><LogOut size={15} /> Sair do painel</button>
      </nav>
      {renderSection()}
    </section>
  </div>;
}
