import { scryptSync } from 'node:crypto';
import { PARTNER_ROLE } from '../social/rules.js';

export function seedSocial(db) {
  if (db.prepare("SELECT 1 FROM social_migrations WHERE id='social-v1'").get()) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    const pages = [
      [
        'secelt',
        'SECELT Conecta',
        'seceltconecta',
        'official',
        'Esporte, cultura e novos encontros. Acompanhe o que acontece em São Miguel do Guamá.',
        '#399eff',
        'media-rio-guama'
      ],
      [
        'cultura-guama',
        'Cultura Guamaense',
        'culturaguama',
        'partner',
        'Nossa história, nossa arte e as pessoas que fazem a cultura acontecer.',
        '#ad98fc',
        'media-igreja-matriz'
      ],
      [
        'esporte-guama',
        'Guamá em Campo',
        'guamaemcampo',
        'partner',
        'A paixão pelo esporte aproxima a nossa cidade. Jogos, equipes e encontros.',
        '#65d8b1',
        'media-rio-guama'
      ],
      [
        'descubra-guama',
        'Descubra Guamá',
        'descubraguama',
        'partner',
        'Um convite para olhar de novo. Paisagens, memória e caminhos da nossa cidade.',
        '#f1bf7c',
        'media-externato'
      ]
    ];
    for (const p of pages) db.prepare('INSERT OR IGNORE INTO social_pages(id,name,handle,kind,bio,color,cover_media_id) VALUES(?,?,?,?,?,?,?)').run(
      ...p.slice(0, 6),
      db.prepare('SELECT id FROM media_assets WHERE id=?').get(p[6])?.id || null
    );
    for (const editor of db.prepare("SELECT u.id FROM admin_users u JOIN profiles p ON p.id=u.profile_id WHERE p.name='Editor SECELT'").all()) db.prepare("INSERT OR IGNORE INTO social_page_members VALUES('secelt',?)").run(editor.id);
    db.prepare('INSERT OR IGNORE INTO profiles(name,description) VALUES(?,?)').run(
      PARTNER_ROLE,
      'Prepara e envia publicações das páginas vinculadas para aprovação.'
    );
    const role = db.prepare('SELECT id FROM profiles WHERE name=?').get(PARTNER_ROLE);
    db.prepare('INSERT OR IGNORE INTO admin_users(name,email,password_hash,profile_id) VALUES(?,?,?,?)').run(
      'Cultura Guamaense',
      'parceiro@secelt.local',
      scryptSync('Parceiro#2026', 'SECELT-DEMO-2026', 64).toString('hex'),
      role.id
    );
    const partner = db.prepare("SELECT id FROM admin_users WHERE email='parceiro@secelt.local'").get();
    db.prepare("INSERT OR IGNORE INTO social_page_members VALUES('cultura-guama',?)").run(partner.id);
    const admin = db.prepare("SELECT u.id FROM admin_users u JOIN profiles p ON p.id=u.profile_id WHERE p.name='Administrador Geral' ORDER BY u.id LIMIT 1").get()?.id || null;
    const stamp = new Date().toISOString(), ago = hours => new Date(Date.now() - hours * 3600000).toISOString();
    const seedRows = [
      [
        'post-rio',
        'secelt',
        'post',
        'photo',
        'A nossa cidade tem um jeito único de conectar.',
        'Tem encontro que começa com uma paisagem. 💙\n\nEntre o rio, a cultura e as pessoas, São Miguel do Guamá tem muito para compartilhar. Este é o nosso espaço para descobrir, participar e estar mais perto.\n\nO que você mais gosta na nossa cidade?',
        'Comunidade',
        ['media-rio-guama'],
        true,
        248,
        0,
        1
      ],
      [
        'post-memoria',
        'cultura-guama',
        'post',
        'carousel',
        'Histórias que fazem parte de nós.',
        'Um passeio pela memória guamaense, em três olhares. Deslize para descobrir detalhes da nossa cidade e salve para olhar com calma.\n\nQual desses lugares faz parte da sua história?',
        'Cultura',
        ['media-igreja-matriz', 'media-externato', 'media-monumento-sao-miguel'],
        true,
        186,
        0,
        4
      ],
      [
        'post-esporte',
        'esporte-guama',
        'post',
        'text',
        'O próximo encontro é dentro de campo.',
        'Acompanhe a classificação e os próximos jogos municipais na área de Esporte. Cada equipe tem uma história. Cada torcida também. ⚽\n\nQual time você acompanha?',
        'Esporte',
        [],
        false,
        94,
        0,
        7
      ],
      [
        'post-descubra',
        'descubra-guama',
        'post',
        'photo',
        'Redescubra os caminhos de Guamá.',
        'Às vezes, um novo olhar é tudo o que a gente precisa. Conheça os pontos da nossa cidade, veja as fotos e encontre o caminho pelo mapa.\n\nSalve este registro para o seu próximo passeio.',
        'Turismo',
        ['media-igreja-nazare'],
        true,
        132,
        0,
        12
      ],
      [
        'post-agenda',
        'secelt',
        'post',
        'photo',
        'Seu próximo encontro está na agenda.',
        'Cultura, esporte e lazer para fazer parte da sua semana. Consulte a programação, veja os detalhes e participe dos eventos com inscrição gratuita.\n\nCompartilhe com quem vai junto.',
        'Lazer',
        ['media-igreja-matriz'],
        false,
        73,
        0,
        18
      ],
      [
        'post-video',
        'cultura-guama',
        'post',
        'video',
        'Um olhar sobre o nosso patrimônio.',
        'Um espaço para novos registros da cultura guamaense. Acompanhe a página para descobrir as próximas publicações.',
        'Cultura',
        ['media-externato'],
        false,
        51,
        0,
        26
      ],
      [
        'story-rio',
        'secelt',
        'story',
        'photo',
        'A cidade se conecta aqui.',
        'Seu novo ponto de encontro com São Miguel do Guamá.',
        'Comunidade',
        ['media-rio-guama'],
        false,
        0,
        0,
        2
      ],
      [
        'story-cultura',
        'cultura-guama',
        'story',
        'photo',
        'Nossa memória está viva.',
        'Descubra os detalhes que contam a nossa história.',
        'Cultura',
        ['media-igreja-matriz'],
        false,
        0,
        0,
        5
      ],
      [
        'story-esporte',
        'esporte-guama',
        'story',
        'photo',
        'A cidade veste a camisa.',
        'Acompanhe os jogos e a classificação na área de Esporte.',
        'Esporte',
        ['media-monumento-sao-miguel'],
        false,
        0,
        0,
        8
      ],
      [
        'story-descubra',
        'descubra-guama',
        'story',
        'photo',
        'Olhe a cidade de novo.',
        'Lugares, paisagens e encontros esperando por você.',
        'Turismo',
        ['media-igreja-nazare'],
        false,
        0,
        0,
        9
      ]
    ];
    const insert = db.prepare('INSERT OR IGNORE INTO social_content(id,root_id,publisher_id,type,format,title,caption,category,media_ids,recommended,base_likes,base_comments,status,created_by,created_at,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    for (const [id, publisher, type, format, title, caption, category, ids, recommended, likes, comments, hours] of seedRows) {
      const mediaIds = ids.filter(mid => db.prepare('SELECT 1 FROM media_assets WHERE id=?').get(mid));
      if (format !== 'text' && !mediaIds.length) continue;
      insert.run(
        id,
        id,
        publisher,
        type,
        format,
        title,
        caption,
        category,
        JSON.stringify(mediaIds),
        Number(recommended),
        likes,
        comments,
        'Publicado',
        admin,
        ago(hours),
        ago(hours),
        stamp
      );
    }
    const event = db.prepare("SELECT id FROM events WHERE status='Publicado' ORDER BY starts_at LIMIT 1").get();
    if (event) db.prepare("UPDATE social_content SET event_id=? WHERE id='post-agenda'").run(event.id);
    db.prepare('INSERT INTO social_migrations VALUES(?,?)').run('social-v1', stamp);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
