import { ExternalLink, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api.js';

function mapHref(point) {
  const params = new URLSearchParams({ api: '1', query: [point.name, point.address].filter(Boolean).join(', ') });
  if (point.placeId) params.set('query_place_id', point.placeId); else if (point.latitude && point.longitude) params.set('query', `${point.latitude},${point.longitude}`);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
export function TourismPage({ places, gallery = [], googlePhotosEnabled }) {
  const [googlePhotos, setGooglePhotos] = useState({});
  const [category, setCategory] = useState('Todos');
  const visiblePlaces = places.filter(place => category === 'Todos' || place.category === category);
  const visibleIds = new Set(visiblePlaces.map(place => place.id));
  useEffect(
    () => {
      if (!googlePhotosEnabled) return;
      let alive = true;
      Promise.all(places.filter(p => p.placeId).map(async p => {
        try {
          const result = await api('/tourism/' + p.id + '/visual');
          if (alive) setGooglePhotos(old => ({ ...old, [p.id]: result.photos || [] }));
        } catch { }
      }));
      return () => { alive = false; };
    },
    [places, googlePhotosEnabled]
  );
  const localPhotos = gallery.filter(photo => category === 'Todos' || (photo.entityType === 'tourist_point' && visibleIds.has(photo.entityId))).map(photo => ({ ...photo, imageSrc: photo.fileUrl, pointName: places.find(p => p.id === photo.entityId)?.name, google: false }));
  const livePhotos = visiblePlaces.flatMap(point => (googlePhotos[point.id] || []).map((photo, index) => ({
    ...photo,
    id: `google-${point.id}-${index}`,
    title: `${point.name} · Foto do Google Maps`,
    altText: point.name,
    imageSrc: '/api/tourism/' + point.id + '/photo?name=' + encodeURIComponent(photo.photoName),
    pointName: point.name,
    google: true
  })));
  const photos = [...localPhotos, ...livePhotos];
  return <>
    <div className="tour-intro">
      <div>
        <span className="eyebrow">ACERVO VISUAL</span>
        <h1>São Miguel<br /><em>em imagens.</em></h1>
        <p>Imagens locais com autoria, origem e caminhos para conhecer cada lugar.</p>
      </div>
      <div className="tour-count">
        <b>{String(photos.length).padStart(2, '0')}</b>
        <span>FOTOS<br />NO ACERVO</span>
      </div>
    </div>
    <div
      className="sg-feed-filters municipal-place-filters"
      role="group"
      aria-label="Filtrar lugares e fotos por categoria"
    >
      {['Todos', ...new Set(places.map(point => point.category))].map(label => <button
        key={label}
        aria-pressed={category === label}
        className={category === label ? 'active' : ''}
        onClick={() => setCategory(label)}
      >
        {label}
      </button>)}
    </div>
    <section className="section-wrap gallery-section">
      <div className="gallery-head">
        <span className="eyebrow muted">TURISMO, MEMÓRIA E CIDADE</span>
        <span>{String(photos.length).padStart(2, '0')} <i>·</i> FOTOS</span>
      </div>
      {photos.length
        ? <div className="masonry">
          {photos.map((photo, index) => <article className={'place-card place-' + (index % 6 + 1)} key={photo.id}>
            <div className="place-photo">
              <img src={photo.imageSrc} alt={photo.altText || photo.title} loading="lazy" />
              <span className="place-category">{photo.google ? 'GOOGLE MAPS' : 'ACERVO LOCAL'}</span>
            </div>
            <div className="place-copy">
              <span className="place-index">{String(index + 1).padStart(2, '0')} / FOTOGRAFIA</span>
              <h2 className="place-title">{photo.title}</h2>
              {photo.pointName && <p className="place-caption">{photo.pointName}</p>}
              <div className="place-card-foot">
                <small className="photo-credit">
                  {photo.google
                    ? <>
                      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Foto no Google Maps</a>
                      {photo.authorAttributions?.map(author => <span key={author.displayName}>
                        {author.uri
                          ? <a href={author.uri} target="_blank" rel="noreferrer"> · {author.displayName}</a>
                          : ` · ${author.displayName}`}
                      </span>)}
                    </>
                    : <>
                      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Foto: {photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.licenseName}</a>
                    </>}
                </small>
              </div>
            </div>
          </article>)}
        </div>
        : <p className="empty-state">Nenhuma foto publicada para esta seleção.</p>}
      <div className="tour-note">
        <MapPin size={18} />
        <span>As fotos são vinculadas a locais cadastrados e podem ser abertas no Maps.</span>
      </div>
    </section>
    <section className="section-wrap tourism-points">
      <div className="section-heading">
        <div><span className="eyebrow muted">LUGARES CADASTRADOS</span><h2>Explore os pontos da cidade</h2></div>
        <span className="index">{String(visiblePlaces.length).padStart(2, '0')} LOCAIS</span>
      </div>
      <div className="tourism-point-grid">
        {visiblePlaces.map(point => <article className="tourism-point-row" key={point.id}>
          <span className="tourism-point-icon"><MapPin size={17} /></span>
          <div>
            <span className="eyebrow muted">{point.category}</span>
            <h3>{point.name}</h3>
            <p>{point.description}</p>
            <small>{point.address || 'São Miguel do Guamá, PA'}</small>
          </div>
          <a className="map-link" href={mapHref(point)} target="_blank" rel="noreferrer">Abrir no Maps <ExternalLink size={13} />
          </a>
        </article>)}
      </div>
    </section>
  </>;
}
