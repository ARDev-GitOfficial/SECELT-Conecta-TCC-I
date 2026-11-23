import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

export function MediaForm({ places, events, news, competitions, onSubmit, isAdmin }) {
  const [section, setSection] = useState('Turismo'),
    [preview, setPreview] = useState(''),
    [fileName, setFileName] = useState('');
  const options = section === 'Turismo'
    ? [
      { value: 'municipality:sao-miguel-do-guama', label: 'Galeria geral de São Miguel do Guamá' },
      ...places.map(p => ({ value: `tourist_point:${p.id}`, label: `Ponto turístico · ${p.name}` }))
    ]
    : section === 'Esporte'
      ? [
        ...competitions.map(c => ({ value: `competition:${c.id}`, label: `Competição · ${c.name}` })),
        ...news.filter(n => n.category === 'Esporte').map(n => ({ value: `news:${n.id}`, label: `Notícia · ${n.title}` }))
      ]
      : [
        ...events.map(e => ({ value: `event:${e.id}`, label: `Evento · ${e.title}` })),
        ...news.filter(n => n.category !== 'Esporte').map(n => ({ value: `news:${n.id}`, label: `Publicação · ${n.title}` }))
      ];
  const [entityKey, setEntityKey] = useState('municipality:sao-miguel-do-guama');
  useEffect(() => { setEntityKey(options[0]?.value || ''); }, [section]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const onFile = e => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview('');
      setFileName('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      e.target.value = '';
      setPreview('');
      setFileName('');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  };
  return <div className="form-modal media-form-modal">
    <span className="eyebrow green-text">ACERVO DE IMAGENS</span>
    <h2>Adicionar foto local.</h2>
    <p>O acervo aceita imagens feitas em São Miguel do Guamá e com permissão de uso identificada.</p>
    <form className="event-form" onSubmit={onSubmit}>
      <div className="form-row">
        <label>Módulo<select name="section" value={section} onChange={e => setSection(e.target.value)}>
          <option>Turismo</option>
          <option>Esporte</option>
          <option>Eventos</option>
        </select>
        </label>
        <label>Vincular a<select name="entityKey" value={entityKey} onChange={e => setEntityKey(e.target.value)} required>
          {options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
        </label>
      </div>
      <label>Título da foto<input name="title" required maxLength="140" placeholder="Ex.: Rio Guamá ao entardecer" />
      </label>
      <label>Descrição para acessibilidade<input name="altText" required maxLength="220" placeholder="Descreva o que aparece na imagem" />
      </label>
      <label className="media-file-field">Arquivo da foto<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" required onChange={onFile} />
        <small>JPG, PNG ou WebP · até 8 MB</small>
      </label>
      {preview && <div className="media-upload-preview">
        <img src={preview} alt="Prévia da imagem selecionada" />
        <span>{fileName}</span>
      </div>}
      <div className="form-row">
        <label>Autoria<input name="author" required maxLength="140" placeholder="Nome do fotógrafo ou órgão" /></label>
        <label>Licença ou autorização<input
          name="licenseName"
          required
          maxLength="120"
          defaultValue="CC BY-SA 4.0"
          placeholder="CC BY-SA 4.0 ou Autorização SECELT"
        />
        </label>
      </div>
      <label>Página da origem<input name="sourceUrl" type="url" maxLength="500" placeholder="https://…" /></label>
      <label>Link da licença<input
        name="licenseUrl"
        type="url"
        maxLength="500"
        placeholder="Ex.: creativecommons.org/licenses/by-sa/4.0/"
      />
      </label>
      <label>Registro da permissão<input
        name="rightsNote"
        required
        maxLength="300"
        placeholder="Licença aberta ou autorização institucional registrada"
      />
      </label>
      <label className="checkbox-line">
        <input name="localityConfirmed" type="checkbox" required /> Confirmo que a fotografia foi feita em São Miguel do Guamá.</label>
      <label className="checkbox-line">
        <input name="rightsConfirmed" type="checkbox" required /> Confirmo que há permissão para usar esta imagem no app e no site.</label>
      <div className="form-actions">
        <button
          type="button"
          className="button outline"
          onClick={() => document.dispatchEvent(new Event('close-dialog'))}
        >Cancelar</button>
        <button className="button blue" type="submit">
          <Upload size={15} />
          {isAdmin ? 'Publicar foto' : 'Salvar para revisão'}
        </button>
      </div>
    </form>
  </div>;
}
