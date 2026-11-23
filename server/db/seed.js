import { scryptSync } from 'node:crypto';

export function seedCatalog(db, now) {
  const count = db.prepare('SELECT count(*) n FROM events').get().n;
  if (!count) {
    for (const [name, desc] of [['Editor SECELT', 'Cria e envia conteúdo para revisão'], ['Administrador Geral', 'Revisa, publica e gerencia o sistema']]) db.prepare('INSERT OR IGNORE INTO profiles(name,description) VALUES(?,?)').run(name, desc);
    const hash = p => scryptSync(p, 'SECELT-DEMO-2026', 64).toString('hex');
    db.prepare('INSERT OR IGNORE INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run(
      'Marina Costa',
      'admin@secelt.local',
      hash('Guama#2026'),
      2
    );
    db.prepare('INSERT OR IGNORE INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run(
      'João Pedro',
      'editor@secelt.local',
      hash('Editor#2026'),
      1
    );
    const addEvent = db.prepare('INSERT INTO events(id,title,description,category,starts_at,ends_at,location,age_range,drink_rule,organizer_type,is_free,capacity,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    addEvent.run(
      'evt-festival',
      'Festival de Cultura Guamaense',
      'Música, dança e encontro da comunidade.',
      'Cultura',
      '2026-11-22T18:00:00-03:00',
      '2026-11-22T23:00:00-03:00',
      'Praça Matriz',
      'Livre',
      'Permitido conforme organização',
      'Prefeitura',
      1,
      120,
      'Publicado',
      now
    );
    addEvent.run(
      'evt-feira',
      'Feira de Artesanato e Sabores',
      'Artesanato e sabores de produtores locais.',
      'Cultura',
      '2026-11-28T16:00:00-03:00',
      '2026-11-28T21:00:00-03:00',
      'Orla Municipal',
      'Livre',
      'Não se aplica',
      'SECELT',
      1,
      80,
      'Publicado',
      now
    );
    addEvent.run(
      'evt-corrida',
      'Corrida de Aniversário da Cidade',
      'Percurso comemorativo pelas ruas de Guamá.',
      'Esporte',
      '2026-12-06T06:30:00-03:00',
      null,
      'Concentração na Praça Matriz',
      'A partir de 14 anos',
      'Não se aplica',
      'Prefeitura',
      1,
      200,
      'Publicado',
      now
    );
    addEvent.run(
      'evt-pending',
      'Mostra de Dança Guamaense',
      'Apresentações de grupos culturais locais.',
      'Cultura',
      '2026-12-12T19:00:00-03:00',
      null,
      'Centro Cultural',
      'Livre',
      'Conforme organização',
      'Prefeitura',
      1,
      150,
      'Aguardando Aprovação',
      now
    );
    const addComp = db.prepare('INSERT INTO competitions VALUES(?,?,?,?,?,?)');
    addComp.run('cmp-municipal', 'Campeonato Municipal', 'Futebol', 2026, '', 'Em andamento');
    addComp.run('cmp-guama', 'Jogos Guamaenses', 'Futebol', 2026, '', 'Em andamento');
    addComp.run('cmp-school', 'Jogos Escolares', 'Futsal', 2026, '', 'Planejada');
    const addTeam = db.prepare('INSERT INTO teams(id,name,competition_id,coach) VALUES(?,?,?,?)');
    [
      ['team-g', 'Guamá FC', 'cmp-municipal', 'Carlos Silva'],
      ['team-u', 'União do Jaderlândia', 'cmp-municipal', 'Paulo Sousa'],
      ['team-a', 'Atlético Guamaense', 'cmp-municipal', 'Raimundo Lima'],
      ['team-s', 'São Miguel', 'cmp-municipal', 'Marcos Pereira']
    ].forEach(x => addTeam.run(...x));
    const member = db.prepare('INSERT INTO team_members(id,name,role,shirt_number,team_id) VALUES(?,?,?,?,?)');
    [
      ['m1', 'Lucas Oliveira', 'Atleta', 9, 'team-g'],
      ['m2', 'Pedro Santos', 'Atleta', 1, 'team-g'],
      ['m3', 'João Ribeiro', 'Comissão técnica', null, 'team-g'],
      ['m4', 'André Costa', 'Atleta', 10, 'team-u']
    ].forEach(x => member.run(...x));
    const match = db.prepare('INSERT INTO matches(id,competition_id,home_team,away_team,home_score,away_score,starts_at,location,status) VALUES(?,?,?,?,?,?,?,?,?)');
    match.run('mat1', 'cmp-municipal', 'team-g', 'team-u', 2, 1, '2026-11-16T19:00:00-03:00', 'Estádio Municipal', 'Encerrada');
    match.run('mat2', 'cmp-municipal', 'team-a', 'team-s', 1, 1, '2026-11-15T17:30:00-03:00', 'Estádio Municipal', 'Encerrada');
    match.run('mat3', 'cmp-municipal', 'team-g', 'team-u', null, null, '2026-11-19T19:00:00-03:00', 'Estádio Municipal', 'Agendada');
    const point = db.prepare('INSERT INTO tourist_points(id,name,description,category,address,status) VALUES(?,?,?,?,?,?)');
    [
      ['p1', 'Balneário do Guamá', 'Águas e natureza', 'Balneário', 'São Miguel do Guamá', 'Publicado'],
      ['p2', 'Praça Matriz', 'Encontro e história', 'Praça', 'Centro', 'Publicado'],
      ['p3', 'Orla Municipal', 'Lazer à beira-rio', 'Lazer', 'Centro', 'Publicado'],
      ['p4', 'Mercado Cultural', 'Sabores e cultura', 'Cultura', 'Centro', 'Publicado'],
      ['p5', 'Igarapé das Almas', 'Paisagem natural', 'Natureza', 'São Miguel do Guamá', 'Publicado'],
      ['p6', 'Centro Histórico', 'Memória guamaense', 'História', 'Centro', 'Publicado']
    ].forEach(x => point.run(...x));
    const news = db.prepare('INSERT INTO news(id,title,body,category,status,updated_at) VALUES(?,?,?,?,?,?)');
    news.run(
      'n1',
      'Semifinais dos Jogos Guamaenses começam nesta semana',
      'Acompanhe os próximos confrontos e a classificação.',
      'Esporte',
      'Publicado',
      now
    );
    news.run('n2', 'Programação cultural de novembro', 'Confira os encontros previstos para este mês.', 'Comunidade', 'Publicado', now);
  }
  db.prepare("UPDATE tourist_points SET name='Monumento São Miguel Arcanjo',description='Monumento ao padroeiro e marco urbano guamaense.',category='História' WHERE id='p6' AND name='Centro Histórico'").run();
  const addLocalPoint = db.prepare('INSERT OR IGNORE INTO tourist_points(id,name,description,category,address,latitude,longitude,image_url,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)');
  [
    [
      'p7',
      'Igreja Matriz de São Miguel Arcanjo',
      'Igreja histórica retratada no acervo aberto da cidade.',
      'História',
      'Praça Frei Miguel de Bulhões, Centro',
      null,
      null,
      '/assets/tourism-igreja-matriz.jpg',
      'Publicado',
      now
    ],
    [
      'p8',
      'Externato Santo Antônio Maria Zaccaria',
      'Edificação histórica registrada em fotografia local de 2006.',
      'História',
      'São Miguel do Guamá, PA',
      null,
      null,
      '/assets/tourism-externato.jpg',
      'Publicado',
      now
    ],
    [
      'p9',
      'Igreja Nossa Senhora de Nazaré',
      'Igreja retratada no acervo histórico de São Miguel do Guamá.',
      'História',
      'São Miguel do Guamá, PA',
      null,
      null,
      '/assets/tourism-landmark.jpg',
      'Publicado',
      now
    ]
  ].forEach(x => addLocalPoint.run(...x));
  db.prepare("UPDATE tourist_points SET image_url=NULL WHERE id IN ('p1','p2','p4','p5')").run();
  db.prepare("UPDATE tourist_points SET image_url='/assets/tourism-river.jpg' WHERE id='p3'").run();
  db.prepare("UPDATE tourist_points SET image_url='/assets/tourism-church-side.jpg' WHERE id='p6'").run();
  const seedMedia = db.prepare(`INSERT OR IGNORE INTO media_assets(id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,rights_note,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  [
    [
      'media-rio-guama',
      'Turismo',
      'tourist_point',
      'p3',
      'Rio Guamá ao pôr do sol',
      'Vista do Rio Guamá ao pôr do sol em São Miguel do Guamá.',
      'web/public/assets/tourism-river.jpg',
      'image/jpeg',
      'https://commons.wikimedia.org/wiki/File:P%C3%B4r_do_Sol_em_S%C3%A3o_Miguel_do_Guama_-_panoramio.jpg',
      'Guilherme J. Corrêa',
      'CC BY-SA 3.0',
      'https://creativecommons.org/licenses/by-sa/3.0/',
      'Fotografia identificada em São Miguel do Guamá.',
      'Publicado',
      now
    ],
    [
      'media-monumento-sao-miguel',
      'Turismo',
      'tourist_point',
      'p6',
      'Monumento São Miguel Arcanjo',
      'Monumento de São Miguel Arcanjo em São Miguel do Guamá.',
      'web/public/assets/tourism-church-side.jpg',
      'image/jpeg',
      'https://commons.wikimedia.org/wiki/File:S%C3%A3o_Miguel_Arcanjo_-_panoramio_-_Guilherme_J._Corr%C3%AAa.jpg',
      'Guilherme J. Corrêa',
      'CC BY-SA 3.0',
      'https://creativecommons.org/licenses/by-sa/3.0/',
      'Fotografia identificada em São Miguel do Guamá.',
      'Publicado',
      now
    ],
    [
      'media-igreja-nazare',
      'Turismo',
      'tourist_point',
      'p9',
      'Igreja Nossa Senhora de Nazaré',
      'Igreja Nossa Senhora de Nazaré e orla em São Miguel do Guamá.',
      'web/public/assets/tourism-landmark.jpg',
      'image/jpeg',
      'https://commons.wikimedia.org/wiki/File:S%C3%A3o_Miguel_do_Guam%C3%A1_-_State_of_Par%C3%A1,_Brazil_-_panoramio.jpg',
      'Guilherme J. Corrêa',
      'CC BY-SA 3.0',
      'https://creativecommons.org/licenses/by-sa/3.0/',
      'Fotografia identificada em São Miguel do Guamá.',
      'Publicado',
      now
    ],
    [
      'media-igreja-matriz',
      'Turismo',
      'tourist_point',
      'p7',
      'Igreja Matriz ao pôr do sol',
      'Igreja Matriz de São Miguel do Guamá ao pôr do sol.',
      'web/public/assets/tourism-igreja-matriz.jpg',
      'image/jpeg',
      'https://commons.wikimedia.org/wiki/File:Primeira_igreja_de_S%C3%A3o_Miguel_do_Guam%C3%A1,_ao_p%C3%B4r_do_sol.jpg',
      'Vanessa S. Braga',
      'CC BY-SA 4.0',
      'https://creativecommons.org/licenses/by-sa/4.0/',
      'Fotografia local publicada pela autora sob licença aberta.',
      'Publicado',
      now
    ],
    [
      'media-externato',
      'Turismo',
      'tourist_point',
      'p8',
      'Externato Santo Antônio Maria Zaccaria',
      'Vista do Externato Santo Antônio Maria Zaccaria em São Miguel do Guamá.',
      'web/public/assets/tourism-externato.jpg',
      'image/jpeg',
      'https://commons.wikimedia.org/wiki/File:Tibi_pater_Instiituto_S._Antonio_Maria_Zacaria_S%C3%A3o_Miguel_do_Guama_-_panoramio.jpg',
      'Guilherme J. Corrêa',
      'CC BY-SA 3.0',
      'https://creativecommons.org/licenses/by-sa/3.0/',
      'Fotografia local publicada sob licença aberta.',
      'Publicado',
      now
    ]
  ].forEach(x => seedMedia.run(...x));
}
