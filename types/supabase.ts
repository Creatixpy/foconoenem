export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id: string
          metadata: Json
          user_agent: string | null
          user_id: string | null
          user_ip: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Relationships: []
      }
      cached_themes: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          owner_user_id: string | null
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          updated_at: string
          usado_count: number
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          owner_user_id?: string | null
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          updated_at?: string
          usado_count?: number
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          owner_user_id?: string | null
          tema?: string
          texto_apoio1?: string
          texto_apoio2?: string
          updated_at?: string
          usado_count?: number
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      donation_checkouts: {
        Row: {
          amount_cents: number
          checkout_url: string | null
          client_reference_id: string
          completed_at: string | null
          created_at: string
          currency: string
          donor_email: string | null
          donor_name: string | null
          expires_at: string | null
          failure_reason: string | null
          id: string
          latest_event_created_at: string | null
          latest_event_id: string | null
          latest_event_type: string | null
          metadata: Json
          paid_at: string | null
          request_ip: string | null
          request_user_agent: string | null
          session_payload: Json
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_details: Json | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          checkout_url?: string | null
          client_reference_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          latest_event_created_at?: string | null
          latest_event_id?: string | null
          latest_event_type?: string | null
          metadata?: Json
          paid_at?: string | null
          request_ip?: string | null
          request_user_agent?: string | null
          session_payload?: Json
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_details?: Json | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          checkout_url?: string | null
          client_reference_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          latest_event_created_at?: string | null
          latest_event_id?: string | null
          latest_event_type?: string | null
          metadata?: Json
          paid_at?: string | null
          request_ip?: string | null
          request_user_agent?: string | null
          session_payload?: Json
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_details?: Json | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      essay_results: {
        Row: {
          competencia1: Json
          competencia2: Json
          competencia3: Json
          competencia4: Json
          competencia5: Json
          created_at: string
          feedback_geral: string
          id: string
          nota: number
          origem: string
          ponto_fortes: string[]
          pontos_a_melhorar: string[]
          redacao_original: string
          tema: string | null
          texto_apoio1: string | null
          texto_apoio2: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          competencia1: Json
          competencia2: Json
          competencia3: Json
          competencia4: Json
          competencia5: Json
          created_at?: string
          feedback_geral: string
          id?: string
          nota: number
          origem: string
          ponto_fortes?: string[]
          pontos_a_melhorar?: string[]
          redacao_original: string
          tema?: string | null
          texto_apoio1?: string | null
          texto_apoio2?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          competencia1?: Json
          competencia2?: Json
          competencia3?: Json
          competencia4?: Json
          competencia5?: Json
          created_at?: string
          feedback_geral?: string
          id?: string
          nota?: number
          origem?: string
          ponto_fortes?: string[]
          pontos_a_melhorar?: string[]
          redacao_original?: string
          tema?: string | null
          texto_apoio1?: string | null
          texto_apoio2?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      essay_submissions: {
        Row: {
          created_at: string
          error_message: string | null
          input_fingerprint: string
          result_id: string | null
          status: string
          submission_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          input_fingerprint: string
          result_id?: string | null
          status?: string
          submission_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          input_fingerprint?: string
          result_id?: string | null
          status?: string
          submission_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_submissions_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "essay_results"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_questions: {
        Row: {
          alternatives: Json
          content: string
          created_at: string
          difficulty: string | null
          discipline: string
          explanation: string
          fingerprint: string
          id: string
          topic: string | null
        }
        Insert: {
          alternatives: Json
          content: string
          created_at?: string
          difficulty?: string | null
          discipline: string
          explanation: string
          fingerprint: string
          id?: string
          topic?: string | null
        }
        Update: {
          alternatives?: Json
          content?: string
          created_at?: string
          difficulty?: string | null
          discipline?: string
          explanation?: string
          fingerprint?: string
          id?: string
          topic?: string | null
        }
        Relationships: []
      }
      noticias: {
        Row: {
          autor: string | null
          conteudo: string
          created_at: string
          data_publicacao: string
          destaque: boolean
          fonte_url: string | null
          id: string
          imagem_url: string | null
          resumo: string
          search_vector: unknown
          slug: string
          status: string
          tags: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          conteudo: string
          created_at?: string
          data_publicacao?: string
          destaque?: boolean
          fonte_url?: string | null
          id?: string
          imagem_url?: string | null
          resumo: string
          search_vector?: unknown
          slug: string
          status?: string
          tags?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          conteudo?: string
          created_at?: string
          data_publicacao?: string
          destaque?: boolean
          fonte_url?: string | null
          id?: string
          imagem_url?: string | null
          resumo?: string
          search_vector?: unknown
          slug?: string
          status?: string
          tags?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempt_questions: {
        Row: {
          attempt_id: string
          position: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          position: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "generated_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          consumed_at: string | null
          created_at: string
          disciplines: string[]
          expires_at: string
          id: string
          quiz_result_id: string | null
          request_id: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          disciplines?: string[]
          expires_at?: string
          id?: string
          quiz_result_id?: string | null
          request_id: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          disciplines?: string[]
          expires_at?: string
          id?: string
          quiz_result_id?: string | null
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_result_id_fkey"
            columns: ["quiz_result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answers_data: Json
          correct_answers: number
          created_at: string
          disciplines: string[]
          id: string
          questions_data: Json
          score: number
          total_questions: number
          unanswered_questions: number
          user_id: string | null
          wrong_answers: number
        }
        Insert: {
          answers_data: Json
          correct_answers: number
          created_at?: string
          disciplines: string[]
          id?: string
          questions_data: Json
          score: number
          total_questions: number
          unanswered_questions: number
          user_id?: string | null
          wrong_answers: number
        }
        Update: {
          answers_data?: Json
          correct_answers?: number
          created_at?: string
          disciplines?: string[]
          id?: string
          questions_data?: Json
          score?: number
          total_questions?: number
          unanswered_questions?: number
          user_id?: string | null
          wrong_answers?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          api_version: string | null
          checkout_session_id: string | null
          client_reference_id: string | null
          error_message: string | null
          event_created_at: string
          event_type: string
          id: string
          livemode: boolean
          payload: Json
          processed_at: string | null
          received_at: string
          status: string
          stripe_event_id: string
          updated_at: string
        }
        Insert: {
          api_version?: string | null
          checkout_session_id?: string | null
          client_reference_id?: string | null
          error_message?: string | null
          event_created_at: string
          event_type: string
          id?: string
          livemode?: boolean
          payload: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_event_id: string
          updated_at?: string
        }
        Update: {
          api_version?: string | null
          checkout_session_id?: string | null
          client_reference_id?: string | null
          error_message?: string | null
          event_created_at?: string
          event_type?: string
          id?: string
          livemode?: boolean
          payload?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_event_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_client_reference_id_fkey"
            columns: ["client_reference_id"]
            isOneToOne: false
            referencedRelation: "donation_checkouts"
            referencedColumns: ["client_reference_id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          api_version: string | null
          error_message: string | null
          event_created_at: string
          event_type: string
          id: string
          livemode: boolean
          payload: Json
          processed_at: string | null
          received_at: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_event_id: string
          stripe_subscription_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_version?: string | null
          error_message?: string | null
          event_created_at: string
          event_type: string
          id?: string
          livemode?: boolean
          payload: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_event_id: string
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_version?: string | null
          error_message?: string | null
          event_created_at?: string
          event_type?: string
          id?: string
          livemode?: boolean
          payload?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          latest_checkout_expires_at: string | null
          latest_checkout_session_id: string | null
          metadata: Json
          plan_code: string
          plan_name: string
          provider: string
          renews_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          latest_checkout_expires_at?: string | null
          latest_checkout_session_id?: string | null
          metadata?: Json
          plan_code?: string
          plan_name?: string
          provider?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          latest_checkout_expires_at?: string | null
          latest_checkout_session_id?: string | null
          metadata?: Json
          plan_code?: string
          plan_name?: string
          provider?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ano_enem: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          nome_completo: string | null
          objetivo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano_enem?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          nome_completo?: string | null
          objetivo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano_enem?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          nome_completo?: string | null
          objetivo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          acertos_fisica: number
          acertos_geografia: number
          acertos_matematica: number
          acertos_portugues: number
          acertos_quimica: number
          id: string
          media_competencia1: number | null
          media_competencia2: number | null
          media_competencia3: number | null
          media_competencia4: number | null
          media_competencia5: number | null
          media_nota_redacao: number | null
          melhor_nota_redacao: number | null
          pior_nota_redacao: number | null
          taxa_acerto: number | null
          total_acertos: number
          total_erros: number
          total_fisica: number
          total_geografia: number
          total_matematica: number
          total_portugues: number
          total_questoes_respondidas: number
          total_quimica: number
          total_redacoes: number
          total_simulados: number
          ultima_atualizacao: string
          user_id: string
        }
        Insert: {
          acertos_fisica?: number
          acertos_geografia?: number
          acertos_matematica?: number
          acertos_portugues?: number
          acertos_quimica?: number
          id?: string
          media_competencia1?: number | null
          media_competencia2?: number | null
          media_competencia3?: number | null
          media_competencia4?: number | null
          media_competencia5?: number | null
          media_nota_redacao?: number | null
          melhor_nota_redacao?: number | null
          pior_nota_redacao?: number | null
          taxa_acerto?: number | null
          total_acertos?: number
          total_erros?: number
          total_fisica?: number
          total_geografia?: number
          total_matematica?: number
          total_portugues?: number
          total_questoes_respondidas?: number
          total_quimica?: number
          total_redacoes?: number
          total_simulados?: number
          ultima_atualizacao?: string
          user_id: string
        }
        Update: {
          acertos_fisica?: number
          acertos_geografia?: number
          acertos_matematica?: number
          acertos_portugues?: number
          acertos_quimica?: number
          id?: string
          media_competencia1?: number | null
          media_competencia2?: number | null
          media_competencia3?: number | null
          media_competencia4?: number | null
          media_competencia5?: number | null
          media_nota_redacao?: number | null
          melhor_nota_redacao?: number | null
          pior_nota_redacao?: number | null
          taxa_acerto?: number | null
          total_acertos?: number
          total_erros?: number
          total_fisica?: number
          total_geografia?: number
          total_matematica?: number
          total_portugues?: number
          total_questoes_respondidas?: number
          total_quimica?: number
          total_redacoes?: number
          total_simulados?: number
          ultima_atualizacao?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_cached_theme: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          fingerprint: string
          id: string
          owner_user_id: string | null
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          updated_at: string
          usado_count: number
        }
        SetofOptions: {
          from: "*"
          to: "cached_themes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_donation_event: { Args: { p_event: Json }; Returns: string }
      claim_essay_submission: {
        Args: {
          p_input_fingerprint: string
          p_submission_id: string
          p_user_id: string
        }
        Returns: Json
      }
      claim_subscription_event: { Args: { p_event: Json }; Returns: string }
      complete_essay_submission: {
        Args: {
          p_input_fingerprint: string
          p_result: Json
          p_submission_id: string
          p_user_id: string
        }
        Returns: {
          competencia1: Json
          competencia2: Json
          competencia3: Json
          competencia4: Json
          competencia5: Json
          created_at: string
          feedback_geral: string
          id: string
          nota: number
          origem: string
          ponto_fortes: string[]
          pontos_a_melhorar: string[]
          redacao_original: string
          tema: string | null
          texto_apoio1: string | null
          texto_apoio2: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "essay_results"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consume_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      create_quiz_attempt: {
        Args: {
          p_question_ids: string[]
          p_request_id: string
          p_ttl_minutes?: number
          p_user_id: string
        }
        Returns: {
          consumed_at: string | null
          created_at: string
          disciplines: string[]
          expires_at: string
          id: string
          quiz_result_id: string | null
          request_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fail_essay_submission: {
        Args: {
          p_error_message: string
          p_input_fingerprint: string
          p_submission_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_balanced_questions: {
        Args: { p_disciplines: string[]; p_limit_per_discipline?: number }
        Returns: {
          alternatives: Json
          content: string
          created_at: string
          difficulty: string | null
          discipline: string
          explanation: string
          fingerprint: string
          id: string
          topic: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "generated_questions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_cached_theme: {
        Args: { p_theme_id: string; p_user_id: string }
        Returns: {
          created_at: string
          fingerprint: string
          id: string
          owner_user_id: string | null
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          updated_at: string
          usado_count: number
        }
        SetofOptions: {
          from: "*"
          to: "cached_themes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recalculate_user_statistics: {
        Args: { target_user_id: string }
        Returns: {
          acertos_fisica: number
          acertos_geografia: number
          acertos_matematica: number
          acertos_portugues: number
          acertos_quimica: number
          id: string
          media_competencia1: number | null
          media_competencia2: number | null
          media_competencia3: number | null
          media_competencia4: number | null
          media_competencia5: number | null
          media_nota_redacao: number | null
          melhor_nota_redacao: number | null
          pior_nota_redacao: number | null
          taxa_acerto: number | null
          total_acertos: number
          total_erros: number
          total_fisica: number
          total_geografia: number
          total_matematica: number
          total_portugues: number
          total_questoes_respondidas: number
          total_quimica: number
          total_redacoes: number
          total_simulados: number
          ultima_atualizacao: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_statistics"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_news_highlights: { Args: { p_ids: string[] }; Returns: string[] }
      run_maintenance_task: {
        Args: { p_task: string }
        Returns: {
          deleted: number
          ran: boolean
          ran_at: string
        }[]
      }
      submit_quiz_attempt: {
        Args: {
          p_attempt_id: string
          p_selected_answers: Json
          p_user_id: string
        }
        Returns: {
          answers_data: Json
          correct_answers: number
          created_at: string
          disciplines: string[]
          id: string
          questions_data: Json
          score: number
          total_questions: number
          unanswered_questions: number
          user_id: string | null
          wrong_answers: number
        }
        SetofOptions: {
          from: "*"
          to: "quiz_results"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_cached_theme: {
        Args: { p_private: boolean; p_theme: Json; p_user_id: string }
        Returns: {
          created_at: string
          fingerprint: string
          id: string
          owner_user_id: string | null
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          updated_at: string
          usado_count: number
        }
        SetofOptions: {
          from: "*"
          to: "cached_themes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_generated_question: {
        Args: { p_question: Json }
        Returns: {
          alternatives: Json
          content: string
          created_at: string
          difficulty: string | null
          discipline: string
          explanation: string
          fingerprint: string
          id: string
          topic: string | null
        }
        SetofOptions: {
          from: "*"
          to: "generated_questions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      event_type_enum:
        | "essay_submitted"
        | "essay_viewed"
        | "theme_generated"
        | "theme_cached"
        | "quiz_started"
        | "quiz_completed"
        | "page_view"
        | "error_occurred"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type_enum: [
        "essay_submitted",
        "essay_viewed",
        "theme_generated",
        "theme_cached",
        "quiz_started",
        "quiz_completed",
        "page_view",
        "error_occurred",
      ],
    },
  },
} as const

