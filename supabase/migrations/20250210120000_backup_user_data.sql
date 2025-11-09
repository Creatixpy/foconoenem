begin;

create schema if not exists backup_user_data;
comment on schema backup_user_data is 'Snapshot das tabelas críticas antes da reestruturação completa (2025-02-10).';

drop table if exists backup_user_data.auth_users cascade;
create table backup_user_data.auth_users as
select *
  from auth.users;

drop table if exists backup_user_data.user_profiles cascade;
create table backup_user_data.user_profiles as
select *
  from public.user_profiles;

drop table if exists backup_user_data.user_statistics cascade;
create table backup_user_data.user_statistics as
select *
  from public.user_statistics;

drop table if exists backup_user_data.user_goals cascade;
create table backup_user_data.user_goals as
select *
  from public.user_goals;

drop table if exists backup_user_data.achievements cascade;
create table backup_user_data.achievements as
select *
  from public.achievements;

drop table if exists backup_user_data.user_achievements cascade;
create table backup_user_data.user_achievements as
select *
  from public.user_achievements;

drop table if exists backup_user_data.essay_results cascade;
create table backup_user_data.essay_results as
select *
  from public.essay_results;

drop table if exists backup_user_data.quiz_results cascade;
create table backup_user_data.quiz_results as
select *
  from public.quiz_results;

drop table if exists backup_user_data.noticias cascade;
create table backup_user_data.noticias as
select *
  from public.noticias;

drop table if exists backup_user_data.community_topics cascade;
create table backup_user_data.community_topics as
select *
  from public.community_topics;

drop table if exists backup_user_data.community_posts cascade;
create table backup_user_data.community_posts as
select *
  from public.community_posts;

drop table if exists backup_user_data.community_comments cascade;
create table backup_user_data.community_comments as
select *
  from public.community_comments;

drop table if exists backup_user_data.community_post_likes cascade;
create table backup_user_data.community_post_likes as
select *
  from public.community_post_likes;

drop table if exists backup_user_data.analytics_events cascade;
create table backup_user_data.analytics_events as
select *
  from public.analytics_events;

drop table if exists backup_user_data.configuracoes cascade;
create table backup_user_data.configuracoes as
select *
  from public.configuracoes;

drop table if exists backup_user_data.cached_themes cascade;
create table backup_user_data.cached_themes as
select *
  from public.cached_themes;

drop table if exists backup_user_data.rate_limits cascade;
create table backup_user_data.rate_limits as
select *
  from public.rate_limits;

commit;
