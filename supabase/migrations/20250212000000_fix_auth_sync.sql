-- Migration: Fix Auth & Profile Sync

-- 1. Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_nome_completo text;
  v_avatar_url text;
  v_objetivo text;
begin
  -- Extract metadata
  v_nome_completo := new.raw_user_meta_data->>'nome_completo';
  v_avatar_url := new.raw_user_meta_data->>'avatar_url';
  v_objetivo := new.raw_user_meta_data->>'objetivo';

  -- Fallback for name if not in metadata (e.g. Google Auth might put it in full_name)
  if v_nome_completo is null then
    v_nome_completo := new.raw_user_meta_data->>'full_name';
  end if;

  -- Fallback for avatar
  if v_avatar_url is null then
    v_avatar_url := new.raw_user_meta_data->>'avatar_url';
  end if;

  -- Create Profile
  insert into public.user_profiles (user_id, nome_completo, avatar_url, objetivo)
  values (new.id, v_nome_completo, v_avatar_url, v_objetivo)
  on conflict (user_id) do update set
    nome_completo = coalesce(public.user_profiles.nome_completo, excluded.nome_completo),
    avatar_url = coalesce(public.user_profiles.avatar_url, excluded.avatar_url),
    objetivo = coalesce(public.user_profiles.objetivo, excluded.objetivo);

  -- Create Statistics
  insert into public.user_statistics (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 2. Create Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill existing users
do $$
declare
  user_record record;
begin
  for user_record in select * from auth.users loop
    -- Insert profile if missing
    insert into public.user_profiles (user_id, nome_completo, avatar_url, objetivo)
    values (
      user_record.id,
      coalesce(user_record.raw_user_meta_data->>'nome_completo', user_record.raw_user_meta_data->>'full_name'),
      user_record.raw_user_meta_data->>'avatar_url',
      user_record.raw_user_meta_data->>'objetivo'
    )
    on conflict (user_id) do nothing;

    -- Insert stats if missing
    insert into public.user_statistics (user_id)
    values (user_record.id)
    on conflict (user_id) do nothing;
  end loop;
end;
$$;
