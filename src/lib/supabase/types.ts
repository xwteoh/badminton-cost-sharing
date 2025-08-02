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
      locations: {
        Row: {
          id: string
          organizer_id: string
          name: string
          address: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          name: string
          address?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          name?: string
          address?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          phone_number: string
          name: string | null
          role: 'organizer' | 'player'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone_number: string
          name?: string | null
          role: 'organizer' | 'player'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          name?: string | null
          role?: 'organizer' | 'player'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          organizer_id: string
          user_id: string | null
          name: string
          phone_number: string | null
          is_temporary: boolean
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          user_id?: string | null
          name: string
          phone_number?: string | null
          is_temporary?: boolean
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          user_id?: string | null
          name?: string
          phone_number?: string | null
          is_temporary?: boolean
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          organizer_id: string
          title: string | null
          session_date: string
          start_time: string | null
          end_time: string | null
          location: string | null
          court_rate_per_hour: number | null
          shuttlecock_rate_each: number | null
          shuttlecocks_used: number | null
          hours_played: number | null
          court_cost: number
          shuttlecock_cost: number
          other_costs: number
          total_cost: number
          player_count: number
          cost_per_player: number
          status: 'planned' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title?: string | null
          session_date: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          court_rate_per_hour?: number | null
          shuttlecock_rate_each?: number | null
          shuttlecocks_used?: number | null
          hours_played?: number | null
          court_cost: number
          shuttlecock_cost?: number
          other_costs?: number
          player_count: number
          status?: 'planned' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string | null
          session_date?: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          court_rate_per_hour?: number | null
          shuttlecock_rate_each?: number | null
          shuttlecocks_used?: number | null
          hours_played?: number | null
          court_cost?: number
          shuttlecock_cost?: number
          other_costs?: number
          total_cost?: number
          player_count?: number
          cost_per_player?: number
          status?: 'planned' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      session_participants: {
        Row: {
          id: string
          session_id: string
          player_id: string
          amount_owed: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
          amount_owed: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          player_id?: string
          amount_owed?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          organizer_id: string
          player_id: string
          amount: number
          payment_method: 'cash' | 'paynow' | 'bank_transfer' | 'other'
          payment_date: string
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          player_id: string
          amount: number
          payment_method: 'cash' | 'paynow' | 'bank_transfer' | 'other'
          payment_date: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          player_id?: string
          amount?: number
          payment_method?: 'cash' | 'paynow' | 'bank_transfer' | 'other'
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      player_balances: {
        Row: {
          id: string
          organizer_id: string
          player_id: string
          total_owed: number
          total_paid: number
          current_balance: number
          last_session_date: string | null
          last_payment_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          player_id: string
          total_owed?: number
          total_paid?: number
          last_session_date?: string | null
          last_payment_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          player_id?: string
          total_owed?: number
          total_paid?: number
          last_session_date?: string | null
          last_payment_date?: string | null
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

export type User = Database['public']['Tables']['users']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionParticipant = Database['public']['Tables']['session_participants']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type PlayerBalance = Database['public']['Tables']['player_balances']['Row']

export type UserRole = 'organizer' | 'player'
export type SessionStatus = 'planned' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'paynow' | 'bank_transfer' | 'other'