export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CrewlinkSchema = {
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
      Relationships: [];
    };
    persons: {
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
      Relationships: [];
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
      Relationships: [];
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
      Relationships: [];
    };
    organizations: {
      Row: {
        id: string;
        name: string;
        business_registration_number: string | null;
        ceo_name: string | null;
        billing_email: string | null;
        is_verified: boolean;
        status?: string | null;
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
        status?: string | null;
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
        status?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    organization_members: {
      Row: {
        id: string;
        organization_id: string;
        person_id: string;
        role?: 'owner' | 'manager' | 'viewer';
        member_role?: string;
        is_active: boolean;
        created_at: string;
        updated_at?: string;
      };
      Insert: {
        id?: string;
        organization_id: string;
        person_id: string;
        role?: 'owner' | 'manager' | 'viewer';
        member_role?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        organization_id?: string;
        person_id?: string;
        role?: 'owner' | 'manager' | 'viewer';
        member_role?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    crew_profiles: {
      Row: {
        id?: string;
        person_id: string;
        profile_image_url?: string | null;
        full_body_image_url?: string | null;
        height_cm?: number | null;
        top_size?: string | null;
        bottom_size?: string | null;
        shoe_size_mm?: number | null;
        experience_years: number;
        bio: string | null;
        languages?: string[];
        uniform_size?: 'S' | 'M' | 'L' | 'XL' | '2XL' | 'FREE' | null;
        profile_photo_url?: string | null;
        rating_avg?: number;
        total_shifts_completed?: number;
        created_at?: string;
        updated_at?: string;
      };
      Insert: {
        id?: string;
        person_id: string;
        profile_image_url?: string | null;
        full_body_image_url?: string | null;
        height_cm?: number | null;
        top_size?: string | null;
        bottom_size?: string | null;
        shoe_size_mm?: number | null;
        experience_years?: number;
        bio?: string | null;
        languages?: string[];
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
        profile_image_url?: string | null;
        full_body_image_url?: string | null;
        height_cm?: number | null;
        top_size?: string | null;
        bottom_size?: string | null;
        shoe_size_mm?: number | null;
        experience_years?: number;
        bio?: string | null;
        languages?: string[];
        uniform_size?: 'S' | 'M' | 'L' | 'XL' | '2XL' | 'FREE' | null;
        profile_photo_url?: string | null;
        rating_avg?: number;
        total_shifts_completed?: number;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
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
        latitude?: number | null;
        longitude?: number | null;
        status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
        sow_spec: Json;
        start_date?: string | null;
        end_date?: string | null;
        is_demo?: boolean;
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
        latitude?: number | null;
        longitude?: number | null;
        status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
        sow_spec?: Json;
        start_date?: string | null;
        end_date?: string | null;
        is_demo?: boolean;
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
        latitude?: number | null;
        longitude?: number | null;
        status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
        sow_spec?: Json;
        start_date?: string | null;
        end_date?: string | null;
        is_demo?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    shifts: {
      Row: {
        id: string;
        project_id: string;
        shift_name: string;
        required_headcount: number;
        date?: string | null;
        start_time: string;
        end_time: string;
        checkin_opens_at: string;
        checkin_closes_at: string;
        hourly_rate_won: number;
        daily_wage?: number | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        project_id: string;
        shift_name: string;
        required_headcount: number;
        date?: string | null;
        start_time: string;
        end_time: string;
        checkin_opens_at?: string;
        checkin_closes_at?: string;
        hourly_rate_won: number;
        daily_wage?: number | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        project_id?: string;
        shift_name?: string;
        required_headcount?: number;
        date?: string | null;
        start_time?: string;
        end_time?: string;
        checkin_opens_at?: string;
        checkin_closes_at?: string;
        hourly_rate_won?: number;
        daily_wage?: number | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    shift_slots: {
      Row: {
        id: string;
        shift_id: string;
        slot_number: number;
        position_code: string | null;
        status: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        shift_id: string;
        slot_number: number;
        position_code?: string | null;
        status?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        shift_id?: string;
        slot_number?: number;
        position_code?: string | null;
        status?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    quotes: {
      Row: {
        id: string;
        project_id: string;
        quote_number?: string;
        subtotal_won?: number;
        total_labor_won?: number;
        platform_fee_won?: number;
        vat_won?: number;
        total_amount_won?: number;
        grand_total_won?: number;
        status: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        project_id: string;
        quote_number?: string;
        subtotal_won?: number;
        total_labor_won?: number;
        platform_fee_won?: number;
        vat_won?: number;
        total_amount_won?: number;
        grand_total_won?: number;
        status?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        project_id?: string;
        quote_number?: string;
        subtotal_won?: number;
        total_labor_won?: number;
        platform_fee_won?: number;
        vat_won?: number;
        total_amount_won?: number;
        grand_total_won?: number;
        status?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    quote_items: {
      Row: {
        id: string;
        quote_id: string;
        shift_id?: string;
        item_name?: string;
        item_type?: string;
        quantity: number;
        unit_price_won: number;
        amount_won: number;
        created_at: string;
      };
      Insert: {
        id?: string;
        quote_id: string;
        shift_id?: string;
        item_name?: string;
        item_type?: string;
        quantity: number;
        unit_price_won: number;
        amount_won: number;
        created_at?: string;
      };
      Update: {
        id?: string;
        quote_id?: string;
        shift_id?: string;
        item_name?: string;
        item_type?: string;
        quantity?: number;
        unit_price_won?: number;
        amount_won?: number;
        created_at?: string;
      };
      Relationships: [];
    };
    applications: {
      Row: {
        id: string;
        project_id?: string;
        shift_id: string;
        shift_slot_id?: string | null;
        crew_person_id: string;
        status: 'applied' | 'approved' | 'rejected' | 'withdrawn';
        applied_at: string;
        processed_at?: string | null;
        rejection_reason?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Insert: {
        id?: string;
        project_id?: string;
        shift_id: string;
        shift_slot_id?: string | null;
        crew_person_id: string;
        status?: 'applied' | 'approved' | 'rejected' | 'withdrawn';
        applied_at?: string;
        processed_at?: string | null;
        rejection_reason?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        project_id?: string;
        shift_id?: string;
        shift_slot_id?: string | null;
        crew_person_id?: string;
        status?: 'applied' | 'approved' | 'rejected' | 'withdrawn';
        applied_at?: string;
        processed_at?: string | null;
        rejection_reason?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    assignments: {
      Row: {
        id: string;
        shift_id: string;
        shift_slot_id: string | null;
        crew_person_id: string;
        status: 'assigned' | 'departed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled' | 'waiting_ops' | string;
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
        status?: 'assigned' | 'departed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled' | 'waiting_ops' | string;
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
        status?: 'assigned' | 'departed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled' | 'waiting_ops' | string;
        assigned_at?: string;
        departed_at?: string | null;
        checked_in_at?: string | null;
        version?: number;
      };
      Relationships: [];
    };
    work_reservations: {
      Row: {
        id: string;
        assignment_id: string;
        crew_person_id: string;
        reserved_range?: string;
        time_range?: unknown;
        is_active?: boolean;
        created_at: string;
      };
      Insert: {
        id?: string;
        assignment_id: string;
        crew_person_id: string;
        reserved_range?: string;
        time_range?: unknown;
        is_active?: boolean;
        created_at?: string;
      };
      Update: {
        id?: string;
        assignment_id?: string;
        crew_person_id?: string;
        reserved_range?: string;
        time_range?: unknown;
        is_active?: boolean;
        created_at?: string;
      };
      Relationships: [];
    };
    contracts: {
      Row: {
        id: string;
        project_id: string;
        contract_type?: string;
        sow_title?: string;
        title?: string;
        terms_content?: string;
        terms_markdown?: string;
        pdf_hash?: string;
        version?: string;
        status?: string;
        created_at: string;
        updated_at?: string;
      };
      Insert: {
        id?: string;
        project_id: string;
        contract_type?: string;
        sow_title?: string;
        title?: string;
        terms_content?: string;
        terms_markdown?: string;
        pdf_hash?: string;
        version?: string;
        status?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        project_id?: string;
        contract_type?: string;
        sow_title?: string;
        title?: string;
        terms_content?: string;
        terms_markdown?: string;
        pdf_hash?: string;
        version?: string;
        status?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
    contract_signatures: {
      Row: {
        id: string;
        contract_id: string;
        signer_person_id: string;
        signature_data?: string;
        signature_vector_json?: Json | null;
        terms_sha256?: string;
        contract_version?: string;
        signed_ip?: string;
        signed_at: string;
      };
      Insert: {
        id?: string;
        contract_id: string;
        signer_person_id: string;
        signature_data?: string;
        signature_vector_json?: Json | null;
        terms_sha256?: string;
        contract_version?: string;
        signed_ip?: string;
        signed_at?: string;
      };
      Update: {
        id?: string;
        contract_id?: string;
        signer_person_id?: string;
        signature_data?: string;
        signature_vector_json?: Json | null;
        terms_sha256?: string;
        contract_version?: string;
        signed_ip?: string;
        signed_at?: string;
      };
      Relationships: [];
    };
    attendance_logs: {
      Row: {
        id: string;
        assignment_id: string;
        checkin_method: string;
        recorded_at: string;
        latitude: number | null;
        longitude: number | null;
        raw_metadata: Json;
      };
      Insert: {
        id?: string;
        assignment_id: string;
        checkin_method: string;
        recorded_at?: string;
        latitude?: number | null;
        longitude?: number | null;
        raw_metadata?: Json;
      };
      Update: {
        id?: string;
        assignment_id?: string;
        checkin_method?: string;
        recorded_at?: string;
        latitude?: number | null;
        longitude?: number | null;
        raw_metadata?: Json;
      };
      Relationships: [];
    };
    replacement_requests: {
      Row: {
        id: string;
        assignment_id: string;
        shift_id: string;
        reason: string;
        urgency_level?: string;
        status: string;
        matched_crew_person_id?: string | null;
        version: number;
        requested_at?: string;
        created_at?: string;
      };
      Insert: {
        id?: string;
        assignment_id: string;
        shift_id: string;
        reason: string;
        urgency_level?: string;
        status?: string;
        matched_crew_person_id?: string | null;
        version?: number;
        requested_at?: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        assignment_id?: string;
        shift_id?: string;
        reason?: string;
        urgency_level?: string;
        status?: string;
        matched_crew_person_id?: string | null;
        version?: number;
        requested_at?: string;
        created_at?: string;
      };
      Relationships: [];
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
      Relationships: [];
    };
    audit_events: {
      Row: {
        id: string;
        actor_person_id: string | null;
        entity_type: string;
        entity_id: string;
        action: string;
        diff: Json;
        created_at: string;
      };
      Insert: {
        id?: string;
        actor_person_id?: string | null;
        entity_type: string;
        entity_id: string;
        action: string;
        diff?: Json;
        created_at?: string;
      };
      Update: {
        id?: string;
        actor_person_id?: string | null;
        entity_type?: string;
        entity_id?: string;
        action?: string;
        diff?: Json;
        created_at?: string;
      };
      Relationships: [];
    };
  };
  Views: {
    persons: {
      Row: CrewlinkSchema['Tables']['persons']['Row'];
      Relationships: [];
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
    get_assigned_crews: {
      Args: {
        p_project_id: string;
      };
      Returns: {
        assignment_id: string;
        shift_id: string;
        shift_slot_id: string;
        position_code: string;
        status: string;
        masked_name: string;
        uniform_size: string | null;
        rating_avg: number;
        checked_in_at: string | null;
        departed_at: string | null;
      }[];
    };
    get_events_in_bounds: {
      Args: {
        min_lat: number;
        min_lng: number;
        max_lat: number;
        max_lng: number;
      };
      Returns: CrewlinkSchema['Tables']['projects']['Row'][];
    };
    get_events_social_proof: {
      Args: {
        p_project_ids: string[];
        p_reference_time?: string;
        p_is_mvp?: boolean;
      };
      Returns: {
        project_id: string;
        applicant_count: number;
        new_applicant_count_24h: number;
        latest_applied_at: string | null;
        avatars: Json;
      }[];
    };
  };
  Enums: {
    [_ in never]: never;
  };
  CompositeTypes: {
    [_ in never]: never;
  };
};

export type Database = {
  crewlink: CrewlinkSchema;
};
