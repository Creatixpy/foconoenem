

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE TYPE "public"."event_type_enum" AS ENUM (
    'essay_submitted',
    'essay_viewed',
    'theme_generated',
    'theme_cached',
    'quiz_started',
    'quiz_completed',
    'page_view',
    'error_occurred'
);


ALTER TYPE "public"."event_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_rate_limits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  delete from public.rate_limits
   where window_start < now() - interval '1 hour';
end;
$$;


ALTER FUNCTION "public"."cleanup_old_rate_limits"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_redacoes" integer DEFAULT 0 NOT NULL,
    "media_nota_redacao" numeric,
    "melhor_nota_redacao" integer,
    "pior_nota_redacao" integer,
    "media_competencia1" numeric,
    "media_competencia2" numeric,
    "media_competencia3" numeric,
    "media_competencia4" numeric,
    "media_competencia5" numeric,
    "total_simulados" integer DEFAULT 0 NOT NULL,
    "total_questoes_respondidas" integer DEFAULT 0 NOT NULL,
    "total_acertos" integer DEFAULT 0 NOT NULL,
    "total_erros" integer DEFAULT 0 NOT NULL,
    "taxa_acerto" numeric,
    "acertos_matematica" integer DEFAULT 0 NOT NULL,
    "total_matematica" integer DEFAULT 0 NOT NULL,
    "acertos_portugues" integer DEFAULT 0 NOT NULL,
    "total_portugues" integer DEFAULT 0 NOT NULL,
    "acertos_quimica" integer DEFAULT 0 NOT NULL,
    "total_quimica" integer DEFAULT 0 NOT NULL,
    "acertos_fisica" integer DEFAULT 0 NOT NULL,
    "total_fisica" integer DEFAULT 0 NOT NULL,
    "acertos_geografia" integer DEFAULT 0 NOT NULL,
    "total_geografia" integer DEFAULT 0 NOT NULL,
    "ultima_atualizacao" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_statistics" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_user_statistics"("target_user_id" "uuid") RETURNS "public"."user_statistics"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  requester_role text := auth.role();
  requester_id uuid := auth.uid();
  v_result public.user_statistics;
begin
  if requester_role is distinct from 'service_role' and requester_id is distinct from target_user_id then
    raise exception 'Você só pode atualizar suas próprias estatísticas.' using errcode = '42501';
  end if;

  with essay_stats as (
    select
      count(*)::int as total,
      avg(nota)::numeric as media_nota,
      max(nota)::int as melhor,
      min(nota)::int as pior,
      avg((competencia1->>'nota')::numeric) as media_c1,
      avg((competencia2->>'nota')::numeric) as media_c2,
      avg((competencia3->>'nota')::numeric) as media_c3,
      avg((competencia4->>'nota')::numeric) as media_c4,
      avg((competencia5->>'nota')::numeric) as media_c5
    from public.essay_results
    where user_id = target_user_id
  ),
  quiz_totals as (
    select
      count(*)::int as total_simulados,
      coalesce(sum(total_questions), 0) as total_questoes,
      coalesce(sum(correct_answers), 0) as total_acertos,
      coalesce(sum(wrong_answers), 0) as total_erros
    from public.quiz_results
    where user_id = target_user_id
  ),
  quiz_disciplines as (
    select
      sum(case when discipline = 'Matemática' and user_answer = correct_id then 1 else 0 end)::int as acertos_matematica,
      sum(case when discipline = 'Matemática' then 1 else 0 end)::int as total_matematica,
      sum(case when discipline = 'Português' and user_answer = correct_id then 1 else 0 end)::int as acertos_portugues,
      sum(case when discipline = 'Português' then 1 else 0 end)::int as total_portugues,
      sum(case when discipline = 'Química' and user_answer = correct_id then 1 else 0 end)::int as acertos_quimica,
      sum(case when discipline = 'Química' then 1 else 0 end)::int as total_quimica,
      sum(case when discipline = 'Física' and user_answer = correct_id then 1 else 0 end)::int as acertos_fisica,
      sum(case when discipline = 'Física' then 1 else 0 end)::int as total_fisica,
      sum(case when discipline = 'Geografia' and user_answer = correct_id then 1 else 0 end)::int as acertos_geografia,
      sum(case when discipline = 'Geografia' then 1 else 0 end)::int as total_geografia
    from (
      select
        (question->>'discipline') as discipline,
        (
          select alt->>'id'
            from jsonb_array_elements(question->'alternatives') as alt
           where (alt->>'isCorrect')::boolean
           limit 1
        ) as correct_id,
        (qr.answers_data ->> (question->>'id')) as user_answer
      from public.quiz_results qr
      cross join lateral jsonb_array_elements(qr.questions_data) as question
      where qr.user_id = target_user_id
    ) expanded
  )
  insert into public.user_statistics as us (
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
    target_user_id,
    coalesce(es.total, 0),
    es.media_nota,
    es.melhor,
    es.pior,
    es.media_c1,
    es.media_c2,
    es.media_c3,
    es.media_c4,
    es.media_c5,
    qt.total_simulados,
    qt.total_questoes,
    qt.total_acertos,
    qt.total_erros,
    case when qt.total_questoes > 0
      then (qt.total_acertos::numeric / qt.total_questoes::numeric) * 100
      else null
    end,
    coalesce(qd.acertos_matematica, 0),
    coalesce(qd.total_matematica, 0),
    coalesce(qd.acertos_portugues, 0),
    coalesce(qd.total_portugues, 0),
    coalesce(qd.acertos_quimica, 0),
    coalesce(qd.total_quimica, 0),
    coalesce(qd.acertos_fisica, 0),
    coalesce(qd.total_fisica, 0),
    coalesce(qd.acertos_geografia, 0),
    coalesce(qd.total_geografia, 0),
    now()
  from essay_stats es
  cross join quiz_totals qt
  cross join quiz_disciplines qd
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
    ultima_atualizacao = excluded.ultima_atualizacao
  returning * into v_result;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."recalculate_user_statistics"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "criteria" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_type" "public"."event_type_enum" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "user_ip" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cached_themes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tema" "text" NOT NULL,
    "texto_apoio1" "text" NOT NULL,
    "texto_apoio2" "text" NOT NULL,
    "usado_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cached_themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chave" "text" NOT NULL,
    "valor" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."configuracoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essay_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "nota" smallint NOT NULL,
    "competencia1" "jsonb" NOT NULL,
    "competencia2" "jsonb" NOT NULL,
    "competencia3" "jsonb" NOT NULL,
    "competencia4" "jsonb" NOT NULL,
    "competencia5" "jsonb" NOT NULL,
    "feedback_geral" "text" NOT NULL,
    "ponto_fortes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "pontos_a_melhorar" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "redacao_original" "text" NOT NULL,
    "origem" "text" NOT NULL,
    "tema" "text",
    "texto_apoio1" "text",
    "texto_apoio2" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "essay_results_nota_check" CHECK ((("nota" >= 0) AND ("nota" <= 1000))),
    CONSTRAINT "essay_results_origem_check" CHECK (("origem" = ANY (ARRAY['IA'::"text", 'Simulação'::"text"])))
);


ALTER TABLE "public"."essay_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."noticias" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "titulo" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "resumo" "text" NOT NULL,
    "conteudo" "text" NOT NULL,
    "imagem_url" "text",
    "autor" "text",
    "data_publicacao" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "destaque" boolean DEFAULT false NOT NULL,
    "fonte_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector" GENERATED ALWAYS AS ((("setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("titulo", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("resumo", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("conteudo", ''::"text")), 'C'::"char"))) STORED
);


ALTER TABLE "public"."noticias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "total_questions" integer NOT NULL,
    "correct_answers" integer NOT NULL,
    "wrong_answers" integer NOT NULL,
    "unanswered_questions" integer NOT NULL,
    "score" integer NOT NULL,
    "disciplines" "text"[] NOT NULL,
    "questions_data" "jsonb" NOT NULL,
    "answers_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quiz_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "identifier" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "request_count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb"
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "valor_alvo" numeric,
    "disciplina" "text",
    "competencia" smallint,
    "prazo" "date",
    "concluida" boolean DEFAULT false NOT NULL,
    "progresso" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_goals_tipo_check" CHECK (("tipo" = ANY (ARRAY['redacao_nota_minima'::"text", 'questoes_acerto_minimo'::"text", 'estudar_disciplina'::"text", 'praticar_competencia'::"text"])))
);


ALTER TABLE "public"."user_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome_completo" "text",
    "avatar_url" "text",
    "bio" "text",
    "objetivo" "text",
    "ano_enem" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_slug_key" UNIQUE ("slug");


ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."cached_themes"
    ADD CONSTRAINT "cached_themes_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_chave_key" UNIQUE ("chave");


ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."essay_results"
    ADD CONSTRAINT "essay_results_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."noticias"
    ADD CONSTRAINT "noticias_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."noticias"
    ADD CONSTRAINT "noticias_slug_key" UNIQUE ("slug");


ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_achievement_key" UNIQUE ("user_id", "achievement_id");


ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");


ALTER TABLE ONLY "public"."user_statistics"
    ADD CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."user_statistics"
    ADD CONSTRAINT "user_statistics_user_id_key" UNIQUE ("user_id");


CREATE INDEX "idx_analytics_events_type" ON "public"."analytics_events" USING "btree" ("event_type", "created_at" DESC);


CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events" USING "btree" ("user_id");


CREATE INDEX "idx_cached_themes_usado" ON "public"."cached_themes" USING "btree" ("usado_count", "created_at" DESC);


CREATE INDEX "idx_essay_results_created" ON "public"."essay_results" USING "btree" ("created_at" DESC);


CREATE INDEX "idx_essay_results_user" ON "public"."essay_results" USING "btree" ("user_id", "created_at" DESC);


CREATE INDEX "idx_noticias_destaque" ON "public"."noticias" USING "btree" ("destaque", "data_publicacao" DESC);


CREATE INDEX "idx_noticias_published_at" ON "public"."noticias" USING "btree" ("data_publicacao" DESC);


CREATE INDEX "idx_noticias_search" ON "public"."noticias" USING "gin" ("search_vector");


CREATE INDEX "idx_quiz_results_user" ON "public"."quiz_results" USING "btree" ("user_id", "created_at" DESC);


CREATE INDEX "idx_rate_limits_identifier_endpoint" ON "public"."rate_limits" USING "btree" ("identifier", "endpoint", "window_start");


CREATE INDEX "idx_user_achievements_achievement" ON "public"."user_achievements" USING "btree" ("achievement_id");


CREATE INDEX "idx_user_achievements_user" ON "public"."user_achievements" USING "btree" ("user_id");


CREATE INDEX "idx_user_goals_status" ON "public"."user_goals" USING "btree" ("user_id", "concluida");


CREATE INDEX "idx_user_goals_user" ON "public"."user_goals" USING "btree" ("user_id", "created_at" DESC);


CREATE INDEX "idx_user_profiles_created_at" ON "public"."user_profiles" USING "btree" ("created_at" DESC);


CREATE INDEX "idx_user_profiles_user" ON "public"."user_profiles" USING "btree" ("user_id");


CREATE INDEX "idx_user_statistics_user" ON "public"."user_statistics" USING "btree" ("user_id");


CREATE OR REPLACE TRIGGER "trg_configuracoes_updated_at" BEFORE UPDATE ON "public"."configuracoes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


CREATE OR REPLACE TRIGGER "trg_essay_results_updated_at" BEFORE UPDATE ON "public"."essay_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


CREATE OR REPLACE TRIGGER "trg_noticias_updated_at" BEFORE UPDATE ON "public"."noticias" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


CREATE OR REPLACE TRIGGER "trg_user_goals_updated_at" BEFORE UPDATE ON "public"."user_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


CREATE OR REPLACE TRIGGER "trg_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."essay_results"
    ADD CONSTRAINT "essay_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "quiz_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."user_statistics"
    ADD CONSTRAINT "user_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "achievements_manage" ON "public"."achievements" TO "service_role" USING (true) WITH CHECK (true);


CREATE POLICY "achievements_select_public" ON "public"."achievements" FOR SELECT USING (true);


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analytics_insert_authenticated" ON "public"."analytics_events" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"())::"text" = COALESCE(("metadata" ->> 'user_id'::"text"), ("auth"."uid"())::"text")));


CREATE POLICY "analytics_insert_service" ON "public"."analytics_events" FOR INSERT TO "service_role" WITH CHECK (true);


CREATE POLICY "analytics_select_service" ON "public"."analytics_events" FOR SELECT TO "service_role" USING (true);


ALTER TABLE "public"."cached_themes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cached_themes_service" ON "public"."cached_themes" TO "service_role" USING (true) WITH CHECK (true);


ALTER TABLE "public"."configuracoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "configuracoes_service_only" ON "public"."configuracoes" TO "service_role" USING (true) WITH CHECK (true);


ALTER TABLE "public"."essay_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "essay_results_mutate" ON "public"."essay_results" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "essay_results_select" ON "public"."essay_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


CREATE POLICY "essay_results_service" ON "public"."essay_results" TO "service_role" USING (true) WITH CHECK (true);


ALTER TABLE "public"."noticias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "noticias_manage_service" ON "public"."noticias" TO "service_role" USING (true) WITH CHECK (true);


CREATE POLICY "noticias_select_public" ON "public"."noticias" FOR SELECT USING (true);


ALTER TABLE "public"."quiz_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_results_mutate" ON "public"."quiz_results" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "quiz_results_select" ON "public"."quiz_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


CREATE POLICY "quiz_results_service" ON "public"."quiz_results" TO "service_role" USING (true) WITH CHECK (true);


ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_limits_public" ON "public"."rate_limits" USING (true) WITH CHECK (true);


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_achievements_delete" ON "public"."user_achievements" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));


CREATE POLICY "user_achievements_insert" ON "public"."user_achievements" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "user_achievements_select" ON "public"."user_achievements" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "user_achievements_service" ON "public"."user_achievements" TO "service_role" USING (true) WITH CHECK (true);


ALTER TABLE "public"."user_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_goals_mutate" ON "public"."user_goals" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "user_goals_select" ON "public"."user_goals" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


CREATE POLICY "user_goals_service" ON "public"."user_goals" TO "service_role" USING (true) WITH CHECK (true);


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_delete" ON "public"."user_profiles" FOR DELETE TO "service_role" USING (true);


CREATE POLICY "user_profiles_insert" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "user_profiles_select" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "user_profiles_update" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


ALTER TABLE "public"."user_statistics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_statistics_mutate" ON "public"."user_statistics" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "user_statistics_select" ON "public"."user_statistics" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


CREATE POLICY "user_statistics_service" ON "public"."user_statistics" TO "service_role" USING (true) WITH CHECK (true);


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limits"() TO "service_role";


GRANT ALL ON TABLE "public"."user_statistics" TO "anon";
GRANT ALL ON TABLE "public"."user_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_statistics" TO "service_role";


GRANT ALL ON FUNCTION "public"."recalculate_user_statistics"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_user_statistics"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_user_statistics"("target_user_id" "uuid") TO "service_role";


GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";


GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";


GRANT ALL ON TABLE "public"."cached_themes" TO "anon";
GRANT ALL ON TABLE "public"."cached_themes" TO "authenticated";
GRANT ALL ON TABLE "public"."cached_themes" TO "service_role";


GRANT ALL ON TABLE "public"."configuracoes" TO "anon";
GRANT ALL ON TABLE "public"."configuracoes" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracoes" TO "service_role";


GRANT ALL ON TABLE "public"."essay_results" TO "anon";
GRANT ALL ON TABLE "public"."essay_results" TO "authenticated";
GRANT ALL ON TABLE "public"."essay_results" TO "service_role";


GRANT ALL ON TABLE "public"."noticias" TO "anon";
GRANT ALL ON TABLE "public"."noticias" TO "authenticated";
GRANT ALL ON TABLE "public"."noticias" TO "service_role";


GRANT ALL ON TABLE "public"."quiz_results" TO "anon";
GRANT ALL ON TABLE "public"."quiz_results" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_results" TO "service_role";


GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";


GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";


GRANT ALL ON TABLE "public"."user_goals" TO "anon";
GRANT ALL ON TABLE "public"."user_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_goals" TO "service_role";


GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


