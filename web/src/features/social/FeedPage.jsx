import { ArrowRight, Check, Compass, Plus, RefreshCw, Waves } from 'lucide-react';
import { routeHash } from '../../app/routes.js';
import { MunicipalHighlights } from './MunicipalNews.jsx';
import { PostCard } from './PostCard.jsx';
import { Avatar, EmptyState } from './ui.jsx';

const topics = ['Para você', 'Seguindo', 'Cultura', 'Esporte', 'Turismo', 'Lazer'];

export function FeedPage({ social, navigate }) {
  const { feed, state, requireCitizen, topic, setTopic, showStories, cardProps } = social;
  const { data, ranked, municipal, error, loading, load } = feed;
  const posts = ranked.filter(post => {
    if (topic === 'Para você') return true;
    if (topic === 'Seguindo') return state.active && state.followed.includes(post.publisherId);
    return post.category === topic;
  });
  const storyGroups = data.pages.map(page => ({
    page,
    items: data.stories.filter(story => story.publisherId === page.id)
  })).filter(group => group.items.length);

  return <>
    {topic === 'Para você' && <MunicipalHighlights items={municipal.slice(0, 3)} title="Destaques da Prefeitura" />}
    <div className="municipal-section-title">
      <h2>Feed da cidade</h2>
      <button className="sg-icon-button" aria-label="Atualizar feed" onClick={load} disabled={loading}>
        <RefreshCw size={18} />
      </button>
    </div>
    {storyGroups.length > 0 && <section className="sg-stories sg-glass" aria-label="Stories das páginas">
      <div className="sg-stories-heading"><b>O que acontece por aqui</b><span>STORIES</span></div>
      <div className="sg-story-list">
        {storyGroups.map(({ page, items }) => {
          const seen = items.every(s => state.seenStories.includes(s.id));
          return <button
            key={page.id}
            className={`sg-story-entry ${seen ? 'seen' : ''}`}
            onClick={() => showStories(data.stories, data.stories.findIndex(story => story.id === items[0].id))}
          >
            <span className="sg-story-ring"><Avatar name={page.name} page={page} size="story" /></span>
            <span>{page.id === 'secelt' ? 'SECELT' : page.name}</span>
          </button>;
        })}
        <a className="sg-story-explore" href={routeHash({ page: 'explore' })}>
          <span><Plus size={25} /></span>
          <b>Descobrir</b>
        </a>
      </div>
    </section>}
    <div className="sg-feed-filters" role="group" aria-label="Filtrar publicações">
      {topics.map(t => <button
        key={t}
        aria-pressed={topic === t}
        className={topic === t ? 'active' : ''}
        onClick={() => { if (t === 'Seguindo') requireCitizen(() => setTopic(t)); else setTopic(t); }}
      >
        {t === 'Para você' && <Waves size={16} />} {t}
      </button>)}
    </div>
    {loading && !data.items.length
      ? <FeedSkeleton />
      : posts.length
        ? posts.map(post => <PostCard key={post.id} post={post} {...cardProps} />)
        : !error && <EmptyState
          icon={Compass}
          title={topic === 'Seguindo' ? 'Seu feed começa com uma conexão.' : 'Novas histórias estão a caminho.'}
          action={<button className="sg-primary" onClick={() => navigate({ page: 'explore' })}>Descobrir páginas <ArrowRight size={16} />
          </button>}
        >
          {topic === 'Seguindo'
            ? 'Siga as páginas que você quer acompanhar.'
            : 'Explore outros assuntos e conheça as páginas da cidade.'}
        </EmptyState>}
    {posts.length > 0 && <div className="sg-feed-end">
      <span><Check size={22} /></span>
      <b>Você está por dentro.</b>
      <p>Novos encontros e histórias chegam por aqui.</p>
      <button className="sg-text-button" onClick={load}>Atualizar publicações</button>
    </div>}
  </>;
}

function FeedSkeleton() {
  return <div className="sg-skeleton sg-glass" role="status" aria-label="Carregando publicações">
    <div />
    <span />
    <span />
    <div className="photo" />
    <span />
  </div>;
}
