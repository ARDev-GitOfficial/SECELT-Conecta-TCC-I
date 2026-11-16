import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {extname,join,resolve,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';

const ROOT=dirnameFrom(import.meta.url), DATA=join(ROOT,'data');mkdirSync(DATA,{recursive:true});
const db=new DatabaseSync(join(DATA,'secelt.sqlite'));db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
function dirnameFrom(url){return resolve(fileURLToPath(new URL('.',url)))}
db.exec(`
CREATE TABLE IF NOT EXISTS profiles(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, profile_id INTEGER NOT NULL REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id), expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS approval_history(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),user_id INTEGER NOT NULL REFERENCES admin_users(id),from_status TEXT,to_status TEXT NOT NULL,note TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Cultura', starts_at TEXT NOT NULL, ends_at TEXT, location TEXT NOT NULL, age_range TEXT NOT NULL DEFAULT 'Livre', drink_rule TEXT NOT NULL DEFAULT 'Não informado', organizer_type TEXT NOT NULL DEFAULT 'Prefeitura', is_free INTEGER NOT NULL DEFAULT 1, capacity INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Rascunho', updated_at TEXT NOT NULL, created_by INTEGER REFERENCES admin_users(id));
CREATE TABLE IF NOT EXISTS citizens(id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS registrations(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), citizen_id TEXT NOT NULL REFERENCES citizens(id), qr_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, checkin_status TEXT NOT NULL DEFAULT 'Pendente', UNIQUE(event_id,citizen_id));
CREATE TABLE IF NOT EXISTS competitions(id TEXT PRIMARY KEY,name TEXT NOT NULL,sport TEXT NOT NULL,edition INTEGER NOT NULL,regulation_url TEXT,status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS teams(id TEXT PRIMARY KEY,name TEXT NOT NULL,competition_id TEXT NOT NULL REFERENCES competitions(id),coach TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS team_members(id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,shirt_number INTEGER,team_id TEXT NOT NULL REFERENCES teams(id));
CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY,competition_id TEXT NOT NULL REFERENCES competitions(id),home_team TEXT NOT NULL REFERENCES teams(id),away_team TEXT NOT NULL REFERENCES teams(id),home_score INTEGER,away_score INTEGER,starts_at TEXT NOT NULL,location TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Agendada');
CREATE TABLE IF NOT EXISTS tourist_points(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,address TEXT,latitude REAL,longitude REAL,image_url TEXT,status TEXT NOT NULL DEFAULT 'Publicado');
CREATE TABLE IF NOT EXISTS news(id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,category TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Publicado',updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_citizens_email ON citizens(lower(email));
`);
const touristColumns=new Set(db.prepare('PRAGMA table_info(tourist_points)').all().map(c=>c.name));
for(const [name,type] of [['place_id','TEXT'],['created_by','INTEGER'],['updated_at','TEXT']])if(!touristColumns.has(name))db.exec(`ALTER TABLE tourist_points ADD COLUMN ${name} ${type}`);
const mapsPhotosEnabled=process.env.GOOGLE_MAPS_PHOTOS_ENABLED==='true'&&!!process.env.GOOGLE_MAPS_API_KEY;
const now=new Date().toISOString();
db.prepare(`UPDATE tourist_points SET image_url=CASE WHEN name LIKE '%Praça%' OR name LIKE '%Mercado%' THEN '/assets/tourism-landmark.jpg' WHEN name LIKE '%Centro Histórico%' THEN '/assets/tourism-church-side.jpg' WHEN name LIKE '%Balneário%' OR name LIKE '%Orla%' OR name LIKE '%Igarapé%' THEN '/assets/tourism-river.jpg' ELSE '/assets/tourism-landmark.jpg' END WHERE image_url IS NULL OR image_url='' OR image_url='/assets/tourism-church.jpg'`).run();
db.prepare('UPDATE tourist_points SET updated_at=? WHERE updated_at IS NULL').run(now);
const count=db.prepare('SELECT count(*) n FROM events').get().n;
if(!count){
 for(const [name,desc] of [['Editor SECELT','Cria e envia conteúdo para revisão'],['Administrador Geral','Revisa, publica e gerencia o sistema']])db.prepare('INSERT OR IGNORE INTO profiles(name,description) VALUES(?,?)').run(name,desc);
 const hash=p=>scryptSync(p,'SECELT-DEMO-2026',64).toString('hex');
 db.prepare('INSERT OR IGNORE INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run('Marina Costa','admin@secelt.local',hash('Guama#2026'),2);
 db.prepare('INSERT OR IGNORE INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run('João Pedro','editor@secelt.local',hash('Editor#2026'),1);
 const addEvent=db.prepare('INSERT INTO events(id,title,description,category,starts_at,ends_at,location,age_range,drink_rule,organizer_type,is_free,capacity,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 addEvent.run('evt-festival','Festival de Cultura Guamaense','Música, dança e encontro da comunidade.','Cultura','2026-11-22T18:00:00-03:00','2026-11-22T23:00:00-03:00','Praça Matriz','Livre','Permitido conforme organização','Prefeitura',1,120,'Publicado',now);
 addEvent.run('evt-feira','Feira de Artesanato e Sabores','Artesanato e sabores de produtores locais.','Cultura','2026-11-28T16:00:00-03:00','2026-11-28T21:00:00-03:00','Orla Municipal','Livre','Não se aplica','SECELT',1,80,'Publicado',now);
 addEvent.run('evt-corrida','Corrida de Aniversário da Cidade','Percurso comemorativo pelas ruas de Guamá.','Esporte','2026-12-06T06:30:00-03:00',null,'Concentração na Praça Matriz','A partir de 14 anos','Não se aplica','Prefeitura',1,200,'Publicado',now);
 addEvent.run('evt-pending','Mostra de Dança Guamaense','Apresentações de grupos culturais locais.','Cultura','2026-12-12T19:00:00-03:00',null,'Centro Cultural','Livre','Conforme organização','Prefeitura',1,150,'Aguardando Aprovação',now);
 const addComp=db.prepare('INSERT INTO competitions VALUES(?,?,?,?,?,?)');addComp.run('cmp-municipal','Campeonato Municipal','Futebol',2026,'','Em andamento');addComp.run('cmp-guama','Jogos Guamaenses','Futebol',2026,'','Em andamento');addComp.run('cmp-school','Jogos Escolares','Futsal',2026,'','Planejada');
 const addTeam=db.prepare('INSERT INTO teams(id,name,competition_id,coach) VALUES(?,?,?,?)');[['team-g','Guamá FC','cmp-municipal','Carlos Silva'],['team-u','União do Jaderlândia','cmp-municipal','Paulo Sousa'],['team-a','Atlético Guamaense','cmp-municipal','Raimundo Lima'],['team-s','São Miguel','cmp-municipal','Marcos Pereira']].forEach(x=>addTeam.run(...x));
 const member=db.prepare('INSERT INTO team_members(id,name,role,shirt_number,team_id) VALUES(?,?,?,?,?)');[['m1','Lucas Oliveira','Atleta',9,'team-g'],['m2','Pedro Santos','Atleta',1,'team-g'],['m3','João Ribeiro','Comissão técnica',null,'team-g'],['m4','André Costa','Atleta',10,'team-u']].forEach(x=>member.run(...x));
 const match=db.prepare('INSERT INTO matches(id,competition_id,home_team,away_team,home_score,away_score,starts_at,location,status) VALUES(?,?,?,?,?,?,?,?,?)');match.run('mat1','cmp-municipal','team-g','team-u',2,1,'2026-11-16T19:00:00-03:00','Estádio Municipal','Encerrada');match.run('mat2','cmp-municipal','team-a','team-s',1,1,'2026-11-15T17:30:00-03:00','Estádio Municipal','Encerrada');match.run('mat3','cmp-municipal','team-g','team-u',null,null,'2026-11-19T19:00:00-03:00','Estádio Municipal','Agendada');
 const point=db.prepare('INSERT INTO tourist_points(id,name,description,category,address,status) VALUES(?,?,?,?,?,?)');[['p1','Balneário do Guamá','Águas e natureza','Balneário','São Miguel do Guamá','Publicado'],['p2','Praça Matriz','Encontro e história','Praça','Centro','Publicado'],['p3','Orla Municipal','Lazer à beira-rio','Lazer','Centro','Publicado'],['p4','Mercado Cultural','Sabores e cultura','Cultura','Centro','Publicado'],['p5','Igarapé das Almas','Paisagem natural','Natureza','São Miguel do Guamá','Publicado'],['p6','Centro Histórico','Memória guamaense','História','Centro','Publicado']].forEach(x=>point.run(...x));
 const news=db.prepare('INSERT INTO news(id,title,body,category,status,updated_at) VALUES(?,?,?,?,?,?)');news.run('n1','Semifinais dos Jogos Guamaenses começam nesta semana','Acompanhe os próximos confrontos e a classificação.','Esporte','Publicado',now);news.run('n2','Programação cultural de novembro','Confira os encontros previstos para este mês.','Comunidade','Publicado',now);
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
async function body(req){let s='';for await(const c of req)s+=c;if(s.length>1e6)throw Error('Payload too large');return s?JSON.parse(s):{}}
const coordinate=value=>value===null||value===undefined||String(value).trim()===''?null:(Number.isFinite(Number(value))?Number(value):null);
const tokenHash=t=>createHash('sha256').update(t).digest('hex');
function userFrom(req){const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!t)return null;return db.prepare(`SELECT u.id,u.name,u.email,p.name role FROM sessions s JOIN admin_users u ON u.id=s.user_id JOIN profiles p ON p.id=u.profile_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).get(tokenHash(t),new Date().toISOString())||null}
function requireUser(req,res,admin=false){const u=userFrom(req);if(!u){send(res,401,{error:'Entre na área administrativa para continuar.'});return null}if(admin&&u.role!=='Administrador Geral'){send(res,403,{error:'Esta ação exige o perfil Administrador Geral.'});return null}return u}
function fmtLocal(d){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(d)}
function oneEvent(id){return db.prepare(`SELECT id,title,description,category,starts_at startsAt,ends_at endsAt,location,age_range ageRange,drink_rule drinkRule,organizer_type organizerType,is_free isFree,capacity,status,updated_at updatedAt FROM events WHERE id=?`).get(id)}
async function route(req,res){const u=new URL(req.url,'http://localhost');const p=u.pathname;const m=req.method;
if(p==='/api/health')return send(res,200,{ok:true,database:'SQLite',persistent:true});
if(p==='/api/auth/login'&&m==='POST'){const {email,password}=await body(req);const user=db.prepare(`SELECT u.id,u.name,u.email,u.password_hash hash,p.name role FROM admin_users u JOIN profiles p ON p.id=u.profile_id WHERE lower(u.email)=lower(?) AND u.active=1`).get(String(email||''));if(!user||!timingSafeEqual(Buffer.from(user.hash,'hex'),Buffer.from(scryptSync(String(password||''),'SECELT-DEMO-2026',64).toString('hex'),'hex')))return send(res,401,{error:'E-mail ou senha incorretos.'});const raw=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenHash(raw),user.id,new Date(Date.now()+8*3600000).toISOString());return send(res,200,{token:raw,user:{id:user.id,name:user.name,email:user.email,role:user.role}})}
if(p==='/api/auth/me'&&m==='GET'){const a=requireUser(req,res);if(!a)return;return send(res,200,{user:a})}
if(p==='/api/auth/logout'&&m==='POST'){const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(t)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(t));return send(res,200,{ok:true})}
if(p==='/api/events'&&m==='GET'){return send(res,200,{items:db.prepare(`SELECT id,title,description,category,starts_at startsAt,ends_at endsAt,location,age_range ageRange,drink_rule drinkRule,organizer_type organizerType,is_free isFree,capacity,status,updated_at updatedAt FROM events WHERE status IN ('Publicado','Encerrado','Cancelado') ORDER BY starts_at`).all()})}
if(p==='/api/events'&&m==='POST'){const {name,email}=await body(req);if(!name||!email||!email.includes('@'))return send(res,400,{error:'Informe nome e e-mail válidos.'});const id=u.searchParams.get('id');if(!id)return send(res,400,{error:'Evento não informado.'});const ev=db.prepare(`SELECT id,capacity,status,(SELECT count(*) FROM registrations r WHERE r.event_id=events.id) used FROM events WHERE id=?`).get(id);if(!ev||ev.status!=='Publicado')return send(res,404,{error:'Evento indisponível.'});if(ev.capacity>0&&ev.used>=ev.capacity)return send(res,409,{error:'As vagas para este evento foram preenchidas.'});const citizen=db.prepare('SELECT id FROM citizens WHERE lower(email)=lower(?)').get(email);const cid=citizen?.id||randomUUID();if(!citizen)db.prepare('INSERT INTO citizens(id,name,email) VALUES(?,?,?)').run(cid,name,email);if(db.prepare('SELECT id FROM registrations WHERE event_id=? AND citizen_id=?').get(id,cid))return send(res,409,{error:'Este e-mail já está inscrito neste evento.'});const reg=randomUUID(),qr=randomBytes(24).toString('hex');db.prepare('INSERT INTO registrations(id,event_id,citizen_id,qr_hash,created_at) VALUES(?,?,?,?,?)').run(reg,id,cid,createHash('sha256').update(qr).digest('hex'),new Date().toISOString());return send(res,201,{registrationId:reg,qrCode:qr,eventId:id})}
if(p==='/api/sports'&&m==='GET'){
 const competitions=db.prepare(`SELECT id,name,sport,edition,status FROM competitions ORDER BY edition DESC,CASE name WHEN 'Campeonato Municipal' THEN 0 WHEN 'Jogos Guamaenses' THEN 1 WHEN 'Jogos Escolares' THEN 2 ELSE 3 END,name`).all();
 const teams=db.prepare(`SELECT t.id,t.name,t.coach,t.competition_id competitionId,COALESCE(SUM(CASE WHEN x.home_team=t.id AND x.home_score>x.away_score OR x.away_team=t.id AND x.away_score>x.home_score THEN 3 WHEN x.home_score=x.away_score THEN 1 ELSE 0 END),0) points,COALESCE(SUM(CASE WHEN x.home_team=t.id THEN x.home_score-x.away_score WHEN x.away_team=t.id THEN x.away_score-x.home_score ELSE 0 END),0) goalDifference FROM teams t LEFT JOIN matches x ON (x.home_team=t.id OR x.away_team=t.id) AND x.status='Encerrada' GROUP BY t.id ORDER BY points DESC,goalDifference DESC`).all();
 const matches=db.prepare(`SELECT m.id,m.starts_at startsAt,m.location,m.status,m.home_score homeScore,m.away_score awayScore,h.name homeTeam,a.name awayTeam,c.name competition FROM matches m JOIN teams h ON h.id=m.home_team JOIN teams a ON a.id=m.away_team JOIN competitions c ON c.id=m.competition_id ORDER BY m.starts_at DESC`).all();
 const members=db.prepare('SELECT id,name,role,shirt_number shirtNumber,team_id teamId FROM team_members ORDER BY team_id,name').all();
 return send(res,200,{competitions,teams,matches,members});
}
if(p==='/api/tourism'&&m==='GET')return send(res,200,{items:db.prepare(`SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt FROM tourist_points WHERE status='Publicado' ORDER BY name`).all(),googlePhotosEnabled:mapsPhotosEnabled});
const touristVisual=p.match(/^\/api\/tourism\/([\w-]+)\/(visual|photo)$/);
if(touristVisual&&m==='GET'){
 const [,id,kind]=touristVisual;const point=db.prepare('SELECT id,place_id placeId FROM tourist_points WHERE id=? AND status=\'Publicado\'').get(id);
 if(!point)return send(res,404,{error:'Ponto turístico não encontrado.'});
 if(!mapsPhotosEnabled||!point.placeId)return send(res,404,{error:'Foto da API indisponível; exibindo imagem local.'});
 try{
  if(kind==='visual'){
   const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(point.placeId)}`,{headers:{'X-Goog-Api-Key':process.env.GOOGLE_MAPS_API_KEY,'X-Goog-FieldMask':'photos,googleMapsUri'}});
   if(!response.ok)throw Error('Não foi possível consultar a foto deste local.');
   const details=await response.json();const photo=details.photos?.[0];if(!photo)return send(res,404,{error:'Este local ainda não tem fotos disponíveis.'});
   return send(res,200,{photoName:photo.name,authorAttributions:(photo.authorAttributions||[]).map(x=>({displayName:x.displayName,uri:x.uri?.startsWith('//')?`https:${x.uri}`:x.uri})).filter(x=>x.displayName),source:'Google Maps',sourceUrl:details.googleMapsUri||`https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(point.placeId)}`});
  }
  const photoName=u.searchParams.get('name')||'';
  if(!new RegExp(`^places/${point.placeId.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/photos/[A-Za-z0-9_-]+$`).test(photoName))return send(res,400,{error:'Foto não vinculada a este ponto turístico.'});
  const mediaUrl=new URL(`https://places.googleapis.com/v1/${photoName}/media`);mediaUrl.searchParams.set('maxWidthPx','1200');mediaUrl.searchParams.set('key',process.env.GOOGLE_MAPS_API_KEY);
  const response=await fetch(mediaUrl,{redirect:'follow'});
  if(!response.ok)throw Error('A foto não está disponível agora.');
  res.writeHead(200,{'Content-Type':response.headers.get('content-type')||'image/jpeg','Cache-Control':'no-store, max-age=0','Pragma':'no-cache'});return res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){return send(res,502,{error:error.message||'Falha ao consultar imagem do Google Maps.'})}
}
if(p==='/api/admin/tourism'&&m==='GET'){const a=requireUser(req,res);if(!a)return;const ownOnly=a.role!=='Administrador Geral';return send(res,200,{items:db.prepare(`SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt,created_by createdBy FROM tourist_points ${ownOnly?"WHERE status='Publicado' OR created_by=?":""} ORDER BY updated_at DESC,name`).all(...(ownOnly?[a.id]:[])),googlePhotosEnabled:mapsPhotosEnabled})}
if(p==='/api/admin/maps/places'&&m==='GET'){
 const a=requireUser(req,res);if(!a)return;if(!mapsPhotosEnabled)return send(res,503,{error:'Busca de fotos desligada. Configure GOOGLE_MAPS_API_KEY e GOOGLE_MAPS_PHOTOS_ENABLED=true no servidor.'});
 const query=String(u.searchParams.get('q')||'').trim();if(query.length<3)return send(res,400,{error:'Digite pelo menos três letras para buscar.'});
 const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':process.env.GOOGLE_MAPS_API_KEY,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress'},body:JSON.stringify({textQuery:`${query}, São Miguel do Guamá, Pará`,languageCode:'pt-BR',maxResultCount:5})});
 if(!response.ok)return send(res,502,{error:'Não foi possível pesquisar locais no Google Maps.'});const result=await response.json();return send(res,200,{items:(result.places||[]).map(x=>({placeId:x.id,suggestion:x.displayName?.text||'Local encontrado',addressSuggestion:x.formattedAddress||''}))});
}
if(p==='/api/admin/tourism'&&m==='POST'){
 const a=requireUser(req,res);if(!a)return;const b=await body(req);if(!b.name?.trim()||!b.address?.trim())return send(res,400,{error:'Nome e endereço são obrigatórios.'});
 const id=randomUUID(),stamp=new Date().toISOString(),status='Rascunho';db.prepare(`INSERT INTO tourist_points(id,name,description,category,address,latitude,longitude,image_url,status,place_id,created_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,b.name.trim(),String(b.description||''),b.category||'Lazer',b.address.trim(),coordinate(b.latitude),coordinate(b.longitude),b.imageUrl||'/assets/tourism-river.jpg',status,b.placeId||null,a.id,stamp);return send(res,201,{item:db.prepare('SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt,created_by createdBy FROM tourist_points WHERE id=?').get(id)});
}
const touristAdmin=p.match(/^\/api\/admin\/tourism\/([\w-]+)(?:\/(status))?$/);
if(touristAdmin){const [,id,action]=touristAdmin;if(m==='PUT'&&!action){const a=requireUser(req,res);if(!a)return;const b=await body(req);const current=db.prepare('SELECT status,created_by FROM tourist_points WHERE id=?').get(id);if(!current)return send(res,404,{error:'Ponto turístico não encontrado.'});if(a.role!=='Administrador Geral'&&(!['Rascunho','Reprovado'].includes(current.status)||current.created_by!==a.id))return send(res,403,{error:'Você só pode editar seus próprios rascunhos.'});if(!b.name?.trim()||!b.address?.trim())return send(res,400,{error:'Nome e endereço são obrigatórios.'});const stamp=new Date().toISOString();db.prepare(`UPDATE tourist_points SET name=?,description=?,category=?,address=?,latitude=?,longitude=?,image_url=?,place_id=?,updated_at=? WHERE id=?`).run(b.name.trim(),String(b.description||''),b.category||'Lazer',b.address.trim(),coordinate(b.latitude),coordinate(b.longitude),b.imageUrl||'/assets/tourism-river.jpg',b.placeId||null,stamp,id);return send(res,200,{item:db.prepare('SELECT id,name,description,category,address,latitude,longitude,image_url imageUrl,place_id placeId,status,updated_at updatedAt,created_by createdBy FROM tourist_points WHERE id=?').get(id)})}
 if(m==='PATCH'&&action==='status'){const a=requireUser(req,res);if(!a)return;const {status}=await body(req);const current=db.prepare('SELECT status,created_by FROM tourist_points WHERE id=?').get(id);if(!current)return send(res,404,{error:'Ponto turístico não encontrado.'});if(status==='Aguardando Aprovação'){if(!['Rascunho','Reprovado'].includes(current.status))return send(res,409,{error:'Somente rascunhos podem ser enviados para revisão.'});if(a.role==='Editor SECELT'&&current.created_by!==a.id)return send(res,403,{error:'Você só pode enviar seus próprios rascunhos.'})}else if(a.role!=='Administrador Geral')return send(res,403,{error:'Esta ação exige o perfil Administrador Geral.'});if(status==='Publicado'&&current.status!=='Aguardando Aprovação')return send(res,409,{error:'Somente itens em revisão podem ser publicados.'});if(!['Aguardando Aprovação','Publicado','Reprovado','Arquivado'].includes(status))return send(res,400,{error:'Status inválido.'});db.prepare('UPDATE tourist_points SET status=?,updated_at=? WHERE id=?').run(status,new Date().toISOString(),id);return send(res,200,{ok:true})}}
if(p==='/api/news'&&m==='GET')return send(res,200,{items:db.prepare(`SELECT id,title,body,category,updated_at updatedAt FROM news WHERE status='Publicado' ORDER BY updated_at DESC`).all()});
if(p==='/api/admin/overview'&&m==='GET'){if(!requireUser(req,res))return;return send(res,200,{pending:db.prepare(`SELECT count(*) n FROM events WHERE status='Aguardando Aprovação'`).get().n,published:db.prepare(`SELECT count(*) n FROM events WHERE status='Publicado'`).get().n,activeUsers:db.prepare(`SELECT count(*) n FROM admin_users WHERE active=1`).get().n,registrations:db.prepare('SELECT count(*) n FROM registrations').get().n,calendarUpdated:db.prepare(`SELECT max(updated_at) v FROM events WHERE status='Publicado'`).get().v})}
if(p==='/api/admin/events'&&m==='GET'){if(!requireUser(req,res))return;return send(res,200,{items:db.prepare(`SELECT id,title,description,category,starts_at startsAt,ends_at endsAt,location,age_range ageRange,drink_rule drinkRule,organizer_type organizerType,is_free isFree,capacity,status,updated_at updatedAt FROM events ORDER BY updated_at DESC`).all()})}
if(p==='/api/admin/events'&&m==='POST'){const a=requireUser(req,res);if(!a)return;const b=await body(req);if(!b.title||!b.startsAt||!b.location)return send(res,400,{error:'Título, data e local são obrigatórios.'});const id=randomUUID();db.prepare(`INSERT INTO events(id,title,description,category,starts_at,ends_at,location,age_range,drink_rule,organizer_type,is_free,capacity,status,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,b.title,b.description||'',b.category||'Cultura',b.startsAt,b.endsAt||null,b.location,b.ageRange||'Livre',b.drinkRule||'Não informado',b.organizerType||'Prefeitura',b.isFree===false?0:1,Math.max(0,Number(b.capacity)||0),'Rascunho',new Date().toISOString(),a.id);return send(res,201,{item:oneEvent(id)})}
const eventMatch=p.match(/^\/api\/admin\/events\/([\w-]+)(?:\/(status|registrations|history))?$/);
if(eventMatch){
 const [,id,action]=eventMatch;
 if(m==='PATCH'&&action==='status'){
  const a=requireUser(req,res);if(!a)return;
  const {status,note}=await body(req);
  const allowed=['Aguardando Aprovação','Publicado','Reprovado','Encerrado','Cancelado'];
  if(!allowed.includes(status))return send(res,400,{error:'Status inválido.'});
  const current=db.prepare('SELECT status,created_by FROM events WHERE id=?').get(id);
  if(!current)return send(res,404,{error:'Evento não encontrado.'});
  if(status==='Aguardando Aprovação'){
   if(!['Rascunho','Reprovado'].includes(current.status))return send(res,409,{error:'Somente rascunhos e conteúdos devolvidos podem ir para aprovação.'});
   if(a.role==='Editor SECELT'&&current.created_by!==a.id)return send(res,403,{error:'Você só pode enviar seus próprios rascunhos.'});
  } else if(a.role!=='Administrador Geral') return send(res,403,{error:'Esta ação exige o perfil Administrador Geral.'});
  if(['Publicado','Reprovado'].includes(status)&&current.status!=='Aguardando Aprovação')return send(res,409,{error:'A decisão só pode ser registrada enquanto o conteúdo aguarda aprovação.'});
  if(['Encerrado','Cancelado'].includes(status)&&current.status!=='Publicado')return send(res,409,{error:'Somente um conteúdo publicado pode ser encerrado ou cancelado.'});
  const stamp=new Date().toISOString();
  db.prepare('UPDATE events SET status=?,updated_at=? WHERE id=?').run(status,stamp,id);
  db.prepare('INSERT INTO approval_history(id,event_id,user_id,from_status,to_status,note,created_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),id,a.id,current.status,status,note||null,stamp);
  if(status==='Publicado'){
   const ev=oneEvent(id);
   db.prepare('INSERT INTO news(id,title,body,category,status,updated_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),`Calendário atualizado: ${ev.title}`,`A SECELT atualizou a agenda oficial em ${fmtLocal(new Date(stamp))}.`,'Calendário','Publicado',stamp);
  }
  return send(res,200,{item:oneEvent(id)});
 }
 if(m==='PUT'&&!action){
  const a=requireUser(req,res);if(!a)return;const b=await body(req);const current=db.prepare('SELECT status,created_by FROM events WHERE id=?').get(id);
  if(!current)return send(res,404,{error:'Evento não encontrado.'});if(!b.title?.trim()||!b.startsAt||!b.location?.trim())return send(res,400,{error:'Título, data e local são obrigatórios.'});
  if(a.role==='Editor SECELT'&&(!['Rascunho','Reprovado'].includes(current.status)||current.created_by!==a.id))return send(res,403,{error:'Você só pode ajustar seus próprios rascunhos.'});
  if(a.role==='Administrador Geral'&&!['Rascunho','Reprovado','Publicado'].includes(current.status))return send(res,409,{error:'Um item aguardando decisão não pode ser editado.'});
  const stamp=new Date().toISOString();db.prepare(`UPDATE events SET title=?,description=?,category=?,starts_at=?,ends_at=?,location=?,age_range=?,drink_rule=?,organizer_type=?,is_free=?,capacity=?,updated_at=? WHERE id=?`).run(b.title.trim(),b.description||'',b.category||'Cultura',b.startsAt,b.endsAt||null,b.location.trim(),b.ageRange||'Livre',b.drinkRule||'Não informado',b.organizerType||'Prefeitura',b.isFree===false?0:1,Math.max(0,Number(b.capacity)||0),stamp,id);
  if(current.status==='Publicado')db.prepare('INSERT INTO news(id,title,body,category,status,updated_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),`Calendário atualizado: ${b.title.trim()}`,`A SECELT atualizou a agenda oficial em ${fmtLocal(new Date(stamp))}.`,'Calendário','Publicado',stamp);
  return send(res,200,{item:oneEvent(id)});
 }
 if(m==='GET'&&action==='history'){
  if(!requireUser(req,res))return;
  return send(res,200,{items:db.prepare(`SELECT h.id,h.from_status fromStatus,h.to_status toStatus,h.note,h.created_at createdAt,u.name user FROM approval_history h JOIN admin_users u ON u.id=h.user_id WHERE h.event_id=? ORDER BY h.created_at DESC`).all(id)});
 }
 if(m==='GET'&&action==='registrations'){
  if(!requireUser(req,res,true))return;
  return send(res,200,{items:db.prepare(`SELECT r.id,c.name,c.email,r.created_at createdAt,r.checkin_status checkinStatus FROM registrations r JOIN citizens c ON c.id=r.citizen_id WHERE r.event_id=? ORDER BY r.created_at`).all(id)});
 }
}
if(p==='/api/admin/competitions'&&m==='GET'){if(!requireUser(req,res))return;return send(res,200,{items:db.prepare('SELECT * FROM competitions ORDER BY edition DESC').all()})}
if(p==='/api/admin/teams'&&m==='GET'){if(!requireUser(req,res))return;return send(res,200,{items:db.prepare('SELECT t.*,c.name competition FROM teams t JOIN competitions c ON c.id=t.competition_id ORDER BY c.name,t.name').all()})}
if(p==='/api/admin/users'&&m==='GET'){if(!requireUser(req,res,true))return;return send(res,200,{items:db.prepare('SELECT u.id,u.name,u.email,u.active,p.name role FROM admin_users u JOIN profiles p ON p.id=u.profile_id ORDER BY u.name').all()})}
if(p==='/api/admin/users'&&m==='POST'){if(!requireUser(req,res,true))return;const b=await body(req);if(!b.name||!b.email||!String(b.email).includes('@')||String(b.password||'').length<10)return send(res,400,{error:'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.'});if(!['Editor SECELT','Administrador Geral'].includes(b.role))return send(res,400,{error:'Perfil administrativo inválido.'});const profile=db.prepare('SELECT id FROM profiles WHERE name=?').get(b.role);try{const r=db.prepare('INSERT INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run(b.name.trim(),b.email.trim().toLowerCase(),scryptSync(String(b.password),'SECELT-DEMO-2026',64).toString('hex'),profile.id);return send(res,201,{item:{id:r.lastInsertRowid,name:b.name,email:b.email,role:b.role,active:1}})}catch(e){if(String(e.message).includes('UNIQUE'))return send(res,409,{error:'Já existe uma conta com este e-mail.'});throw e}}
return send(res,404,{error:'Rota não encontrada.'})}
 createServer(async(req,res)=>{try{if(req.url.startsWith('/api/'))return await route(req,res);const base=join(ROOT,existsSync(join(ROOT,'web','dist'))?'web/dist':'web');let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/')pathname='/index.html';let file=normalize(join(base,pathname));if(!file.startsWith(base)){res.writeHead(403);return res.end('Forbidden')}if(!existsSync(file)){file=join(base,'index.html');if(!existsSync(file)){res.writeHead(404);return res.end('Run npm install and npm run build in web/ first.')}}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file))}catch(e){const status=e.message==='Payload too large'?413:400;send(res,status,{error:e.message||'Falha interna da API.'})}}).listen(4173,'0.0.0.0',()=>console.log('SECELT Conecta API em http://localhost:4173'));

