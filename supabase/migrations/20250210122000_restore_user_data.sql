begin;

insert into auth.users
select *
  from backup_user_data.auth_users
on conflict (id) do nothing;

insert into public.user_profiles (
  id,
  user_id,
  nome_completo,
  avatar_url,
  bio,
  objetivo,
  ano_enem,
  community_tagline,
  community_profile_theme,
  community_show_statistics,
  community_terms_version,
  community_terms_accepted_at,
  community_age_confirmed_at,
  is_over_16,
  created_at,
  updated_at
)
select
  id,
  user_id,
  nome_completo,
  avatar_url,
  bio,
  objetivo,
  ano_enem,
  community_tagline,
  community_profile_theme,
  coalesce(community_show_statistics, true),
  community_terms_version,
  community_terms_accepted_at,
  community_age_confirmed_at,
  is_over_16,
  coalesce(created_at, now()),
  coalesce(updated_at, created_at, now())
from backup_user_data.user_profiles
on conflict (user_id) do update set
  nome_completo = excluded.nome_completo,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  objetivo = excluded.objetivo,
  ano_enem = excluded.ano_enem,
  community_tagline = excluded.community_tagline,
  community_profile_theme = excluded.community_profile_theme,
  community_show_statistics = excluded.community_show_statistics,
  community_terms_version = excluded.community_terms_version,
  community_terms_accepted_at = excluded.community_terms_accepted_at,
  community_age_confirmed_at = excluded.community_age_confirmed_at,
  is_over_16 = excluded.is_over_16,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.user_statistics (
  id,
  user_id,
  total_redacoes,
  media_nota_redacao,
  melhor_nota_redacao,
  pior_nota_redacao,
  media_competencia1,
  media_competencia2,
  media_competencia3,
  media_competencia4,
  media_competencia5,
  total_simulados,
  total_questoes_respondidas,
  total_acertos,
  total_erros,
  taxa_acerto,
  acertos_matematica,
  total_matematica,
  acertos_portugues,
  total_portugues,
  acertos_quimica,
  total_quimica,
  acertos_fisica,
  total_fisica,
  acertos_geografia,
  total_geografia,
  ultima_atualizacao
)
select
  id,
  user_id,
  coalesce(total_redacoes, 0),
  media_nota_redacao,
  melhor_nota_redacao,
  pior_nota_redacao,
  media_competencia1,
  media_competencia2,
  media_competencia3,
  media_competencia4,
  media_competencia5,
  coalesce(total_simulados, 0),
  coalesce(total_questoes_respondidas, 0),
  coalesce(total_acertos, 0),
  coalesce(total_erros, 0),
  taxa_acerto,
  coalesce(acertos_matematica, 0),
  coalesce(total_matematica, 0),
  coalesce(acertos_portugues, 0),
  coalesce(total_portugues, 0),
  coalesce(acertos_quimica, 0),
  coalesce(total_quimica, 0),
  coalesce(acertos_fisica, 0),
  coalesce(total_fisica, 0),
  coalesce(acertos_geografia, 0),
  coalesce(total_geografia, 0),
  coalesce(ultima_atualizacao, now())
from backup_user_data.user_statistics
on conflict (user_id) do update set
  total_redacoes = excluded.total_redacoes,
  media_nota_redacao = excluded.media_nota_redacao,
  melhor_nota_redacao = excluded.melhor_nota_redacao,
  pior_nota_redacao = excluded.pior_nota_redacao,
  media_competencia1 = excluded.media_competencia1,
  media_competencia2 = excluded.media_competencia2,
  media_competencia3 = excluded.media_competencia3,
  media_competencia4 = excluded.media_competencia4,
  media_competencia5 = excluded.media_competencia5,
  total_simulados = excluded.total_simulados,
  total_questoes_respondidas = excluded.total_questoes_respondidas,
  total_acertos = excluded.total_acertos,
  total_erros = excluded.total_erros,
  taxa_acerto = excluded.taxa_acerto,
  acertos_matematica = excluded.acertos_matematica,
  total_matematica = excluded.total_matematica,
  acertos_portugues = excluded.acertos_portugues,
  total_portugues = excluded.total_portugues,
  acertos_quimica = excluded.acertos_quimica,
  total_quimica = excluded.total_quimica,
  acertos_fisica = excluded.acertos_fisica,
  total_fisica = excluded.total_fisica,
  acertos_geografia = excluded.acertos_geografia,
  total_geografia = excluded.total_geografia,
  ultima_atualizacao = excluded.ultima_atualizacao;

insert into public.user_goals (
  id,
  user_id,
  tipo,
  descricao,
  valor_alvo,
  disciplina,
  competencia,
  prazo,
  concluida,
  progresso,
  created_at,
  updated_at
)
select
  id,
  user_id,
  tipo,
  descricao,
  valor_alvo,
  disciplina,
  competencia,
  prazo,
  coalesce(concluida, false),
  coalesce(progresso, 0),
  coalesce(created_at, now()),
  coalesce(updated_at, created_at, now())
from backup_user_data.user_goals
on conflict (id) do update set
  tipo = excluded.tipo,
  descricao = excluded.descricao,
  valor_alvo = excluded.valor_alvo,
  disciplina = excluded.disciplina,
  competencia = excluded.competencia,
  prazo = excluded.prazo,
  concluida = excluded.concluida,
  progresso = excluded.progresso,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.achievements (
  id,
  slug,
  name,
  description,
  icon,
  criteria,
  created_at
)
select
  id,
  slug,
  name,
  description,
  icon,
  criteria,
  coalesce(created_at, now())
from backup_user_data.achievements
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  criteria = excluded.criteria,
  created_at = excluded.created_at;

insert into public.user_achievements (
  id,
  user_id,
  achievement_id,
  earned_at,
  metadata
)
select
  id,
  user_id,
  achievement_id,
  coalesce(earned_at, now()),
  metadata
from backup_user_data.user_achievements
on conflict (user_id, achievement_id) do update set
  earned_at = excluded.earned_at,
  metadata = excluded.metadata;

insert into public.noticias (
  id,
  titulo,
  slug,
  resumo,
  conteudo,
  imagem_url,
  autor,
  data_publicacao,
  tags,
  destaque,
  fonte_url,
  created_at,
  updated_at
)
select
  id,
  titulo,
  slug,
  resumo,
  conteudo,
  imagem_url,
  autor,
  coalesce(data_publicacao, now()),
  coalesce(tags, '{}'),
  coalesce(destaque, false),
  fonte_url,
  coalesce(created_at, now()),
  coalesce(created_at, now())
from backup_user_data.noticias
on conflict (slug) do update set
  titulo = excluded.titulo,
  resumo = excluded.resumo,
  conteudo = excluded.conteudo,
  imagem_url = excluded.imagem_url,
  autor = excluded.autor,
  data_publicacao = excluded.data_publicacao,
  tags = excluded.tags,
  destaque = excluded.destaque,
  fonte_url = excluded.fonte_url,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.configuracoes (
  id,
  chave,
  valor,
  created_at,
  updated_at
)
select
  id,
  chave,
  valor,
  coalesce(created_at, now()),
  coalesce(updated_at, created_at, now())
from backup_user_data.configuracoes
on conflict (chave) do update set
  valor = excluded.valor,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.essay_results (
  id,
  user_id,
  nota,
  competencia1,
  competencia2,
  competencia3,
  competencia4,
  competencia5,
  feedback_geral,
  ponto_fortes,
  pontos_a_melhorar,
  redacao_original,
  origem,
  tema,
  texto_apoio1,
  texto_apoio2,
  created_at,
  updated_at
)
select
  id,
  user_id,
  nota,
  competencia1,
  competencia2,
  competencia3,
  competencia4,
  competencia5,
  feedback_geral,
  coalesce(ponto_fortes, '{}'),
  coalesce(pontos_a_melhorar, '{}'),
  redacao_original,
  origem,
  tema,
  texto_apoio1,
  texto_apoio2,
  coalesce(created_at, now()),
  coalesce(updated_at, created_at, now())
from backup_user_data.essay_results
on conflict (id) do update set
  user_id = excluded.user_id,
  nota = excluded.nota,
  competencia1 = excluded.competencia1,
  competencia2 = excluded.competencia2,
  competencia3 = excluded.competencia3,
  competencia4 = excluded.competencia4,
  competencia5 = excluded.competencia5,
  feedback_geral = excluded.feedback_geral,
  ponto_fortes = excluded.ponto_fortes,
  pontos_a_melhorar = excluded.pontos_a_melhorar,
  redacao_original = excluded.redacao_original,
  origem = excluded.origem,
  tema = excluded.tema,
  texto_apoio1 = excluded.texto_apoio1,
  texto_apoio2 = excluded.texto_apoio2,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.quiz_results (
  id,
  user_id,
  total_questions,
  correct_answers,
  wrong_answers,
  unanswered_questions,
  score,
  disciplines,
  questions_data,
  answers_data,
  created_at
)
select
  id,
  user_id,
  total_questions,
  correct_answers,
  wrong_answers,
  unanswered_questions,
  score,
  disciplines,
  questions_data,
  answers_data,
  coalesce(created_at, now())
from backup_user_data.quiz_results
on conflict (id) do update set
  user_id = excluded.user_id,
  total_questions = excluded.total_questions,
  correct_answers = excluded.correct_answers,
  wrong_answers = excluded.wrong_answers,
  unanswered_questions = excluded.unanswered_questions,
  score = excluded.score,
  disciplines = excluded.disciplines,
  questions_data = excluded.questions_data,
  answers_data = excluded.answers_data,
  created_at = excluded.created_at;

insert into public.analytics_events (
  id,
  event_type,
  metadata,
  user_ip,
  user_agent,
  created_at,
  user_id
)
select
  id,
  event_type,
  coalesce(metadata, '{}'::jsonb),
  user_ip,
  user_agent,
  coalesce(created_at, now()),
  user_id
from backup_user_data.analytics_events
on conflict (id) do nothing;

insert into public.community_topics (
  id,
  slug,
  title,
  description,
  created_at,
  updated_at
)
select
  id,
  slug,
  title,
  description,
  coalesce(created_at, now()),
  coalesce(created_at, now())
from backup_user_data.community_topics
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.community_posts (
  id,
  topic_id,
  user_id,
  title,
  content,
  status,
  created_at,
  updated_at,
  last_activity_at
)
select
  id,
  topic_id,
  user_id,
  title,
  content,
  'published'::text,
  coalesce(created_at, now()),
  coalesce(updated_at, created_at, now()),
  greatest(coalesce(updated_at, created_at, now()), coalesce(created_at, now()))
from backup_user_data.community_posts
on conflict (id) do update set
  topic_id = excluded.topic_id,
  user_id = excluded.user_id,
  title = excluded.title,
  content = excluded.content,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  last_activity_at = excluded.last_activity_at;

insert into public.community_comments (
  id,
  post_id,
  user_id,
  content,
  status,
  created_at,
  updated_at
)
select
  id,
  post_id,
  user_id,
  content,
  'visible'::text,
  coalesce(created_at, now()),
  coalesce(created_at, now())
from backup_user_data.community_comments
on conflict (id) do update set
  post_id = excluded.post_id,
  user_id = excluded.user_id,
  content = excluded.content,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.community_post_likes (
  id,
  post_id,
  user_id,
  created_at
)
select
  id,
  post_id,
  user_id,
  coalesce(created_at, now())
from backup_user_data.community_post_likes
on conflict (post_id, user_id) do update set
  created_at = excluded.created_at;

insert into public.cached_themes (
  id,
  tema,
  texto_apoio1,
  texto_apoio2,
  usado_count,
  created_at
)
select
  id,
  tema,
  texto_apoio1,
  texto_apoio2,
  coalesce(usado_count, 0),
  coalesce(created_at, now())
from backup_user_data.cached_themes
on conflict (id) do update set
  tema = excluded.tema,
  texto_apoio1 = excluded.texto_apoio1,
  texto_apoio2 = excluded.texto_apoio2,
  usado_count = excluded.usado_count,
  created_at = excluded.created_at;

insert into public.rate_limits (
  id,
  identifier,
  endpoint,
  request_count,
  window_start,
  created_at
)
select
  id,
  identifier,
  endpoint,
  coalesce(request_count, 1),
  coalesce(window_start, now()),
  coalesce(created_at, now())
from backup_user_data.rate_limits
on conflict (id) do update set
  identifier = excluded.identifier,
  endpoint = excluded.endpoint,
  request_count = excluded.request_count,
  window_start = excluded.window_start,
  created_at = excluded.created_at;

drop schema if exists backup_user_data cascade;

commit;
