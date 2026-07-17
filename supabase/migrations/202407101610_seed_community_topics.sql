begin;
insert into public.community_topics (slug, title, description)
values
  ('avisos-gerais', 'Avisos e prazos oficiais', 'Central de comunicados curtos sobre inscrições, cartões e prazos do ENEM.'),
  ('redacao-e-repertorios', 'Redação e repertórios', 'Tópico para compartilhar estratégias, repertórios socioculturais e pedidos de feedback seguro.'),
  ('questoes-e-simulados', 'Questões e simulados', 'Debates sobre resolução de questões, simulados rápidos e dúvidas de interpretação.'),
  ('bem-estar-e-rotina', 'Bem-estar e rotina de estudos', 'Conversas sobre organização, foco, descanso e saúde mental durante a preparação.')
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description;
commit;
