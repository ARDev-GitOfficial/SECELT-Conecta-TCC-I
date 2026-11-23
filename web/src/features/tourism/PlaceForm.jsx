import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../shared/api.js';

export function PlaceForm({ event, token, onSubmit, googlePhotosEnabled }) {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState([]),
    [searching, setSearching] = useState(false),
    [feedback, setFeedback] = useState('');
  const [placeId, setPlaceId] = useState(event?.placeId || '');
  const searchPlaces = async () => {
    setSearching(true);
    setFeedback('');
    try {
      const result = await api('/admin/maps/places?q=' + encodeURIComponent(query), { token });
      setResults(result.items);
      if (!result.items.length) setFeedback('Nenhum local encontrado.');
    } catch (e) { setFeedback(e.message); } finally { setSearching(false); }
  };
  return <div className="form-modal">
    <span className="eyebrow green-text">PONTOS TURÍSTICOS</span>
    <h2>{event ? 'Editar ponto turístico' : 'Cadastrar ponto turístico'}</h2>
    <p>O conteúdo começa como rascunho e passa pela fila de aprovação.</p>
    <div className="maps-place-search">
      <label>Associar fotos do Google Maps<input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Ex.: Balneário do Guamá"
        disabled={!googlePhotosEnabled}
      />
      </label>
      <button
        type="button"
        className="button outline"
        onClick={searchPlaces}
        disabled={!googlePhotosEnabled || searching || query.trim().length < 3}
      >
        {searching ? 'Buscando…' : 'Buscar local'}
      </button>
      {googlePhotosEnabled
        ? <small>Escolha um Place ID. Nome e endereço precisam ser conferidos e digitados abaixo.</small>
        : <small>Busca desligada no servidor. Ative Places API para associar fotos; as imagens locais seguem disponíveis.</small>}
      {feedback && <p className="search-feedback">{feedback}</p>}
      {results.map(result => <button
        type="button"
        className={'place-search-result ' + (placeId === result.placeId ? 'active' : '')}
        key={result.placeId}
        onClick={() => {
          setPlaceId(result.placeId);
          setFeedback('Local associado. Confira e digite manualmente o nome e o endereço abaixo.');
        }}
      >
        <b>{result.suggestion}</b>
        <span>{result.addressSuggestion}</span>
        <small>{placeId === result.placeId ? 'Associado' : 'Usar Place ID'}</small>
      </button>)}
    </div>
    <form className="event-form" onSubmit={onSubmit}>
      <input type="hidden" name="placeId" value={placeId} />
      <label>Nome do local<input name="name" defaultValue={event?.name || ''} required maxLength="140" /></label>
      <label>Descrição<textarea
        name="description"
        defaultValue={event?.description || ''}
        placeholder="O que a pessoa vai encontrar neste local"
      />
      </label>
      <label>Categoria<select name="category" defaultValue={event?.category || 'Lazer'}>
        <option>Balneário</option>
        <option>Praça</option>
        <option>Lazer</option>
        <option>Cultura</option>
        <option>Natureza</option>
        <option>História</option>
      </select>
      </label>
      <label>Endereço conferido<input
        name="address"
        defaultValue={event?.address || ''}
        placeholder="Informe um endereço ou referência"
        required
        maxLength="220"
      />
      </label>
      <div className="form-row">
        <label>Latitude<input name="latitude" type="number" step="any" defaultValue={event?.latitude ?? ''} /></label>
        <label>Longitude<input name="longitude" type="number" step="any" defaultValue={event?.longitude ?? ''} /></label>
      </div>
      <p className="form-help">Depois de salvar o local, adicione as fotos e os créditos na aba Acervo.</p>
      <div className="form-actions">
        <button
          type="button"
          className="button outline"
          onClick={() => document.dispatchEvent(new Event('close-dialog'))}
        >Cancelar</button>
        <button className="button blue" type="submit">
          {event ? 'Salvar rascunho' : 'Criar rascunho'} <ChevronRight size={15} />
        </button>
      </div>
    </form>
  </div>;
}
