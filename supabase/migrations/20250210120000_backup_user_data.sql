begin;

create schema if not exists backup_user_data;
comment on schema backup_user_data is 'Snapshot das tabelas críticas antes da reestruturação completa (2025-02-10).';

drop table if exists backup_user_data.auth_users cascade;
create table backup_user_data.auth_users as
select *
  from auth.users;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_profiles'
  ) then
    drop table if exists backup_user_data.user_profiles cascade;
    create table backup_user_data.user_profiles as
    select *
      from public.user_profiles;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_statistics'
  ) then
    drop table if exists backup_user_data.user_statistics cascade;
    create table backup_user_data.user_statistics as
    select * from public.user_statistics;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_goals'
  ) then
    drop table if exists backup_user_data.user_goals cascade;
    create table backup_user_data.user_goals as
    select * from public.user_goals;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'achievements'
  ) then
    drop table if exists backup_user_data.achievements cascade;
    create table backup_user_data.achievements as
    select * from public.achievements;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_achievements'
  ) then
    drop table if exists backup_user_data.user_achievements cascade;
    create table backup_user_data.user_achievements as
    select * from public.user_achievements;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'essay_results'
  ) then
    drop table if exists backup_user_data.essay_results cascade;
    create table backup_user_data.essay_results as
    select * from public.essay_results;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'quiz_results'
  ) then
    drop table if exists backup_user_data.quiz_results cascade;
    create table backup_user_data.quiz_results as
    select * from public.quiz_results;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'noticias'
  ) then
    drop table if exists backup_user_data.noticias cascade;
    create table backup_user_data.noticias as
    select * from public.noticias;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'analytics_events') then
    drop table if exists backup_user_data.analytics_events cascade;
    create table backup_user_data.analytics_events as select * from public.analytics_events;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'configuracoes') then
    drop table if exists backup_user_data.configuracoes cascade;
    create table backup_user_data.configuracoes as select * from public.configuracoes;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cached_themes') then
    drop table if exists backup_user_data.cached_themes cascade;
    create table backup_user_data.cached_themes as select * from public.cached_themes;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'rate_limits') then
    drop table if exists backup_user_data.rate_limits cascade;
    create table backup_user_data.rate_limits as select * from public.rate_limits;
  end if;
end $$;

commit;
