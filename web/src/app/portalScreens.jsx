import { DownloadPage } from '../features/download/DownloadPage.jsx';
import { EventDetails } from '../features/events/EventDetails.jsx';
import { EventsPage } from '../features/events/EventsPage.jsx';
import { FeedPage } from '../features/social/FeedPage.jsx';
import { ExplorePage, PostPage, ProfilePage, PublisherPage } from '../features/social/SocialPages.jsx';
import { SportsPage } from '../features/sports/SportsPage.jsx';
import { TourismPage } from '../features/tourism/TourismPage.jsx';

const explore = { page: 'explore', label: 'Explorar' };
const events = { page: 'events', label: 'Agenda' };

export const portalScreens = {
  feed: { Component: FeedPage, banner: true },
  explore: { Component: ExplorePage },
  profile: { Component: ProfilePage },
  publisher: { Component: PublisherPage },
  post: { Component: PostPage },
  events: { Component: EventsScreen, back: explore, topics: ['Cultura'], wide: true },
  event: { Component: EventScreen, back: events },
  sports: { Component: SportsScreen, back: explore, topics: ['Esporte'], wide: true },
  tourism: { Component: TourismScreen, back: explore, topics: ['Lazer', 'Turismo'], wide: true },
  download: { Component: DownloadPage, title: 'Baixar aplicativo', wide: true, standalone: true }
};

function EventsScreen({ catalog, navigate, search, setSearch }) {
  return <EventsPage
    events={catalog.events}
    loading={catalog.loading}
    search={search}
    setSearch={setSearch}
    onOpen={id => navigate({ page: 'event', id })}
  />;
}

function EventScreen({ route, catalog, onRegister }) {
  const event = catalog.events.find(item => item.id === route.id);
  if (!event) return <p className="empty-state">{catalog.loading ? 'Carregando evento…' : 'Este evento não está disponível.'}</p>;
  return <EventDetails
    key={event.id}
    event={event}
    onRegister={onRegister && ((name, email) => onRegister(event, name, email))}
  />;
}

function SportsScreen({ catalog }) {
  return <SportsPage sports={catalog.sports} competition={catalog.competition} setCompetition={catalog.setCompetition} />;
}

function TourismScreen({ catalog }) {
  return <TourismPage places={catalog.places} gallery={catalog.tourismGallery} googlePhotosEnabled={catalog.googlePhotosEnabled} />;
}
