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
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          phone_number: string
          name: string | null
          role: 'organizer' | 'player'
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          phone_number: string
          name?: string | null
          role: 'organizer' | 'player'
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          phone_number?: string
          name?: string | null
          role?: 'organizer' | 'player'
          is_active?: boolean
        }
      }
      sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organizer_id: string
          date: string
          location: string
          hours: number
          shuttlecocks: number
          total_cost: number
          status: 'planned' | 'completed' | 'cancelled'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organizer_id: string
          date: string
          location: string
          hours: number
          shuttlecocks: number
          total_cost: number
          status?: 'planned' | 'completed' | 'cancelled'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organizer_id?: string
          date?: string
          location?: string
          hours?: number
          shuttlecocks?: number
          total_cost?: number
          status?: 'planned' | 'completed' | 'cancelled'
        }
      }
      session_participants: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          temp_player_name: string | null
          temp_player_phone: string | null
          amount_owed: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          temp_player_name?: string | null
          temp_player_phone?: string | null
          amount_owed: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          temp_player_name?: string | null
          temp_player_phone?: string | null
          amount_owed?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          amount: number
          method: 'paynow' | 'cash' | 'bank_transfer'
          notes: string | null
          recorded_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          amount: number
          method: 'paynow' | 'cash' | 'bank_transfer'
          notes?: string | null
          recorded_by: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          amount?: number
          method?: 'paynow' | 'cash' | 'bank_transfer'
          notes?: string | null
          recorded_by?: string
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

export type User = Database['public']['Tables']['users']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionParticipant = Database['public']['Tables']['session_participants']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

export type UserRole = 'organizer' | 'player'
export type SessionStatus = 'planned' | 'completed' | 'cancelled'
export type PaymentMethod = 'paynow' | 'cash' | 'bank_transfer'