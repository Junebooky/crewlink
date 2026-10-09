-- =====================================================================
-- CrewLink Migration 00003: Row Level Security (RLS) & Privacy Hardening
-- =====================================================================

-- 1. Helper function to get current person_id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT id FROM public.people WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function to check if current user is an active ops/admin
CREATE OR REPLACE FUNCTION public.is_ops_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.platform_roles pr
        JOIN public.people p ON p.id = pr.person_id
        WHERE p.auth_user_id = auth.uid()
          AND pr.is_active = TRUE
          AND pr.role IN ('ops', 'admin')
    );
$$;

-- 2. Enable RLS on all 28 tables
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_contact_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- 3. Base Revocations
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.projects, public.shifts TO anon; -- Public browseable project listings

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- 4. RLS Policies

-- People
CREATE POLICY "Users read own person profile" ON public.people
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_ops_or_admin());

CREATE POLICY "Users update own display name" ON public.people
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Private Contact Details: Strict Isolation (Never exposed publicly, only own user or ops/admin read, service_role write)
CREATE POLICY "Private contact read own" ON public.private_contact_details
    FOR SELECT TO authenticated
    USING (person_id = public.current_person_id() OR public.is_ops_or_admin());

-- Platform Roles: Read-only for authenticated, write restricted to service_role/admin
CREATE POLICY "Platform roles read own" ON public.platform_roles
    FOR SELECT TO authenticated
    USING (person_id = public.current_person_id() OR public.is_ops_or_admin());

-- Organizations & Members
CREATE POLICY "Org members read own organization" ON public.organizations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
              AND om.person_id = public.current_person_id()
        ) OR public.is_ops_or_admin()
    );

CREATE POLICY "Org members read member list" ON public.organization_members
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT om2.organization_id FROM public.organization_members om2
            WHERE om2.person_id = public.current_person_id()
        ) OR public.is_ops_or_admin()
    );

-- Crew Profiles
CREATE POLICY "Public profile read" ON public.crew_profiles
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Crew update own profile" ON public.crew_profiles
    FOR UPDATE TO authenticated
    USING (person_id = public.current_person_id())
    WITH CHECK (person_id = public.current_person_id());

-- Projects: Public published projects or organization owned
CREATE POLICY "Read projects" ON public.projects
    FOR SELECT TO authenticated
    USING (
        status = 'published'
        OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = projects.organization_id
              AND om.person_id = public.current_person_id()
        )
        OR public.is_ops_or_admin()
    );

-- Shifts
CREATE POLICY "Read shifts" ON public.shifts
    FOR SELECT TO authenticated
    USING (TRUE);

-- Assignments: Crew reads own assignments; Org reads its project assignments; Ops reads all
CREATE POLICY "Read assignments" ON public.assignments
    FOR SELECT TO authenticated
    USING (
        crew_person_id = public.current_person_id()
        OR EXISTS (
            SELECT 1 FROM public.shifts s
            JOIN public.projects p ON p.id = s.project_id
            JOIN public.organization_members om ON om.organization_id = p.organization_id
            WHERE s.id = assignments.shift_id
              AND om.person_id = public.current_person_id()
        )
        OR public.is_ops_or_admin()
    );

-- Contracts & Signatures
CREATE POLICY "Read contracts" ON public.contracts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.shifts s ON s.id = a.shift_id
            WHERE s.project_id = contracts.project_id
              AND a.crew_person_id = public.current_person_id()
        )
        OR public.is_ops_or_admin()
    );

CREATE POLICY "Read own contract signature" ON public.contract_signatures
    FOR SELECT TO authenticated
    USING (signer_person_id = public.current_person_id() OR public.is_ops_or_admin());

CREATE POLICY "Insert own contract signature" ON public.contract_signatures
    FOR INSERT TO authenticated
    WITH CHECK (signer_person_id = public.current_person_id());

-- Payout Accounts: Strictly isolated (read own only, mutations through service_role)
CREATE POLICY "Read own payout account" ON public.payout_accounts
    FOR SELECT TO authenticated
    USING (person_id = public.current_person_id() OR public.is_ops_or_admin());

-- Settlements: Crew reads own, Ops reads all, modifications restricted to service_role
CREATE POLICY "Read own settlements" ON public.settlements
    FOR SELECT TO authenticated
    USING (crew_person_id = public.current_person_id() OR public.is_ops_or_admin());

CREATE POLICY "Read settlement items" ON public.settlement_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.settlements s
            WHERE s.id = settlement_items.settlement_id
              AND (s.crew_person_id = public.current_person_id() OR public.is_ops_or_admin())
        )
    );

-- Audit & Outbox: Ops/Admin read only
CREATE POLICY "Audit events ops read" ON public.audit_events
    FOR SELECT TO authenticated
    USING (public.is_ops_or_admin());

CREATE POLICY "Outbox events ops read" ON public.outbox_events
    FOR SELECT TO authenticated
    USING (public.is_ops_or_admin());
