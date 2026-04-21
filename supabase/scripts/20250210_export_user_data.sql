-- Executar com `psql` ou `npx supabase db remote commit --file supabase/scripts/20250210_export_user_data.sql`
-- Define diretório base para os CSVs
\set output_dir 'backups/2025-02-10'
\! mkdir -p :output_dir

-- Exporta tabelas críticas
\copy (select * from auth.users order by created_at nulls last) to :'output_dir'/auth.users.csv csv header;
\copy (select * from public.user_profiles order by created_at) to :'output_dir'/user_profiles.csv csv header;
\copy (select * from public.user_statistics order by user_id) to :'output_dir'/user_statistics.csv csv header;
\copy (select * from public.user_goals order by created_at) to :'output_dir'/user_goals.csv csv header;
\copy (select * from public.achievements order by created_at) to :'output_dir'/achievements.csv csv header;
\copy (select * from public.user_achievements order by earned_at desc) to :'output_dir'/user_achievements.csv csv header;
\copy (select * from public.essay_results order by created_at desc) to :'output_dir'/essay_results.csv csv header;
\copy (select * from public.quiz_results order by created_at desc) to :'output_dir'/quiz_results.csv csv header;
\copy (select * from public.noticias order by data_publicacao desc) to :'output_dir'/noticias.csv csv header;
\copy (select * from public.analytics_events order by created_at desc) to :'output_dir'/analytics_events.csv csv header;
\copy (select * from public.configuracoes order by created_at) to :'output_dir'/configuracoes.csv csv header;
