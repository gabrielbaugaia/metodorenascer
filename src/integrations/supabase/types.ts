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
      achievement_types: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          points: number
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id: string
          name: string
          points?: number
          requirement_value?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement_value?: number
        }
        Relationships: []
      }
      active_workout_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          status: string
          total_duration_seconds: number | null
          user_id: string
          workout_name: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_duration_seconds?: number | null
          user_id: string
          workout_name: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_duration_seconds?: number | null
          user_id?: string
          workout_name?: string
        }
        Relationships: []
      }
      admin_support_alerts: {
        Row: {
          alert_type: string
          conversa_id: string | null
          created_at: string
          id: string
          is_read: boolean
          keywords_detected: string[] | null
          message_preview: string | null
          read_at: string | null
          urgency_level: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          conversa_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          keywords_detected?: string[] | null
          message_preview?: string | null
          read_at?: string | null
          urgency_level?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          conversa_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          keywords_detected?: string[] | null
          message_preview?: string | null
          read_at?: string | null
          urgency_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_support_alerts_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_messages: {
        Row: {
          cooldown_days: number | null
          created_at: string
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          message_content: string
          message_title: string
          min_days_since_signup: number | null
          schedule_recurring: string | null
          schedule_type: string | null
          scheduled_at: string | null
          target_audience: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          cooldown_days?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          message_content: string
          message_title: string
          min_days_since_signup?: number | null
          schedule_recurring?: string | null
          schedule_type?: string | null
          scheduled_at?: string | null
          target_audience?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          cooldown_days?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          message_content?: string
          message_title?: string
          min_days_since_signup?: number | null
          schedule_recurring?: string | null
          schedule_type?: string | null
          scheduled_at?: string | null
          target_audience?: Json | null
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
      blog_leads: {
        Row: {
          city: string | null
          created_at: string
          document_downloaded: string | null
          email: string
          id: string
          name: string
          phone: string | null
          post_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          document_downloaded?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          post_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          document_downloaded?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_leads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: Json
          cover_image_url: string | null
          created_at: string
          enable_lead_capture: boolean | null
          excerpt: string | null
          id: string
          lead_capture_description: string | null
          lead_capture_title: string | null
          lead_cta_text: string | null
          lead_document_url: string | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          enable_lead_capture?: boolean | null
          excerpt?: string | null
          id?: string
          lead_capture_description?: string | null
          lead_capture_title?: string | null
          lead_cta_text?: string | null
          lead_document_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          enable_lead_capture?: boolean | null
          excerpt?: string | null
          id?: string
          lead_capture_description?: string | null
          lead_capture_title?: string | null
          lead_cta_text?: string | null
          lead_document_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          ai_analysis: string | null
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
          ai_analysis?: string | null
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
          ai_analysis?: string | null
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
      commercial_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          modules_access: Json
          name: string
          period_months: number | null
          price_cents: number
          slug: string
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          modules_access?: Json
          name: string
          period_months?: number | null
          price_cents: number
          slug: string
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          modules_access?: Json
          name?: string
          period_months?: number | null
          price_cents?: number
          slug?: string
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversas: {
        Row: {
          created_at: string | null
          id: string
          mensagens: Json
          status: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagens?: Json
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagens?: Json
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          active_calories: number | null
          active_minutes: number | null
          created_at: string | null
          date: string
          distance_m: number | null
          id: string
          last_synced_at: string | null
          source: Database["public"]["Enums"]["health_source"]
          steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_calories?: number | null
          active_minutes?: number | null
          created_at?: string | null
          date: string
          distance_m?: number | null
          id?: string
          last_synced_at?: string | null
          source: Database["public"]["Enums"]["health_source"]
          steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_calories?: number | null
          active_minutes?: number | null
          created_at?: string | null
          date?: string
          distance_m?: number | null
          id?: string
          last_synced_at?: string | null
          source?: Database["public"]["Enums"]["health_source"]
          steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_summary: {
        Row: {
          id: string
          logins_last_30d: number | null
          mindset_tasks_completed_last_30d: number | null
          protocols_generated_last_30d: number | null
          status_engagement: string | null
          updated_at: string | null
          user_id: string
          workouts_completed_last_30d: number | null
        }
        Insert: {
          id?: string
          logins_last_30d?: number | null
          mindset_tasks_completed_last_30d?: number | null
          protocols_generated_last_30d?: number | null
          status_engagement?: string | null
          updated_at?: string | null
          user_id: string
          workouts_completed_last_30d?: number | null
        }
        Update: {
          id?: string
          logins_last_30d?: number | null
          mindset_tasks_completed_last_30d?: number | null
          protocols_generated_last_30d?: number | null
          status_engagement?: string | null
          updated_at?: string | null
          user_id?: string
          workouts_completed_last_30d?: number | null
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          access_level: string
          id: string
          override_expires_at: string | null
          override_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: string
          id?: string
          override_expires_at?: string | null
          override_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: string
          id?: string
          override_expires_at?: string | null
          override_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          page_name: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          page_name?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          page_name?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      exercise_gifs: {
        Row: {
          api_source: string | null
          body_parts: string[] | null
          created_at: string
          equipments: string[] | null
          exercise_db_id: string | null
          exercise_name_en: string
          exercise_name_pt: string
          gif_url: string | null
          id: string
          instructions: string[] | null
          last_checked_at: string | null
          muscle_group: string[]
          secondary_muscles: string[] | null
          status: string
          target_muscles: string[] | null
          updated_at: string
        }
        Insert: {
          api_source?: string | null
          body_parts?: string[] | null
          created_at?: string
          equipments?: string[] | null
          exercise_db_id?: string | null
          exercise_name_en: string
          exercise_name_pt: string
          gif_url?: string | null
          id?: string
          instructions?: string[] | null
          last_checked_at?: string | null
          muscle_group: string[]
          secondary_muscles?: string[] | null
          status?: string
          target_muscles?: string[] | null
          updated_at?: string
        }
        Update: {
          api_source?: string | null
          body_parts?: string[] | null
          created_at?: string
          equipments?: string[] | null
          exercise_db_id?: string | null
          exercise_name_en?: string
          exercise_name_pt?: string
          gif_url?: string | null
          id?: string
          instructions?: string[] | null
          last_checked_at?: string | null
          muscle_group?: string[]
          secondary_muscles?: string[] | null
          status?: string
          target_muscles?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      exercise_videos: {
        Row: {
          created_at: string | null
          difficulty_level: string | null
          environment: string | null
          exercise_name: string
          id: string
          muscle_group: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: string | null
          environment?: string | null
          exercise_name: string
          id?: string
          muscle_group: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string | null
          environment?: string | null
          exercise_name?: string
          id?: string
          muscle_group?: string
          video_url?: string
        }
        Relationships: []
      }
      gif_search_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          exercise_gif_id: string
          exercise_name_en: string
          exercise_name_pt: string
          id: string
          max_attempts: number
          result_gif_url: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          exercise_gif_id: string
          exercise_name_en: string
          exercise_name_pt: string
          id?: string
          max_attempts?: number
          result_gif_url?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          exercise_gif_id?: string
          exercise_name_en?: string
          exercise_name_pt?: string
          id?: string
          max_attempts?: number
          result_gif_url?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gif_search_queue_exercise_gif_id_fkey"
            columns: ["exercise_gif_id"]
            isOneToOne: false
            referencedRelation: "exercise_gifs"
            referencedColumns: ["id"]
          },
        ]
      }
      health_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          scopes: string[] | null
          source: Database["public"]["Enums"]["health_source"]
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          source: Database["public"]["Enums"]["health_source"]
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          source?: Database["public"]["Enums"]["health_source"]
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_daily: {
        Row: {
          active_calories: number | null
          created_at: string | null
          date: string
          hrv_ms: number | null
          id: string
          resting_hr: number | null
          sleep_minutes: number | null
          source: string | null
          steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_calories?: number | null
          created_at?: string | null
          date: string
          hrv_ms?: number | null
          id?: string
          resting_hr?: number | null
          sleep_minutes?: number | null
          source?: string | null
          steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_calories?: number | null
          created_at?: string | null
          date?: string
          hrv_ms?: number | null
          id?: string
          resting_hr?: number | null
          sleep_minutes?: number | null
          source?: string | null
          steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_goals: {
        Row: {
          created_at: string | null
          daily_active_minutes_goal: number | null
          daily_calories_goal: number | null
          daily_steps_goal: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_active_minutes_goal?: number | null
          daily_calories_goal?: number | null
          daily_steps_goal?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_active_minutes_goal?: number | null
          daily_calories_goal?: number | null
          daily_steps_goal?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_workouts: {
        Row: {
          calories: number | null
          created_at: string | null
          end_time: string
          external_id: string | null
          id: string
          source: string | null
          start_time: string
          type: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string | null
          end_time: string
          external_id?: string | null
          id?: string
          source?: string | null
          start_time: string
          type: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string | null
          end_time?: string
          external_id?: string | null
          id?: string
          source?: string | null
          start_time?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          converted: boolean | null
          created_at: string
          email: string
          id: string
          nome: string
          origem: string | null
          telefone: string
        }
        Insert: {
          converted?: boolean | null
          created_at?: string
          email: string
          id?: string
          nome: string
          origem?: string | null
          telefone: string
        }
        Update: {
          converted?: boolean | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          origem?: string | null
          telefone?: string
        }
        Relationships: []
      }
      manual_day_logs: {
        Row: {
          created_at: string | null
          date: string
          energy_focus: number | null
          id: string
          rpe: number | null
          sleep_hours: number | null
          stress_level: number | null
          trained_today: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          energy_focus?: number | null
          id?: string
          rpe?: number | null
          sleep_hours?: number | null
          stress_level?: number | null
          trained_today?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          energy_focus?: number | null
          id?: string
          rpe?: number | null
          sleep_hours?: number | null
          stress_level?: number | null
          trained_today?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_sends: {
        Row: {
          clicked_at: string | null
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          opened_at: string | null
          sent_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          opened_at?: string | null
          sent_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          opened_at?: string | null
          sent_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_sends_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "automated_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_sends_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "v_message_metrics"
            referencedColumns: ["message_id"]
          },
        ]
      }
      mqo_clients: {
        Row: {
          attention_points: string | null
          created_at: string
          id: string
          name: string
          objectives: string | null
          profile_id: string | null
          strengths: string | null
          suggested_strategy: string | null
          summary: string | null
          trainer_direction: string | null
          updated_at: string
        }
        Insert: {
          attention_points?: string | null
          created_at?: string
          id?: string
          name: string
          objectives?: string | null
          profile_id?: string | null
          strengths?: string | null
          suggested_strategy?: string | null
          summary?: string | null
          trainer_direction?: string | null
          updated_at?: string
        }
        Update: {
          attention_points?: string | null
          created_at?: string
          id?: string
          name?: string
          objectives?: string | null
          profile_id?: string | null
          strengths?: string | null
          suggested_strategy?: string | null
          summary?: string | null
          trainer_direction?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mqo_clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mqo_materials: {
        Row: {
          client_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mqo_materials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "mqo_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      mqo_protocol_versions: {
        Row: {
          content: Json
          created_at: string
          id: string
          protocol_id: string
          status: string
          version_number: number
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          protocol_id: string
          status: string
          version_number: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          protocol_id?: string
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "mqo_protocol_versions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "mqo_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      mqo_protocols: {
        Row: {
          audit_result: Json | null
          client_id: string
          content: Json
          created_at: string
          generation_options: Json | null
          id: string
          published_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          audit_result?: Json | null
          client_id: string
          content?: Json
          created_at?: string
          generation_options?: Json | null
          id?: string
          published_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          audit_result?: Json | null
          client_id?: string
          content?: Json
          created_at?: string
          generation_options?: Json | null
          id?: string
          published_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mqo_protocols_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "mqo_clients"
            referencedColumns: ["id"]
          },
        ]
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
      notification_preferences: {
        Row: {
          checkin_reminder_enabled: boolean
          created_at: string
          id: string
          inactivity_reminder_enabled: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
          workout_completed_enabled: boolean
          workout_reminder_enabled: boolean
          workout_reminder_time: string
        }
        Insert: {
          checkin_reminder_enabled?: boolean
          created_at?: string
          id?: string
          inactivity_reminder_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
          workout_completed_enabled?: boolean
          workout_reminder_enabled?: boolean
          workout_reminder_time?: string
        }
        Update: {
          checkin_reminder_enabled?: boolean
          created_at?: string
          id?: string
          inactivity_reminder_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
          workout_completed_enabled?: boolean
          workout_reminder_enabled?: boolean
          workout_reminder_time?: string
        }
        Relationships: []
      }
      pending_logins: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          session_id: string
          temp_password: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id: string
          temp_password: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string
          temp_password?: string
          used_at?: string | null
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
          acquisition_channel: string | null
          age: number | null
          anamnese_completa: boolean | null
          availability: string | null
          bebe_agua_frequente: boolean | null
          cashback_balance: number | null
          client_status: Database["public"]["Enums"]["client_status"] | null
          condicoes_saude: string | null
          consome_alcool: string | null
          created_at: string | null
          data_mode: string | null
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
          funnel_status: string | null
          goals: string | null
          height: number | null
          horario_acorda: string | null
          horario_dorme: string | null
          horario_treino: string | null
          id: string
          injuries: string | null
          ja_treinou_antes: boolean | null
          local_treino: string | null
          medidas: Json | null
          nivel_condicionamento: string | null
          nivel_estresse: string | null
          nivel_experiencia: string | null
          objective_primary: string | null
          objetivo_principal: string | null
          objetivos_detalhados: Json | null
          observacoes_adicionais: string | null
          onboarding_completed: boolean | null
          pratica_aerobica: boolean | null
          qualidade_sono: string | null
          refeicoes_por_dia: string | null
          referred_by_code: string | null
          restricoes_alimentares: string | null
          restricoes_medicas: string | null
          sexo: string | null
          telefone: string | null
          toma_medicamentos: boolean | null
          training_level: string | null
          training_location: string | null
          updated_at: string | null
          weight: number | null
          whatsapp: string | null
        }
        Insert: {
          acquisition_channel?: string | null
          age?: number | null
          anamnese_completa?: boolean | null
          availability?: string | null
          bebe_agua_frequente?: boolean | null
          cashback_balance?: number | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          condicoes_saude?: string | null
          consome_alcool?: string | null
          created_at?: string | null
          data_mode?: string | null
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
          funnel_status?: string | null
          goals?: string | null
          height?: number | null
          horario_acorda?: string | null
          horario_dorme?: string | null
          horario_treino?: string | null
          id: string
          injuries?: string | null
          ja_treinou_antes?: boolean | null
          local_treino?: string | null
          medidas?: Json | null
          nivel_condicionamento?: string | null
          nivel_estresse?: string | null
          nivel_experiencia?: string | null
          objective_primary?: string | null
          objetivo_principal?: string | null
          objetivos_detalhados?: Json | null
          observacoes_adicionais?: string | null
          onboarding_completed?: boolean | null
          pratica_aerobica?: boolean | null
          qualidade_sono?: string | null
          refeicoes_por_dia?: string | null
          referred_by_code?: string | null
          restricoes_alimentares?: string | null
          restricoes_medicas?: string | null
          sexo?: string | null
          telefone?: string | null
          toma_medicamentos?: boolean | null
          training_level?: string | null
          training_location?: string | null
          updated_at?: string | null
          weight?: number | null
          whatsapp?: string | null
        }
        Update: {
          acquisition_channel?: string | null
          age?: number | null
          anamnese_completa?: boolean | null
          availability?: string | null
          bebe_agua_frequente?: boolean | null
          cashback_balance?: number | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          condicoes_saude?: string | null
          consome_alcool?: string | null
          created_at?: string | null
          data_mode?: string | null
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
          funnel_status?: string | null
          goals?: string | null
          height?: number | null
          horario_acorda?: string | null
          horario_dorme?: string | null
          horario_treino?: string | null
          id?: string
          injuries?: string | null
          ja_treinou_antes?: boolean | null
          local_treino?: string | null
          medidas?: Json | null
          nivel_condicionamento?: string | null
          nivel_estresse?: string | null
          nivel_experiencia?: string | null
          objective_primary?: string | null
          objetivo_principal?: string | null
          objetivos_detalhados?: Json | null
          observacoes_adicionais?: string | null
          onboarding_completed?: boolean | null
          pratica_aerobica?: boolean | null
          qualidade_sono?: string | null
          refeicoes_por_dia?: string | null
          referred_by_code?: string | null
          restricoes_alimentares?: string | null
          restricoes_medicas?: string | null
          sexo?: string | null
          telefone?: string | null
          toma_medicamentos?: boolean | null
          training_level?: string | null
          training_location?: string | null
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
          audit_result: Json | null
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
          audit_result?: Json | null
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
          audit_result?: Json | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          discount_applied: boolean | null
          discount_applied_at: string | null
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          discount_applied?: boolean | null
          discount_applied_at?: string | null
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: boolean | null
          discount_applied_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          created_at: string
          id: string
          ingredients: string[]
          is_favorite: boolean | null
          recipe_content: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredients: string[]
          is_favorite?: boolean | null
          recipe_content: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredients?: string[]
          is_favorite?: boolean | null
          recipe_content?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          access_blocked: boolean | null
          blocked_reason: string | null
          canceled_at: string | null
          commercial_plan_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          invitation_expires_at: string | null
          mrr_value: number | null
          payments_count: number | null
          plan_name: string | null
          plan_type: string | null
          price_cents: number | null
          started_at: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_blocked?: boolean | null
          blocked_reason?: string | null
          canceled_at?: string | null
          commercial_plan_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          invitation_expires_at?: string | null
          mrr_value?: number | null
          payments_count?: number | null
          plan_name?: string | null
          plan_type?: string | null
          price_cents?: number | null
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_blocked?: boolean | null
          blocked_reason?: string | null
          canceled_at?: string | null
          commercial_plan_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          invitation_expires_at?: string | null
          mrr_value?: number | null
          payments_count?: number | null
          plan_name?: string | null
          plan_type?: string | null
          price_cents?: number | null
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_commercial_plan_id_fkey"
            columns: ["commercial_plan_id"]
            isOneToOne: false
            referencedRelation: "commercial_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_campaigns: {
        Row: {
          created_at: string | null
          current_participants: number | null
          duration_days: number
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          module_limits: Json
          name: string
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          duration_days?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          module_limits?: Json
          name: string
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          duration_days?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          module_limits?: Json
          name?: string
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trial_usage: {
        Row: {
          id: string
          updated_at: string | null
          used_diet: boolean | null
          used_mindset: boolean | null
          used_recipe_count: number | null
          used_support_count: number | null
          used_workout: boolean | null
          user_id: string
        }
        Insert: {
          id?: string
          updated_at?: string | null
          used_diet?: boolean | null
          used_mindset?: boolean | null
          used_recipe_count?: number | null
          used_support_count?: number | null
          used_workout?: boolean | null
          user_id: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          used_diet?: boolean | null
          used_mindset?: boolean | null
          used_recipe_count?: number | null
          used_support_count?: number | null
          used_workout?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          notified: boolean | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          notified?: boolean | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          notified?: boolean | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_types"
            referencedColumns: ["id"]
          },
        ]
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
      user_module_access: {
        Row: {
          access_level: string
          created_at: string | null
          expires_at: string | null
          id: string
          limits: Json | null
          module: string
          trial_campaign_id: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          limits?: Json | null
          module: string
          trial_campaign_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          limits?: Json | null
          module?: string
          trial_campaign_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_trial_campaign_id_fkey"
            columns: ["trial_campaign_id"]
            isOneToOne: false
            referencedRelation: "trial_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          adherence_level: number | null
          created_at: string | null
          current_weight: number | null
          energy_level: number | null
          id: string
          mood: string | null
          notes: string | null
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          adherence_level?: number | null
          created_at?: string | null
          current_weight?: number | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          adherence_level?: number | null
          created_at?: string | null
          current_weight?: number | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          user_id?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      workout_completions: {
        Row: {
          calories_burned: number | null
          created_at: string
          duration_minutes: number | null
          exercises_completed: number | null
          id: string
          notes: string | null
          session_id: string | null
          total_duration_seconds: number | null
          user_id: string
          workout_date: string
          workout_name: string | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number | null
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          session_id?: string | null
          total_duration_seconds?: number | null
          user_id: string
          workout_date?: string
          workout_name?: string | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number | null
          exercises_completed?: number | null
          id?: string
          notes?: string | null
          session_id?: string | null
          total_duration_seconds?: number | null
          user_id?: string
          workout_date?: string
          workout_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "active_workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          calories: number | null
          created_at: string | null
          distance_m: number | null
          duration_min: number | null
          end_time: string | null
          external_id: string | null
          id: string
          last_synced_at: string | null
          source: Database["public"]["Enums"]["health_source"]
          start_time: string
          type: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string | null
          distance_m?: number | null
          duration_min?: number | null
          end_time?: string | null
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          source: Database["public"]["Enums"]["health_source"]
          start_time: string
          type: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string | null
          distance_m?: number | null
          duration_min?: number | null
          end_time?: string | null
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          source?: Database["public"]["Enums"]["health_source"]
          start_time?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          reps_done: number
          rest_respected: boolean
          rest_seconds: number
          session_id: string
          set_number: number
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          reps_done?: number
          rest_respected?: boolean
          rest_seconds?: number
          session_id: string
          set_number: number
          user_id: string
          weight_kg?: number
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          reps_done?: number
          rest_respected?: boolean
          rest_seconds?: number
          session_id?: string
          set_number?: number
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "active_workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_activity_aggregated: {
        Row: {
          date: string | null
          last_synced_at: string | null
          sources: Database["public"]["Enums"]["health_source"][] | null
          total_active_calories: number | null
          total_active_minutes: number | null
          total_distance_m: number | null
          total_steps: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_conversion_funnel: {
        Row: {
          checkout_completed: number | null
          checkout_started: number | null
          landing_views: number | null
          plan_views: number | null
        }
        Relationships: []
      }
      v_engagement_by_status: {
        Row: {
          avg_logins: number | null
          avg_workouts: number | null
          status_engagement: string | null
          user_count: number | null
        }
        Relationships: []
      }
      v_message_metrics: {
        Row: {
          click_rate: number | null
          is_custom: boolean | null
          message_id: string | null
          message_title: string | null
          open_rate: number | null
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          trigger_type: string | null
        }
        Relationships: []
      }
      v_metrics_by_channel: {
        Row: {
          acquisition_channel: string | null
          active_subscribers: number | null
          churned_users: number | null
          total_mrr: number | null
          total_users: number | null
        }
        Relationships: []
      }
      v_mrr_summary: {
        Row: {
          active_subscriptions: number | null
          avg_mrr: number | null
          plan_name: string | null
          total_mrr: number | null
        }
        Relationships: []
      }
      v_retention_cohorts: {
        Row: {
          cohort_month: string | null
          retained_1m: number | null
          retained_3m: number | null
          retained_6m: number | null
          total_started: number | null
        }
        Relationships: []
      }
      v_top_pages: {
        Row: {
          page_name: string | null
          unique_visitors: number | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_pending_logins: { Args: never; Returns: undefined }
      get_referrer_name_by_code: {
        Args: { lookup_code: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_cashback_balance: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      recalculate_engagement: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      recalculate_funnel_status: {
        Args: { target_user_id: string }
        Returns: string
      }
      validate_referral_code: {
        Args: { lookup_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      client_status: "active" | "paused" | "blocked" | "canceled"
      health_source: "google_fit" | "apple_health"
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
      health_source: ["google_fit", "apple_health"],
    },
  },
} as const
