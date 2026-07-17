begin;

delete from public.achievements
where slug in ('mentor_comunitario', 'primeiro_post');

alter table if exists public.user_profiles
  drop column if exists community_tagline,
  drop column if exists community_profile_theme,
  drop column if exists community_show_statistics,
  drop column if exists community_terms_version,
  drop column if exists community_terms_accepted_at,
  drop column if exists community_age_confirmed_at,
  drop column if exists is_over_16;

drop table if exists public.community_post_likes cascade;
drop table if exists public.community_comments cascade;
drop table if exists public.community_posts cascade;
drop table if exists public.community_topics cascade;

drop table if exists backup_user_data.community_post_likes cascade;
drop table if exists backup_user_data.community_comments cascade;
drop table if exists backup_user_data.community_posts cascade;
drop table if exists backup_user_data.community_topics cascade;

commit;;
