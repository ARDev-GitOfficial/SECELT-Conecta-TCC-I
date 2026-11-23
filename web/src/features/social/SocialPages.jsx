import { ArrowLeft, ChevronRight, Image as ImageIcon, UserRound } from 'lucide-react';
import { Explore } from './Explore.jsx';
import { PostCard } from './PostCard.jsx';
import { CitizenProfile, PageProfile } from './Profiles.jsx';
import { Avatar, EmptyState } from './ui.jsx';

export function ExplorePage({ social, catalog, navigate }) {
  return <Explore
    pages={social.feed.data.pages}
    posts={social.feed.ranked}
    events={catalog.events}
    places={catalog.places}
    navigate={navigate}
    state={social.state}
    toggle={social.toggle}
  />;
}

export function ProfilePage({ social, navigate, onAdmin }) {
  return <CitizenProfile
    posts={social.feed.data.items}
    pages={social.feed.data.pages}
    navigate={navigate}
    state={social.state}
    setState={social.setState}
    requireCitizen={social.requireCitizen}
    cardProps={social.cardProps}
    onAdmin={onAdmin}
  />;
}

export function PublisherPage({ route, social, navigate }) {
  const { feed, state, toggle, showStories, cardProps } = social;
  const { data, ranked, loading } = feed;
  const page = data.pages.find(item => item.id === route.id);
  if (!page) {
    return !loading && <EmptyState
      icon={UserRound}
      title="Página não encontrada."
      action={<button className="sg-primary" onClick={() => navigate('explore')}>Explorar páginas</button>}
    />;
  }

  const posts = ranked.filter(post => post.publisherId === page.id);
  const stories = data.stories.filter(story => story.publisherId === page.id);
  const cover = data.items.find(post => post.publisherId === page.id && post.media.length)?.media[0];

  return <>
    <PageProfile page={page} posts={posts} cover={cover} state={state} toggle={toggle} />
    {stories.length > 0 && <button className="sg-page-stories sg-glass" onClick={() => showStories(stories, 0)}>
      <Avatar name={page.name} page={page} />
      <span><b>Stories da página</b><small>Veja os registros e novidades</small></span>
      <ChevronRight size={18} />
    </button>}
    <div className="sg-section-label"><ImageIcon size={16} /> PUBLICAÇÕES <span>{posts.length}</span></div>
    {posts.length
      ? posts.map(post => <PostCard key={post.id} post={post} {...cardProps} />)
      : <EmptyState icon={ImageIcon} title="As próximas histórias começam aqui.">Esta página ainda não tem publicações.</EmptyState>}
  </>;
}

export function PostPage({ route, social, navigate }) {
  const { feed, state, cardProps } = social;
  const post = feed.data.items.find(item => item.id === route.id && !state.hiddenPosts.includes(item.id));

  return <>
    <button className="sg-back" onClick={() => navigate('feed')}><ArrowLeft size={18} /> Voltar ao feed</button>
    {post
      ? <PostCard key={post.id} post={post} expanded {...cardProps} />
      : !feed.loading && <EmptyState
        icon={ImageIcon}
        title="Esta publicação não está disponível."
        action={<button className="sg-primary" onClick={() => navigate('feed')}>Ir para o feed</button>}
      >Ela pode ter sido retirada pela página responsável.</EmptyState>}
  </>;
}
