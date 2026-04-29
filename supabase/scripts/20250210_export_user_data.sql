-- Executar com `psql` conectado ao banco remoto.
-- Define diretório base para os CSVs
\set output_dir 'backups/2025-02-10'
\! mkdir -p :output_dir

-- Exporta tabelas críticas ainda ativas no schema atual.
\copy (select * from auth.users order by created_at nulls last) to :'output_dir'/auth.users.csv csv header;
\copy (select * from public.user_profiles order by created_at) to :'output_dir'/user_profiles.csv csv header;
\copy (select * from public.user_statistics order by user_id) to :'output_dir'/user_statistics.csv csv header;
\copy (select * from public.essay_results order by created_at desc) to :'output_dir'/essay_results.csv csv header;
\copy (select * from public.quiz_results order by created_at desc) to :'output_dir'/quiz_results.csv csv header;
\copy (select * from public.noticias order by data_publicacao desc) to :'output_dir'/noticias.csv csv header;
\copy (select * from public.analytics_events order by created_at desc) to :'output_dir'/analytics_events.csv csv header;
\copy (select * from public.configuracoes order by created_at) to :'output_dir'/configuracoes.csv csv header;
\copy (select * from public.donation_checkouts order by created_at desc) to :'output_dir'/donation_checkouts.csv csv header;
\copy (select * from public.stripe_webhook_events order by received_at desc) to :'output_dir'/stripe_webhook_events.csv csv header;
\copy (select * from public.subscriptions order by created_at desc) to :'output_dir'/subscriptions.csv csv header;
\copy (select * from public.subscription_events order by received_at desc) to :'output_dir'/subscription_events.csv csv header;
