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
      achievements: {
        Row: {
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
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
          id: string
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          usado_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          tema: string
          texto_apoio1: string
          texto_apoio2: string
          usado_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          tema?: string
          texto_apoio1?: string
          texto_apoio2?: string
          usado_count?: number
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          last_activity_at: string
          status: string
          title: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_activity_at?: string
          status?: string
          title: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          status?: string
          title?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "community_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      community_topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
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
      generated_questions: {
        Row: {
          alternatives: Json
          content: string
          created_at: string | null
          difficulty: string | null
          discipline: string
          explanation: string | null
          id: string
          topic: string | null
        }
        Insert: {
          alternatives: Json
          content: string
          created_at?: string | null
          difficulty?: string | null
          discipline: string
          explanation?: string | null
          id?: string
          topic?: string | null
        }
        Update: {
          alternatives?: Json
          content?: string
          created_at?: string | null
          difficulty?: string | null
          discipline?: string
          explanation?: string | null
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
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          competencia: number | null
          concluida: boolean
          created_at: string
          descricao: string
          disciplina: string | null
          id: string
          prazo: string | null
          progresso: number
          tipo: string
          updated_at: string
          user_id: string
          valor_alvo: number | null
        }
        Insert: {
          competencia?: number | null
          concluida?: boolean
          created_at?: string
          descricao: string
          disciplina?: string | null
          id?: string
          prazo?: string | null
          progresso?: number
          tipo: string
          updated_at?: string
          user_id: string
          valor_alvo?: number | null
        }
        Update: {
          competencia?: number | null
          concluida?: boolean
          created_at?: string
          descricao?: string
          disciplina?: string | null
          id?: string
          prazo?: string | null
          progresso?: number
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ano_enem: number | null
          avatar_url: string | null
          bio: string | null
          community_age_confirmed_at: string | null
          community_profile_theme: string | null
          community_show_statistics: boolean
          community_tagline: string | null
          community_terms_accepted_at: string | null
          community_terms_version: string | null
          created_at: string
          id: string
          is_over_16: boolean | null
          nome_completo: string | null
          objetivo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano_enem?: number | null
          avatar_url?: string | null
          bio?: string | null
          community_age_confirmed_at?: string | null
          community_profile_theme?: string | null
          community_show_statistics?: boolean
          community_tagline?: string | null
          community_terms_accepted_at?: string | null
          community_terms_version?: string | null
          created_at?: string
          id?: string
          is_over_16?: boolean | null
          nome_completo?: string | null
          objetivo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano_enem?: number | null
          avatar_url?: string | null
          bio?: string | null
          community_age_confirmed_at?: string | null
          community_profile_theme?: string | null
          community_show_statistics?: boolean
          community_tagline?: string | null
          community_terms_accepted_at?: string | null
          community_terms_version?: string | null
          created_at?: string
          id?: string
          is_over_16?: boolean | null
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
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
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
