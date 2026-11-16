PRAGMA foreign_keys = ON;

CREATE TABLE profiles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  profile_id INTEGER NOT NULL REFERENCES profiles(id)
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id),
  expires_at TEXT NOT NULL
);
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Cultura',
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  location TEXT NOT NULL,
  age_range TEXT NOT NULL DEFAULT 'Livre',
  drink_rule TEXT NOT NULL DEFAULT 'Não informado',
  organizer_type TEXT NOT NULL DEFAULT 'Prefeitura',
  is_free INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Rascunho',
  updated_at TEXT NOT NULL,
  created_by INTEGER REFERENCES admin_users(id)
);
CREATE TABLE citizens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  citizen_id TEXT NOT NULL REFERENCES citizens(id),
  qr_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  checkin_status TEXT NOT NULL DEFAULT 'Pendente',
  UNIQUE(event_id,citizen_id)
);
CREATE TABLE competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  edition INTEGER NOT NULL,
  regulation_url TEXT,
  status TEXT NOT NULL
);
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  competition_id TEXT NOT NULL REFERENCES competitions(id),
  coach TEXT NOT NULL DEFAULT ''
);
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  shirt_number INTEGER,
  team_id TEXT NOT NULL REFERENCES teams(id)
);
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL REFERENCES competitions(id),
  home_team TEXT NOT NULL REFERENCES teams(id),
  away_team TEXT NOT NULL REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  starts_at TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Agendada'
);
CREATE TABLE tourist_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Publicado',
  place_id TEXT,
  created_by INTEGER REFERENCES admin_users(id),
  updated_at TEXT
);
CREATE TABLE news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Publicado',
  updated_at TEXT NOT NULL
);
CREATE TABLE approval_history (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id INTEGER NOT NULL REFERENCES admin_users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_events_status_date ON events(status,starts_at);
CREATE INDEX idx_matches_competition_date ON matches(competition_id,starts_at);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_approval_history_event ON approval_history(event_id,created_at);
CREATE UNIQUE INDEX idx_citizens_email ON citizens(lower(email));
