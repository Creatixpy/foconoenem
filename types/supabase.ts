export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          criteria: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          criteria?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          criteria?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: Database["public"]["Enums"]["event_type_enum"];
          metadata: Json;
          user_ip: string | null;
          user_agent: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          event_type: Database["public"]["Enums"]["event_type_enum"];
          metadata?: Json;
          user_ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          event_type?: Database["public"]["Enums"]["event_type_enum"];
          metadata?: Json;
          user_ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      cached_themes: {
        Row: {
          id: string;
          tema: string;
          texto_apoio1: string;
          texto_apoio2: string;
          usado_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tema: string;
          texto_apoio1: string;
          texto_apoio2: string;
          usado_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tema?: string;
          texto_apoio1?: string;
          texto_apoio2?: string;
          usado_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          status: "visible" | "hidden";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          status?: "visible" | "hidden";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          status?: "visible" | "hidden";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_comments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      community_post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      community_posts: {
        Row: {
          id: string;
          topic_id: string;
          user_id: string;
          title: string;
          content: string;
          status: "published" | "archived";
          created_at: string;
          updated_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          user_id: string;
          title: string;
          content: string;
          status?: "published" | "archived";
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          status?: "published" | "archived";
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "community_topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      community_topics: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      configuracoes: {
        Row: {
          id: string;
          chave: string;
          valor: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chave: string;
          valor: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chave?: string;
          valor?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      essay_results: {
        Row: {
          id: string;
          user_id: string | null;
          nota: number;
          competencia1: Json;
          competencia2: Json;
          competencia3: Json;
          competencia4: Json;
          competencia5: Json;
          feedback_geral: string;
          ponto_fortes: string[];
          pontos_a_melhorar: string[];
          redacao_original: string;
          origem: "IA" | "Simulação";
          tema: string | null;
          texto_apoio1: string | null;
          texto_apoio2: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nota: number;
          competencia1: Json;
          competencia2: Json;
          competencia3: Json;
          competencia4: Json;
          competencia5: Json;
          feedback_geral: string;
          ponto_fortes?: string[];
          pontos_a_melhorar?: string[];
          redacao_original: string;
          origem: "IA" | "Simulação";
          tema?: string | null;
          texto_apoio1?: string | null;
          texto_apoio2?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nota?: number;
          competencia1?: Json;
          competencia2?: Json;
          competencia3?: Json;
          competencia4?: Json;
          competencia5?: Json;
          feedback_geral?: string;
          ponto_fortes?: string[];
          pontos_a_melhorar?: string[];
          redacao_original?: string;
          origem?: "IA" | "Simulação";
          tema?: string | null;
          texto_apoio1?: string | null;
          texto_apoio2?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "essay_results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      noticias: {
        Row: {
          id: string;
          titulo: string;
          slug: string;
          resumo: string;
          conteudo: string;
          imagem_url: string | null;
          autor: string | null;
          data_publicacao: string;
          tags: string[];
          destaque: boolean;
          fonte_url: string | null;
          created_at: string;
          updated_at: string;
          search_vector: unknown;
        };
        Insert: {
          id?: string;
          titulo: string;
          slug: string;
          resumo: string;
          conteudo: string;
          imagem_url?: string | null;
          autor?: string | null;
          data_publicacao?: string;
          tags?: string[];
          destaque?: boolean;
          fonte_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          slug?: string;
          resumo?: string;
          conteudo?: string;
          imagem_url?: string | null;
          autor?: string | null;
          data_publicacao?: string;
          tags?: string[];
          destaque?: boolean;
          fonte_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_results: {
        Row: {
          id: string;
          user_id: string | null;
          total_questions: number;
          correct_answers: number;
          wrong_answers: number;
          unanswered_questions: number;
          score: number;
          disciplines: string[];
          questions_data: Json;
          answers_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          total_questions: number;
          correct_answers: number;
          wrong_answers: number;
          unanswered_questions: number;
          score: number;
          disciplines: string[];
          questions_data: Json;
          answers_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          total_questions?: number;
          correct_answers?: number;
          wrong_answers?: number;
          unanswered_questions?: number;
          score?: number;
          disciplines?: string[];
          questions_data?: Json;
          answers_data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      rate_limits: {
        Row: {
          id: string;
          identifier: string;
          endpoint: string;
          request_count: number;
          window_start: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          endpoint: string;
          request_count?: number;
          window_start?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          endpoint?: string;
          request_count?: number;
          window_start?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          earned_at?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_goals: {
        Row: {
          id: string;
          user_id: string;
          tipo: "redacao_nota_minima" | "questoes_acerto_minimo" | "estudar_disciplina" | "praticar_competencia";
          descricao: string;
          valor_alvo: number | null;
          disciplina: string | null;
          competencia: number | null;
          prazo: string | null;
          concluida: boolean;
          progresso: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tipo: "redacao_nota_minima" | "questoes_acerto_minimo" | "estudar_disciplina" | "praticar_competencia";
          descricao: string;
          valor_alvo?: number | null;
          disciplina?: string | null;
          competencia?: number | null;
          prazo?: string | null;
          concluida?: boolean;
          progresso?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tipo?: "redacao_nota_minima" | "questoes_acerto_minimo" | "estudar_disciplina" | "praticar_competencia";
          descricao?: string;
          valor_alvo?: number | null;
          disciplina?: string | null;
          competencia?: number | null;
          prazo?: string | null;
          concluida?: boolean;
          progresso?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          nome_completo: string | null;
          avatar_url: string | null;
          bio: string | null;
          objetivo: string | null;
          ano_enem: number | null;
          community_tagline: string | null;
          community_profile_theme: string | null;
          community_show_statistics: boolean;
          community_terms_version: string | null;
          community_terms_accepted_at: string | null;
          community_age_confirmed_at: string | null;
          is_over_16: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome_completo?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          objetivo?: string | null;
          ano_enem?: number | null;
          community_tagline?: string | null;
          community_profile_theme?: string | null;
          community_show_statistics?: boolean;
          community_terms_version?: string | null;
          community_terms_accepted_at?: string | null;
          community_age_confirmed_at?: string | null;
          is_over_16?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome_completo?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          objetivo?: string | null;
          ano_enem?: number | null;
          community_tagline?: string | null;
          community_profile_theme?: string | null;
          community_show_statistics?: boolean;
          community_terms_version?: string | null;
          community_terms_accepted_at?: string | null;
          community_age_confirmed_at?: string | null;
          is_over_16?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_statistics: {
        Row: {
          id: string;
          user_id: string;
          total_redacoes: number;
          media_nota_redacao: number | null;
          melhor_nota_redacao: number | null;
          pior_nota_redacao: number | null;
          media_competencia1: number | null;
          media_competencia2: number | null;
          media_competencia3: number | null;
          media_competencia4: number | null;
          media_competencia5: number | null;
          total_simulados: number;
          total_questoes_respondidas: number;
          total_acertos: number;
          total_erros: number;
          taxa_acerto: number | null;
          acertos_matematica: number;
          total_matematica: number;
          acertos_portugues: number;
          total_portugues: number;
          acertos_quimica: number;
          total_quimica: number;
          acertos_fisica: number;
          total_fisica: number;
          acertos_geografia: number;
          total_geografia: number;
          ultima_atualizacao: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_redacoes?: number;
          media_nota_redacao?: number | null;
          melhor_nota_redacao?: number | null;
          pior_nota_redacao?: number | null;
          media_competencia1?: number | null;
          media_competencia2?: number | null;
          media_competencia3?: number | null;
          media_competencia4?: number | null;
          media_competencia5?: number | null;
          total_simulados?: number;
          total_questoes_respondidas?: number;
          total_acertos?: number;
          total_erros?: number;
          taxa_acerto?: number | null;
          acertos_matematica?: number;
          total_matematica?: number;
          acertos_portugues?: number;
          total_portugues?: number;
          acertos_quimica?: number;
          total_quimica?: number;
          acertos_fisica?: number;
          total_fisica?: number;
          acertos_geografia?: number;
          total_geografia?: number;
          ultima_atualizacao?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_redacoes?: number;
          media_nota_redacao?: number | null;
          melhor_nota_redacao?: number | null;
          pior_nota_redacao?: number | null;
          media_competencia1?: number | null;
          media_competencia2?: number | null;
          media_competencia3?: number | null;
          media_competencia4?: number | null;
          media_competencia5?: number | null;
          total_simulados?: number;
          total_questoes_respondidas?: number;
          total_acertos?: number;
          total_erros?: number;
          taxa_acerto?: number | null;
          acertos_matematica?: number;
          total_matematica?: number;
          acertos_portugues?: number;
          total_portugues?: number;
          acertos_quimica?: number;
          total_quimica?: number;
          acertos_fisica?: number;
          total_fisica?: number;
          acertos_geografia?: number;
          total_geografia?: number;
          ultima_atualizacao?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      recalculate_user_statistics: {
        Args: { target_user_id: string };
        Returns: Database["public"]["Tables"]["user_statistics"]["Row"];
      };
      cleanup_old_rate_limits: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      event_type_enum:
        | "essay_submitted"
        | "essay_viewed"
        | "theme_generated"
        | "theme_cached"
        | "quiz_started"
        | "quiz_completed"
        | "page_view"
        | "error_occurred";
    };
  };
}
