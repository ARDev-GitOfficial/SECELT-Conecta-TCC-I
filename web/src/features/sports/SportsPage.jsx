import { fmtDate } from '../../shared/dates.js';

export function SportsPage({ sports, competition, setCompetition }) {
  const comp = sports.competitions.find(c => c.id === competition);
  const teams = sports.teams.filter(t => t.competitionId === competition);
  const matches = sports.matches.filter(m => m.competition === comp?.name);
  const activeMatches = matches.filter(m => m.status === 'Encerrada');
  const standings = teams.map(t => ({
    ...t,
    wins: activeMatches.filter(m => (m.homeTeam === t.name && m.homeScore > m.awayScore) || (m.awayTeam === t.name && m.awayScore > m.homeScore)).length
  }));
  const nextMatch = matches.find(match => match.status === 'Agendada');
  const cover = comp?.photos?.[0];
  return <>
    <div className="page-banner sports-banner">
      <div className="sports-banner-copy">
        <span className="eyebrow">COMPETIÇÕES</span>
        <h1>Resultados<br /><em>e equipes.</em></h1>
        <p>Classificação, partidas e elencos cadastrados.</p>
      </div>
      <div className="sports-banner-photo">
        <img
          src={cover?.fileUrl || '/assets/tourism-river.jpg'}
          alt={cover?.altText || 'Rio Guamá em São Miguel do Guamá'}
        />
        <small className="photo-credit">
          {cover
            ? <>
              <a href={cover.sourceUrl || '#'} target="_blank" rel="noreferrer">Foto: {cover.author}</a> · <a href={cover.licenseUrl || '#'} target="_blank" rel="noreferrer">{cover.licenseName}</a>
            </>
            : <>
              <a
                href="https://commons.wikimedia.org/wiki/File:P%C3%B4r_do_Sol_em_S%C3%A3o_Miguel_do_Guama_-_panoramio.jpg"
                target="_blank"
                rel="noreferrer"
              >Rio Guamá · Guilherme J. Corrêa</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>
            </>}
        </small>
      </div>
    </div>
    <section className="section-wrap content-section">
      <div className="tabs">
        {sports.competitions.map(c => <button key={c.id} className={competition === c.id ? 'selected' : ''} onClick={() => setCompetition(c.id)}>
          {c.name}
        </button>)}
      </div>
      <div className="sport-layout">
        <article className="panel standings">
          <div className="panel-head">
            <div><span className="eyebrow muted">EDIÇÃO {comp?.edition}</span><h2>Tabela de classificação</h2></div>
            <span className="live-tag">● {comp?.status?.toUpperCase()}</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>CLUBE</th><th>P</th><th>V</th><th>SG</th></tr></thead>
              <tbody>
                {standings.map((t, i) => <tr key={t.id}>
                  <td><span className="rank">0{i + 1}</span><b>{t.name}</b></td>
                  <td>{t.points}</td>
                  <td>{t.wins}</td>
                  <td>{t.goalDifference > 0 ? '+' : ''}{t.goalDifference}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <small className="sport-note">P pontos · V vitórias · SG saldo de gols</small>
        </article>
        <article className="panel next-panel">
          <span className="eyebrow muted">PRÓXIMO CONFRONTO</span>
          {nextMatch ? <MatchFeature match={nextMatch} /> : <p>Não há partidas futuras cadastradas.</p>}
        </article>
      </div>
      <div className="section-heading subheading"><div><h2>Últimos resultados</h2></div></div>
      <div className="results">
        {activeMatches.map(m => <div className="result-row" key={m.id}>
          <span>
            {fmtDate(m.startsAt, { day: '2-digit', month: 'short' }).toUpperCase()} · {new Date(m.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <b>{m.homeTeam}</b>
          <strong>{m.homeScore} — {m.awayScore}</strong>
          <b>{m.awayTeam}</b>
          <span className="final-tag">ENCERRADO</span>
        </div>)}
      </div>
      <div className="sport-note">Temporada {comp?.edition} · {comp?.name}</div>
      <h3 className="roster-title">Elenco em destaque</h3>
      <div className="roster-grid">
        {sports.members.filter(m => m.teamId === teams[0]?.id).map(m => <article className="roster-card" key={m.id}>
          <span>{m.shirtNumber ?? 'SEC'}</span>
          <b>{m.name}</b>
          <small>{m.role}</small>
        </article>)}
      </div>
    </section>
  </>;
}
function MatchFeature({ match }) {
  return <>
    <div className="versus">
      <div><span className="team-badge">{match.homeTeam[0]}</span><b>{match.homeTeam}</b></div>
      <span>VS</span>
      <div><span className="team-badge alt">{match.awayTeam[0]}</span><b>{match.awayTeam}</b></div>
    </div>
    <div className="match-date">SEMIFINAL · {fmtDate(match.startsAt).toUpperCase()} · {new Date(match.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </div>
    <div className="match-place">{match.location}</div>
  </>;
}
