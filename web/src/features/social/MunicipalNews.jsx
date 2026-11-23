import { ArrowUpRight } from 'lucide-react';
import { routeHash } from '../../app/routes.js';
import { dateLabel } from './dateLabel.js';

export function MunicipalHighlights({ items, title }) {
  if (!items.length) return null;
  return <section className="municipal-news" aria-label={title}>
    <div className="municipal-section-title">
      <h2>{title}</h2>
      <a href="https://saomigueldoguama.pa.gov.br/c/noticias/" target="_blank" rel="noreferrer">Ver portal <ArrowUpRight size={14} />
      </a>
    </div>
    <div className="municipal-news-grid">
      {items.map(post => {
        const photo = post.media.find(m => m.id === 'mid-futsal-quadra') || post.media[0];
        return <a key={post.id} className="municipal-story" href={routeHash({ page: 'post', id: post.id })}>
          {photo && <img src={photo.fileUrl} alt={photo.altText} />}
          <div>
            <span>
              {post.category} <i /> <time dateTime={post.publishedAt}>
                {dateLabel(post.publishedAt)} de {new Date(post.publishedAt).getFullYear()}
              </time>
            </span>
            <h3>{post.title}</h3>
          </div>
        </a>;
      })}
    </div>
  </section>;
}

export function MunicipalBanner() {
  return <section className="municipal-banner" aria-label="SECELT Conecta em São Miguel do Guamá">
    <div className="municipal-banner-inner">
      <div>
        <span className="municipal-eyebrow">SECELT CONECTA</span>
        <h1>São Miguel do Guamá</h1>
        <p>Esporte, cultura, lazer e turismo</p>
      </div>
      <a
        href="https://saomigueldoguama.pa.gov.br/"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir o portal da Prefeitura de São Miguel do Guamá"
      >
        <img src="/assets/prefeitura-guama.png" alt="Prefeitura de São Miguel do Guamá" />
      </a>
    </div>
  </section>;
}
