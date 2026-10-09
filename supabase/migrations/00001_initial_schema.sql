-- =====================================================================
-- CrewLink Migration 00001: Initial Schema (28+ Core Models & Constraints)
-- Target: PostgreSQL 16+ on Supabase
-- =====================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. User & Authentication Layer
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    display_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_account_link UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS public.private_contact_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL UNIQUE REFERENCES public.people(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    email TEXT,
    tax_provider_user_key TEXT, -- Tax tech provider identifier (no raw SSN)
    emergency_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('crew', 'client', 'ops', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_person_role UNIQUE (person_id, role)
);

-- 3. Organization & Client Layer
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_registration_number TEXT,
    ceo_name TEXT,
    billing_email TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_member UNIQUE (organization_id, person_id)
);

-- 4. Crew Profile & Availability
CREATE TABLE IF NOT EXISTS public.crew_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL UNIQUE REFERENCES public.people(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INT NOT NULL DEFAULT 0,
    uniform_size TEXT CHECK (uniform_size IN ('S', 'M', 'L', 'XL', '2XL', 'FREE')),
    profile_photo_url TEXT,
    rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_shifts_completed INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crew_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    available_range TSRANGE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Project & SOW Layer
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    venue_name TEXT NOT NULL,
    road_address TEXT NOT NULL,
    detail_address TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
    sow_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL,
    required_headcount INT NOT NULL CHECK (required_headcount > 0),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    checkin_opens_at TIMESTAMPTZ NOT NULL,
    checkin_closes_at TIMESTAMPTZ NOT NULL,
    hourly_rate_won BIGINT NOT NULL CHECK (hourly_rate_won >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_shift_time CHECK (end_time > start_time),
    CONSTRAINT chk_checkin_window CHECK (checkin_closes_at >= checkin_opens_at)
);

CREATE TABLE IF NOT EXISTS public.shift_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    position_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_shift_slot UNIQUE (shift_id, slot_number)
);

CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL UNIQUE,
    subtotal_won BIGINT NOT NULL DEFAULT 0,
    platform_fee_won BIGINT NOT NULL DEFAULT 0,
    vat_won BIGINT NOT NULL DEFAULT 0,
    total_amount_won BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_won BIGINT NOT NULL CHECK (unit_price_won >= 0),
    amount_won BIGINT NOT NULL CHECK (amount_won >= 0)
);

-- 6. Application, Assignment & Concurrency-Safe Reservations
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    crew_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'approved', 'rejected', 'withdrawn')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_application UNIQUE (shift_id, crew_person_id)
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    shift_slot_id UUID REFERENCES public.shift_slots(id) ON DELETE SET NULL,
    crew_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'departed', 'checked_in', 'completed', 'no_show', 'cancelled')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    departed_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    CONSTRAINT uq_assignment_slot UNIQUE (shift_slot_id)
);

CREATE TABLE IF NOT EXISTS public.work_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    crew_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    reserved_range TSRANGE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PostgreSQL Exclusion Constraint: Prevent overlapping active work reservations per crew member
ALTER TABLE public.work_reservations
ADD CONSTRAINT no_overlapping_reservations 
EXCLUDE USING gist (
    crew_person_id WITH =,
    reserved_range WITH &&
) WHERE (is_active = TRUE);

-- 7. Contracts & Electronic Signature
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sow_title TEXT NOT NULL,
    terms_content TEXT NOT NULL,
    pdf_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    signer_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    signature_vector_json JSONB NOT NULL, -- Preserves raw vector strokes for lossless rendering
    signed_ip TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contract_signature UNIQUE (contract_id, signer_person_id)
);

-- 8. Attendance & QR Challenges
CREATE TABLE IF NOT EXISTS public.checkin_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL, -- 60s TTL SHA-256 hash
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkin_token_hash ON public.checkin_challenges(token_hash);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    checkin_method TEXT NOT NULL CHECK (checkin_method IN ('qr_v2', 'manual_ops', 'geofence')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    raw_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    actual_start_at TIMESTAMPTZ,
    actual_end_at TIMESTAMPTZ,
    break_minutes INT NOT NULL DEFAULT 0,
    is_overtime BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ
);

-- 9. Urgent Replacements
CREATE TABLE IF NOT EXISTS public.replacement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    urgency_level TEXT NOT NULL DEFAULT 'standard' CHECK (urgency_level IN ('standard', 'urgent_t30')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.replacement_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.replacement_requests(id) ON DELETE CASCADE,
    candidate_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'expired')),
    CONSTRAINT uq_replacement_offer UNIQUE (request_id, candidate_person_id)
);

-- 10. Orders & Toss Payments
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    total_amount_won BIGINT NOT NULL CHECK (total_amount_won >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_provider TEXT NOT NULL DEFAULT 'toss_payments',
    payment_key TEXT,
    amount_won BIGINT NOT NULL CHECK (amount_won >= 0),
    status TEXT NOT NULL DEFAULT 'authorized' CHECK (status IN ('authorized', 'captured', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ
);

-- 11. Settlements & Withholding Tax
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
    crew_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    gross_won BIGINT NOT NULL CHECK (gross_won >= 0),
    income_tax_won BIGINT NOT NULL CHECK (income_tax_won >= 0),
    local_income_tax_won BIGINT NOT NULL CHECK (local_income_tax_won >= 0),
    total_tax_won BIGINT NOT NULL CHECK (total_tax_won >= 0),
    net_won BIGINT NOT NULL CHECK (net_won >= 0),
    payment_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'payout_queued', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('wage', 'transport', 'meal', 'bonus')),
    amount_won BIGINT NOT NULL CHECK (amount_won >= 0),
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL UNIQUE REFERENCES public.people(id) ON DELETE CASCADE,
    bank_code TEXT NOT NULL,
    account_number_token TEXT NOT NULL, -- Tokenized bank account, separated from public view
    account_holder_name TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payout_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
    payout_account_id UUID NOT NULL REFERENCES public.payout_accounts(id) ON DELETE RESTRICT,
    amount_won BIGINT NOT NULL CHECK (amount_won >= 0),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'success', 'failed')),
    failure_reason TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Audit & Outbox Events
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    diff JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);
