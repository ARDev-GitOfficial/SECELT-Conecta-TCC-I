CREATE TABLE IF NOT EXISTS municipal_news_sources (
  news_id TEXT PRIMARY KEY REFERENCES news(id),
  source_url TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO tourist_points (id,name,description,category,address,status,updated_at) VALUES
  ('pt-fundo-quintal', 'Balneário Fundo de Quintal', 'Balneário de São João do Furo onde o SCFV realizou atividades de convivência no igarapé.', 'Balneário', 'Comunidade de São João do Furo', 'Publicado', CURRENT_TIMESTAMP),
  ('pt-licurgo', 'Praça Licurgo Peixoto', 'Praça do Complexo Beira Rio com chafariz e espaços para descanso.', 'Praça', 'Centro, Complexo Beira Rio', 'Publicado', CURRENT_TIMESTAMP),
  ('pt-andrassy', 'Centro Cultural Andrassy Viana de Carvalho', 'Espaço cultural integrado à primeira etapa do Complexo Beira Rio.', 'Cultura', 'Complexo Beira Rio, Centro', 'Publicado', CURRENT_TIMESTAMP);

UPDATE tourist_points SET name='Orla José Fonteles', description='Calçadão, ciclovia e áreas de convivência do Complexo Beira Rio.', updated_at=CURRENT_TIMESTAMP
WHERE id='p3' AND name='Orla Municipal' AND description='Lazer à beira-rio' AND created_by IS NULL;

INSERT OR IGNORE INTO news (id,title,body,category,status,updated_at) VALUES
  ('municipal-futsal-finais', 'Independente e Solidários conquistam o título guamaense', 'Na quadra da Recastel, o Independente venceu as Galáticas por 10 a 4 na decisão feminina. No sub-20 masculino, o Solidários fez 4 a 1 sobre o Guedes e conquistou seu primeiro título na categoria.', 'Esporte', 'Publicado', '2026-09-23T12:00:00-03:00');
INSERT OR IGNORE INTO municipal_news_sources (news_id,source_url) VALUES
  ('municipal-futsal-finais', 'https://saomigueldoguama.pa.gov.br/campeonato-guamaense-de-futsal-chega-ao-fim-com-grandes-disputas-e-novos-campeoes/');

INSERT OR IGNORE INTO media_assets
  (id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,status,updated_at) VALUES
  ('mid-futsal-quadra', 'Esporte', 'news', 'municipal-futsal-finais', 'Festa do título na Recastel', 'Atletas erguem a taça na quadra após a final guamaense.', 'web/public/assets/futsal-quadra.jpg', 'image/jpeg', 'https://saomigueldoguama.pa.gov.br/campeonato-guamaense-de-futsal-chega-ao-fim-com-grandes-disputas-e-novos-campeoes/', 'Prefeitura de São Miguel do Guamá', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/campeonato-guamaense-de-futsal-chega-ao-fim-com-grandes-disputas-e-novos-campeoes/', 'Publicado', '2026-09-23T12:00:00-03:00'),
  ('mid-futsal-finais', 'Esporte', 'news', 'municipal-futsal-finais', 'Cartaz das finais guamaenses', 'Montagem da Prefeitura com as equipes e cenas da noite das finais.', 'web/public/assets/futsal-finais.jpg', 'image/jpeg', 'https://saomigueldoguama.pa.gov.br/campeonato-guamaense-de-futsal-chega-ao-fim-com-grandes-disputas-e-novos-campeoes/', 'Prefeitura de São Miguel do Guamá', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/campeonato-guamaense-de-futsal-chega-ao-fim-com-grandes-disputas-e-novos-campeoes/', 'Publicado', '2026-09-23T12:00:00-03:00');

INSERT OR IGNORE INTO news (id,title,body,category,status,updated_at) VALUES
  ('municipal-futsal-adulto', 'Futsal masculino adulto chega à sexta edição', 'O comunicado de setembro anunciou 12 vagas para clubes e previu jogos de 7 de outubro a 27 de novembro de 2026. O regulamento e a ficha de inscrição estão na publicação original.', 'Esporte', 'Publicado', '2026-09-15T12:00:00-03:00');
INSERT OR IGNORE INTO municipal_news_sources (news_id,source_url) VALUES
  ('municipal-futsal-adulto', 'https://saomigueldoguama.pa.gov.br/prefeitura-abre-inscricoes-para-o-6o-campeonato-municipal-de-futsal-masculino-adulto/');

INSERT OR IGNORE INTO media_assets
  (id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,status,updated_at) VALUES
  ('mid-futsal-adulto', 'Esporte', 'news', 'municipal-futsal-adulto', 'Cartaz da sexta edição do futsal', 'Arte do anúncio de setembro com o emblema do campeonato masculino.', 'web/public/assets/futsal-adulto.png', 'image/png', 'https://saomigueldoguama.pa.gov.br/prefeitura-abre-inscricoes-para-o-6o-campeonato-municipal-de-futsal-masculino-adulto/', 'Prefeitura de São Miguel do Guamá', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/prefeitura-abre-inscricoes-para-o-6o-campeonato-municipal-de-futsal-masculino-adulto/', 'Publicado', '2026-09-15T12:00:00-03:00');

INSERT OR IGNORE INTO news (id,title,body,category,status,updated_at) VALUES
  ('municipal-rio-que-chove', 'Rio que Chove divulga artistas credenciados', 'A SECELT publicou a lista de artistas e agentes culturais credenciados para o festival. A proposta leva exposições e apresentações a praças de diferentes bairros. A lista completa está na notícia da Prefeitura.', 'Cultura', 'Publicado', '2026-09-02T12:00:00-03:00');
INSERT OR IGNORE INTO municipal_news_sources (news_id,source_url) VALUES
  ('municipal-rio-que-chove', 'https://saomigueldoguama.pa.gov.br/prefeitura-divulga-lista-de-fazedores-de-cultura-credenciados-para-o-festival-cultural-rio-que-chove/');

INSERT OR IGNORE INTO media_assets
  (id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,status,updated_at) VALUES
  ('mid-rio-que-chove', 'Eventos', 'news', 'municipal-rio-que-chove', 'Credenciamento do Rio que Chove', 'Peça do festival que anuncia o resultado da análise documental.', 'web/public/assets/rio-que-chove.png', 'image/png', 'https://saomigueldoguama.pa.gov.br/prefeitura-divulga-lista-de-fazedores-de-cultura-credenciados-para-o-festival-cultural-rio-que-chove/', 'Prefeitura de São Miguel do Guamá', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/prefeitura-divulga-lista-de-fazedores-de-cultura-credenciados-para-o-festival-cultural-rio-que-chove/', 'Publicado', '2026-09-02T12:00:00-03:00');

INSERT OR IGNORE INTO news (id,title,body,category,status,updated_at) VALUES
  ('municipal-balneario', 'Convivência e lazer em São João do Furo', 'No Balneário Fundo de Quintal, participantes do Serviço de Convivência e Fortalecimento de Vínculos fizeram hidroginástica no igarapé e participaram de atividades de dança e de um almoço coletivo.', 'Lazer', 'Publicado', '2026-08-21T12:00:00-03:00');
INSERT OR IGNORE INTO municipal_news_sources (news_id,source_url) VALUES
  ('municipal-balneario', 'https://saomigueldoguama.pa.gov.br/scfv-promove-dia-de-lazer-e-convivencia-para-idosos/');

INSERT OR IGNORE INTO media_assets
  (id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,status,updated_at) VALUES
  ('mid-balneario-encontro', 'Turismo', 'tourist_point', 'pt-fundo-quintal', 'Encontro no Balneário Fundo de Quintal', 'Participantes conversam à mesa na margem do igarapé.', 'web/public/assets/balneario-encontro.jpg', 'image/jpeg', 'https://saomigueldoguama.pa.gov.br/scfv-promove-dia-de-lazer-e-convivencia-para-idosos/', 'Prefeitura de São Miguel do Guamá', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/scfv-promove-dia-de-lazer-e-convivencia-para-idosos/', 'Publicado', '2026-08-21T12:00:00-03:00'),
  ('mid-balneario-atividade', 'Turismo', 'tourist_point', 'pt-fundo-quintal', 'Um dia em São João do Furo', 'Duas participantes do encontro do SCFV em área arborizada do balneário.', 'web/public/assets/balneario-atividade.jpg', 'image/jpeg', 'https://saomigueldoguama.pa.gov.br/scfv-promove-dia-de-lazer-e-convivencia-para-idosos/', 'Prefeitura de São Miguel do Guamá', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/scfv-promove-dia-de-lazer-e-convivencia-para-idosos/', 'Publicado', '2026-08-21T12:00:00-03:00');

INSERT OR IGNORE INTO news (id,title,body,category,status,updated_at) VALUES
  ('municipal-beira-rio', 'Orla José Fonteles integra o Complexo Beira Rio', 'A primeira etapa do complexo reuniu a Orla José Fonteles, a Praça Licurgo Peixoto e o Centro Cultural Andrassy Viana de Carvalho. O trecho à beira do rio ganhou calçadão, ciclovia e bancos.', 'Turismo', 'Publicado', '2022-06-24T12:00:00-03:00');
INSERT OR IGNORE INTO municipal_news_sources (news_id,source_url) VALUES
  ('municipal-beira-rio', 'https://saomigueldoguama.pa.gov.br/primeira-etapa-do-complexo-beira-rio-e-inaugurada/');

INSERT OR IGNORE INTO media_assets
  (id,section,entity_type,entity_id,title,alt_text,file_path,mime_type,source_url,author,license_name,license_url,status,updated_at) VALUES
  ('mid-beira-rio', 'Turismo', 'tourist_point', 'p3', 'Complexo Beira Rio visto do alto', 'Vista aérea da orla, da praça e das edificações junto ao Rio Guamá.', 'web/public/assets/beira-rio.jpg', 'image/jpeg', 'https://saomigueldoguama.pa.gov.br/primeira-etapa-do-complexo-beira-rio-e-inaugurada/', 'Enzo Dourado / DECOM', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/primeira-etapa-do-complexo-beira-rio-e-inaugurada/', 'Publicado', '2022-06-24T12:00:00-03:00'),
  ('mid-beira-rio-praca', 'Turismo', 'tourist_point', 'p3', 'Inauguração do Complexo Beira Rio', 'Registro da cerimônia de inauguração do complexo em junho de 2022.', 'web/public/assets/beira-rio-praca.jpg', 'image/jpeg', 'https://saomigueldoguama.pa.gov.br/primeira-etapa-do-complexo-beira-rio-e-inaugurada/', 'Enzo Dourado / DECOM', 'Acervo da Prefeitura', 'https://saomigueldoguama.pa.gov.br/primeira-etapa-do-complexo-beira-rio-e-inaugurada/', 'Publicado', '2022-06-24T12:00:00-03:00');
