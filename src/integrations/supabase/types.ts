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
      automated_messages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message_content: string
          message_title: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_content: string
          message_title: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_content?: string
          message_title?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string | null
          data_checkin: string | null
          foto_url: string | null
          id: string
          medidas: Json | null
          notas: string | null
          peso_atual: number | null
          semana_numero: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_checkin?: string | null
          foto_url?: string | null
          id?: string
          medidas?: Json | null
          notas?: string | null
          peso_atual?: number | null
          semana_numero?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_checkin?: string | null
          foto_url?: string | null
          id?: string
          medidas?: Json | null
          notas?: string | null
          peso_atual?: number | null
          semana_numero?: number | null
          user_id?: string
        }
        Relationships: []
      }
      conversas: {
        Row: {
          created_at: string | null
          id: string
          mensagens: Json
          tipo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagens?: Json
          tipo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagens?: Json
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          id: string
          message_content: string | null
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content?: string | null
          notification_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string | null
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string | null
          id: string
          month_year: string | null
          photo_type: string | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year?: string | null
          photo_type?: string | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string | null
          photo_type?: string | null
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          anamnese_completa: boolean | null
          availability: string | null
          bebe_agua_frequente: boolean | null
          client_status: Database["public"]["Enums"]["client_status"] | null
          condicoes_saude: string | null
          consome_alcool: string | null
          created_at: string | null
          data_nascimento: string | null
          dias_disponiveis: string | null
          email: string | null
          escada_sem_cansar: string | null
          foto_costas_url: string | null
          foto_frente_url: string | null
          foto_lado_url: string | null
          foto_perfil_url: string | null
          full_name: string
          fuma: string | null
          goals: string | null
          height: number | null
          id: string
          injuries: string | null
          ja_treinou_antes: boolean | null
          local_treino: string | null
          medidas: Json | null
          nivel_condicionamento: string | null
          nivel_estresse: string | null
          nivel_experiencia: string | null
          objetivo_principal: string | null
          objetivos_detalhados: Json | null
          observacoes_adicionais: string | null
          pratica_aerobica: boolean | null
          qualidade_sono: string | null
          refeicoes_por_dia: string | null
          restricoes_alimentares: string | null
          restricoes_medicas: string | null
          sexo: string | null
          telefone: string | null
          toma_medicamentos: boolean | null
          updated_at: string | null
          weight: number | null
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          anamnese_completa?: boolean | null
          availability?: string | null
          bebe_agua_frequente?: boolean | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          condicoes_saude?: string | null
          consome_alcool?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          dias_disponiveis?: string | null
          email?: string | null
          escada_sem_cansar?: string | null
          foto_costas_url?: string | null
          foto_frente_url?: string | null
          foto_lado_url?: string | null
          foto_perfil_url?: string | null
          full_name: string
          fuma?: string | null
          goals?: string | null
          height?: number | null
          id: string
          injuries?: string | null
          ja_treinou_antes?: boolean | null
          local_treino?: string | null
          medidas?: Json | null
          nivel_condicionamento?: string | null
          nivel_estresse?: string | null
          nivel_experiencia?: string | null
          objetivo_principal?: string | null
          objetivos_detalhados?: Json | null
          observacoes_adicionais?: string | null
          pratica_aerobica?: boolean | null
          qualidade_sono?: string | null
          refeicoes_por_dia?: string | null
          restricoes_alimentares?: string | null
          restricoes_medicas?: string | null
          sexo?: string | null
          telefone?: string | null
          toma_medicamentos?: boolean | null
          updated_at?: string | null
          weight?: number | null
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          anamnese_completa?: boolean | null
          availability?: string | null
          bebe_agua_frequente?: boolean | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          condicoes_saude?: string | null
          consome_alcool?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          dias_disponiveis?: string | null
          email?: string | null
          escada_sem_cansar?: string | null
          foto_costas_url?: string | null
          foto_frente_url?: string | null
          foto_lado_url?: string | null
          foto_perfil_url?: string | null
          full_name?: string
          fuma?: string | null
          goals?: string | null
          height?: number | null
          id?: string
          injuries?: string | null
          ja_treinou_antes?: boolean | null
          local_treino?: string | null
          medidas?: Json | null
          nivel_condicionamento?: string | null
          nivel_estresse?: string | null
          nivel_experiencia?: string | null
          objetivo_principal?: string | null
          objetivos_detalhados?: Json | null
          observacoes_adicionais?: string | null
          pratica_aerobica?: boolean | null
          qualidade_sono?: string | null
          refeicoes_por_dia?: string | null
          restricoes_alimentares?: string | null
          restricoes_medicas?: string | null
          sexo?: string | null
          telefone?: string | null
          toma_medicamentos?: boolean | null
          updated_at?: string | null
          weight?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          body_fat: number | null
          id: string
          measurements: Json | null
          notes: string | null
          recorded_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          body_fat?: number | null
          id?: string
          measurements?: Json | null
          notes?: string | null
          recorded_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          body_fat?: number | null
          id?: string
          measurements?: Json | null
          notes?: string | null
          recorded_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      protocolos: {
        Row: {
          ativo: boolean | null
          conteudo: Json
          created_at: string | null
          data_geracao: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          conteudo: Json
          created_at?: string | null
          data_geracao?: string | null
          id?: string
          tipo: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          conteudo?: Json
          created_at?: string | null
          data_geracao?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string | null
          price_cents: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          price_cents?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          price_cents?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          created_at: string
          id: string
          inactivity_reminder_sent_at: string | null
          last_access: string
          last_photo_submitted: string | null
          photo_reminder_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inactivity_reminder_sent_at?: string | null
          last_access?: string
          last_photo_submitted?: string | null
          photo_reminder_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inactivity_reminder_sent_at?: string | null
          last_access?: string
          last_photo_submitted?: string | null
          photo_reminder_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      client_status: "active" | "paused" | "blocked" | "canceled"
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
      app_role: ["admin", "user"],
      client_status: ["active", "paused", "blocked", "canceled"],
    },
  },
} as const
