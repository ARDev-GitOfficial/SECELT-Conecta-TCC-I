import { db } from '../db/connection.js';
import { requireUser } from '../auth/session.js';
import { send } from '../http.js';
import { attachPhotos } from '../catalog.js';

export async function sportsRoutes({ req, res, pathname, method }) {
  if (pathname === '/api/sports' && method === 'GET') {
    const competitions = db.prepare(`SELECT id,name,sport,edition,status FROM competitions ORDER BY edition DESC,CASE name WHEN 'Campeonato Municipal' THEN 0 WHEN 'Jogos Guamaenses' THEN 1 WHEN 'Jogos Escolares' THEN 2 ELSE 3 END,name`).all();
    const teams = db.prepare(`SELECT t.id,t.name,t.coach,t.competition_id competitionId,COALESCE(SUM(CASE WHEN x.home_team=t.id AND x.home_score>x.away_score OR x.away_team=t.id AND x.away_score>x.home_score THEN 3 WHEN x.home_score=x.away_score THEN 1 ELSE 0 END),0) points,COALESCE(SUM(CASE WHEN x.home_team=t.id THEN x.home_score-x.away_score WHEN x.away_team=t.id THEN x.away_score-x.home_score ELSE 0 END),0) goalDifference FROM teams t LEFT JOIN matches x ON (x.home_team=t.id OR x.away_team=t.id) AND x.status='Encerrada' GROUP BY t.id ORDER BY points DESC,goalDifference DESC`).all();
    const matches = db.prepare(`SELECT m.id,m.starts_at startsAt,m.location,m.status,m.home_score homeScore,m.away_score awayScore,h.name homeTeam,a.name awayTeam,c.name competition FROM matches m JOIN teams h ON h.id=m.home_team JOIN teams a ON a.id=m.away_team JOIN competitions c ON c.id=m.competition_id ORDER BY m.starts_at DESC`).all();
    const members = db.prepare('SELECT id,name,role,shirt_number shirtNumber,team_id teamId FROM team_members ORDER BY team_id,name').all();
    return send(res, 200, { competitions: attachPhotos(competitions, 'Esporte', 'competition'), teams, matches, members });
  }
  if (pathname === '/api/admin/competitions' && method === 'GET') {
    if (!requireUser(req, res)) return;
    return send(res, 200, { items: db.prepare('SELECT * FROM competitions ORDER BY edition DESC').all() });
  }
  if (pathname === '/api/admin/teams' && method === 'GET') {
    if (!requireUser(req, res)) return;
    return send(
      res,
      200,
      {
        items: db.prepare('SELECT t.*,c.name competition FROM teams t JOIN competitions c ON c.id=t.competition_id ORDER BY c.name,t.name').all()
      }
    );
  }
  return send(res, 404, { error: 'Rota não encontrada.' });
}
