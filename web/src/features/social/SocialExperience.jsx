import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useCommunity } from './community.jsx';
import { MobileNavigation } from './MobileNavigation.jsx';
import { MunicipalBanner, MunicipalHighlights } from './MunicipalNews.jsx';
import { SocialHeader, SocialRail, SocialSidebar } from './SocialChrome.jsx';
import { SocialOverlay, useSocialOverlay } from './SocialOverlay.jsx';
import { useSocialFeed } from './useSocialFeed.js';

export function SocialExperience({ screen, route, navigate, catalog, onAdmin, notify, search, setSearch, onRegister }) {
  const community = useCommunity();
  const { state, storageError, requireCitizen, toggle } = community;
  const [topic, setTopic] = useState('Para você');
  const feed = useSocialFeed(state, !screen.standalone);
  const { overlay, close, showStories, cardProps } = useSocialOverlay({ route, navigate, notify, community });
  const { Component, back, topics, banner, wide, standalone } = screen;
  const social = { ...community, feed, topic, setTopic, showStories, cardProps };
  const content = <Component
    route={route}
    navigate={navigate}
    catalog={catalog}
    social={social}
    onAdmin={onAdmin}
    search={search}
    setSearch={setSearch}
    onRegister={onRegister}
  />;

  return <>
    <SocialHeader state={state} requireCitizen={requireCitizen} navigate={navigate} />
    {banner && <MunicipalBanner />}
    <div className={`sg-layout${wide ? ' wide' : ''}`}>
      <SocialSidebar route={route} navigate={navigate} onAdmin={onAdmin} />
      <main id="conteudo" className="sg-main" tabIndex={-1}>
        {!standalone && storageError && <p className="sg-notice" role="status">Não foi possível salvar suas preferências neste navegador.</p>}
        {!standalone && feed.error && <div className="sg-error sg-glass" role="alert">
          <p>{feed.error}</p>
          <button className="sg-primary" onClick={feed.load}>Tentar novamente</button>
        </div>}
        {back ? <CatalogFrame back={back} topics={topics} municipal={feed.municipal} navigate={navigate}>{content}</CatalogFrame> : content}
      </main>
      {!wide && <SocialRail events={catalog.events} pages={feed.data.pages} state={state} toggle={toggle} />}
    </div>
    <MobileNavigation route={route} navigate={navigate} theme={state.theme} />
    <SocialOverlay overlay={overlay} onClose={close} onReport={cardProps.onReport} navigate={navigate} notify={notify} />
  </>;
}

function CatalogFrame({ back, topics, municipal, navigate, children }) {
  return <div className="sg-legacy">
    <div className="sg-legacy-toolbar">
      <button className="sg-back" onClick={() => navigate(back.page)}><ArrowLeft size={17} /> {back.label}</button>
    </div>
    {topics && <MunicipalHighlights title="Notícias da Prefeitura" items={municipal.filter(post => topics.includes(post.category))} />}
    {children}
  </div>;
}
