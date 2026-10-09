export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      people: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          display_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name: string;
          display_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          display_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      private_contact_details: {
        Row: {
          id: string;
          person_id: string;
          phone_number: string;
          email: string | null;
          tax_provider_user_key: string | null;
          emergency_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          phone_number: string;
          email?: string | null;
          tax_provider_user_key?: string | null;
          emergency_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          phone_number?: string;
          email?: string | null;
          tax_provider_user_key?: string | null;
          emergency_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      platform_roles: {
        Row: {
          id: string;
          person_id: string;
          role: 'crew' | 'client' | 'ops' | 'admin';
          is_active: boolean;
          granted_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          role: 'crew' | 'client' | 'ops' | 'admin';
          is_active?: boolean;
          granted_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          role?: 'crew' | 'client' | 'ops' | 'admin';
          is_active?: boolean;
          granted_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          business_registration_number: string | null;
          ceo_name: string | null;
          billing_email: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          business_registration_number?: string | null;
          ceo_name?: string | null;
          billing_email?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          business_registration_number?: string | null;
          ceo_name?: string | null;
          billing_email?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      crew_profiles: {
        Row: {
          id: string;
          person_id: string;
          bio: string | null;
          experience_years: number;
          uniform_size: 'S' | 'M' | 'L' | 'XL' | '2XL' | 'FREE' | null;
          profile_photo_url: string | null;
          rating_avg: number;
          total_shifts_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          bio?: string | null;
          experience_years?: number;
          uniform_size?: 'S' | 'M' | 'L' | 'XL' | '2XL' | 'FREE' | null;
          profile_photo_url?: string | null;
          rating_avg?: number;
          total_shifts_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          bio?: string | null;
          experience_years?: number;
          uniform_size?: 'S' | 'M' | 'L' | 'XL' | '2XL' | 'FREE' | null;
          profile_photo_url?: string | null;
          rating_avg?: number;
          total_shifts_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          venue_name: string;
          road_address: string;
          detail_address: string | null;
          status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
          sow_spec: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          venue_name: string;
          road_address: string;
          detail_address?: string | null;
          status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
          sow_spec?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          venue_name?: string;
          road_address?: string;
          detail_address?: string | null;
          status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
          sow_spec?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          project_id: string;
          shift_name: string;
          required_headcount: number;
          start_time: string;
          end_time: string;
          checkin_opens_at: string;
          checkin_closes_at: string;
          hourly_rate_won: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          shift_name: string;
          required_headcount: number;
          start_time: string;
          end_time: string;
          checkin_opens_at: string;
          checkin_closes_at: string;
          hourly_rate_won: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          shift_name?: string;
          required_headcount?: number;
          start_time?: string;
          end_time?: string;
          checkin_opens_at?: string;
          checkin_closes_at?: string;
          hourly_rate_won?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          shift_id: string;
          shift_slot_id: string | null;
          crew_person_id: string;
          status: 'assigned' | 'departed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
          assigned_at: string;
          departed_at: string | null;
          checked_in_at: string | null;
          version: number;
        };
        Insert: {
          id?: string;
          shift_id: string;
          shift_slot_id?: string | null;
          crew_person_id: string;
          status?: 'assigned' | 'departed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
          assigned_at?: string;
          departed_at?: string | null;
          checked_in_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          shift_id?: string;
          shift_slot_id?: string | null;
          crew_person_id?: string;
          status?: 'assigned' | 'departed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
          assigned_at?: string;
          departed_at?: string | null;
          checked_in_at?: string | null;
          version?: number;
        };
      };
      settlements: {
        Row: {
          id: string;
          project_id: string;
          crew_person_id: string;
          gross_won: number;
          income_tax_won: number;
          local_income_tax_won: number;
          total_tax_won: number;
          net_won: number;
          payment_due_date: string;
          status: 'draft' | 'confirmed' | 'payout_queued' | 'completed';
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          crew_person_id: string;
          gross_won: number;
          income_tax_won: number;
          local_income_tax_won: number;
          total_tax_won: number;
          net_won: number;
          payment_due_date: string;
          status?: 'draft' | 'confirmed' | 'payout_queued' | 'completed';
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          crew_person_id?: string;
          gross_won?: number;
          income_tax_won?: number;
          local_income_tax_won?: number;
          total_tax_won?: number;
          net_won?: number;
          payment_due_date?: string;
          status?: 'draft' | 'confirmed' | 'payout_queued' | 'completed';
          created_at?: string;
          confirmed_at?: string | null;
        };
      };
    };
    Functions: {
      checkin_with_qr_v2: {
        Args: {
          p_assignment_id: string;
          p_token_hash: string;
          p_latitude?: number | null;
          p_longitude?: number | null;
          p_raw_metadata?: Json;
        };
        Returns: Json;
      };
    };
  };
};
