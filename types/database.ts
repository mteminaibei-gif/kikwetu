export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          county: string | null
          language: string
          role: string
          heshima: number
          is_verified: boolean
          is_online: boolean
          interests: string[]
          mpesa_number: string | null
          notification_prefs: Json | null
          privacy_prefs: Json | null
          expertise_areas: string
          teaching_levels: string[]
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          county?: string | null
          language?: string
          role?: string
          heshima?: number
          is_verified?: boolean
          is_online?: boolean
          interests?: string[]
          mpesa_number?: string | null
          notification_prefs?: Json | null
          privacy_prefs?: Json | null
          expertise_areas?: string
          teaching_levels?: string[]
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          county?: string | null
          language?: string
          role?: string
          heshima?: number
          is_verified?: boolean
          is_online?: boolean
          interests?: string[]
          mpesa_number?: string | null
          notification_prefs?: Json | null
          privacy_prefs?: Json | null
          expertise_areas?: string
          teaching_levels?: string[]
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      threads: {
        Row: {
          id: string
          author_id: string
          title: string
          body: string | null
          type: string
          space_id: string | null
          bounty_amount: number | null
          tags: string[] | null
          likes_count: number
          comments_count: number
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          body?: string | null
          type?: string
          space_id?: string | null
          bounty_amount?: number | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          body?: string | null
          type?: string
          space_id?: string | null
          bounty_amount?: number | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      replies: {
        Row: {
          id: string
          thread_id: string
          author_id: string
          body: string
          likes_count: number
          is_accepted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          author_id: string
          body: string
          likes_count?: number
          is_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          author_id?: string
          body?: string
          likes_count?: number
          is_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          target_type: string
          target_id: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: string
          target_id: string
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: string
          target_id?: string
          value?: number
          created_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          members_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          members_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          members_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      space_members: {
        Row: {
          id: string
          space_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          space_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      professionals: {
        Row: {
          id: string
          user_id: string
          expertise: string[]
          description: string | null
          hourly_rate: number | null
          is_approved: boolean
          rating: number
          sessions_count: number
          availability: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expertise?: string[]
          description?: string | null
          hourly_rate?: number | null
          is_approved?: boolean
          rating?: number
          sessions_count?: number
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expertise?: string[]
          description?: string | null
          hourly_rate?: number | null
          is_approved?: boolean
          rating?: number
          sessions_count?: number
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          student_id: string
          professional_id: string
          thread_id: string | null
          title: string
          description: string | null
          scheduled_at: string | null
          duration_minutes: number
          status: string
          meeting_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          professional_id: string
          thread_id?: string | null
          title: string
          description?: string | null
          scheduled_at?: string | null
          duration_minutes?: number
          status?: string
          meeting_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          professional_id?: string
          thread_id?: string | null
          title?: string
          description?: string | null
          scheduled_at?: string | null
          duration_minutes?: number
          status?: string
          meeting_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          is_read?: boolean
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      tips: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          session_id: string | null
          amount: number
          platform_fee: number
          net_amount: number
          rating: number | null
          comment: string | null
          status: string
          mpesa_receipt: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          session_id?: string | null
          amount: number
          platform_fee: number
          net_amount: number
          rating?: number | null
          comment?: string | null
          status?: string
          mpesa_receipt?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          session_id?: string | null
          amount?: number
          platform_fee?: number
          net_amount?: number
          rating?: number | null
          comment?: string | null
          status?: string
          mpesa_receipt?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
      quiz_categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          quizzes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          color?: string | null
          quizzes_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          color?: string | null
          quizzes_count?: number
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          category_id: string
          title: string
          description: string | null
          difficulty: string
          questions_count: number
          estimated_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          title: string
          description?: string | null
          difficulty?: string
          questions_count?: number
          estimated_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          title?: string
          description?: string | null
          difficulty?: string
          questions_count?: number
          estimated_minutes?: number
          created_at?: string
        }
      }
      quiz_results: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          score: number
          total_questions: number
          time_taken_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          score: number
          total_questions: number
          time_taken_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          score?: number
          total_questions?: number
          time_taken_seconds?: number | null
          created_at?: string
        }
      }
      marketplace_listings: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string | null
          price: number
          category: string
          location: string | null
          images: string[] | null
          is_available: boolean
          rating: number
          sales_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description?: string | null
          price: number
          category: string
          location?: string | null
          images?: string[] | null
          is_available?: boolean
          rating?: number
          sales_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string | null
          price?: number
          category?: string
          location?: string | null
          images?: string[] | null
          is_available?: boolean
          rating?: number
          sales_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      nyumba_kumi_alerts: {
        Row: {
          id: string
          reporter_id: string
          type: string
          title: string
          description: string | null
          location: string
          county: string
          confirmations_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          type: string
          title: string
          description?: string | null
          location: string
          county: string
          confirmations_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          type?: string
          title?: string
          description?: string | null
          location?: string
          county?: string
          confirmations_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      saved_items: {
        Row: {
          id: string
          user_id: string
          target_type: string
          target_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: string
          target_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: string
          target_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: string
          target_id: string
          reason: string
          description: string | null
          status: string
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: string
          target_id: string
          reason: string
          description?: string | null
          status?: string
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_type?: string
          target_id?: string
          reason?: string
          description?: string | null
          status?: string
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
