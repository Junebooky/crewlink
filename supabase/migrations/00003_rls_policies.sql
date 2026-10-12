-- =====================================================================
-- CrewLink Migration 00003: RLS Policies with Non-Recursive Org Members & Profile Isolation
-- =====================================================================

-- 1. Helper function to get current person_id from auth.uid()
CREATE OR REPLACE FUNCTION crewlink.current_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = crewlink, public, auth
AS $$
    SELECT id FROM crewlink.people WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function to check if current user is an active ops/admin
CREATE OR REPLACE FUNCTION crewlink.is_ops_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = crewlink, public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM crewlink.platform_roles pr
        JOIN crewlink.people p ON p.id = pr.person_id
        WHERE p.auth_user_id = auth.uid()
          AND pr.is_active = TRUE
          AND pr.role IN ('ops', 'admin')
    );
$$;

-- 2. Enable RLS on all 28 tables
ALTER TABLE crewlink.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.private_contact_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.crew_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.shift_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.work_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.checkin_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.replacement_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.payout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crewlink.outbox_events ENABLE ROW LEVEL SECURITY;

-- 3. Base Grants
GRANT SELECT ON crewlink.projects, crewlink.shifts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA crewlink TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA crewlink TO authenticated;

-- 4. RLS Policies

-- People
CREATE POLICY "Users read own person profile" ON crewlink.people
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid() OR crewlink.is_ops_or_admin());

CREATE POLICY "Users update own display name" ON crewlink.people
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Organization Members: Direct auth.uid mapping, NO recursive subqueries!
CREATE POLICY "Org members read member list" ON crewlink.organization_members
    FOR SELECT TO authenticated
    USING (
        person_id = crewlink.current_person_id()
        OR crewlink.is_ops_or_admin()
    );

-- Organizations
CREATE POLICY "Org members read own organization" ON crewlink.organizations
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT om.organization_id FROM crewlink.organization_members om
            WHERE om.person_id = crewlink.current_person_id()
        )
        OR crewlink.is_ops_or_admin()
    );

-- Crew Profiles: Isolated! No public wide open read
CREATE POLICY "Crew read own profile" ON crewlink.crew_profiles
    FOR SELECT TO authenticated
    USING (person_id = crewlink.current_person_id() OR crewlink.is_ops_or_admin());

CREATE POLICY "Crew update own profile" ON crewlink.crew_profiles
    FOR UPDATE TO authenticated
    USING (person_id = crewlink.current_person_id())
    WITH CHECK (person_id = crewlink.current_person_id());

-- Private Contact Details
CREATE POLICY "Private contact read own" ON crewlink.private_contact_details
    FOR SELECT TO authenticated
    USING (person_id = crewlink.current_person_id() OR crewlink.is_ops_or_admin());

-- Platform Roles
CREATE POLICY "Platform roles read own" ON crewlink.platform_roles
    FOR SELECT TO authenticated
    USING (person_id = crewlink.current_person_id() OR crewlink.is_ops_or_admin());

-- Projects
CREATE POLICY "Read projects" ON crewlink.projects
    FOR SELECT TO authenticated
    USING (
        status = 'published'
        OR organization_id IN (
            SELECT om.organization_id FROM crewlink.organization_members om
            WHERE om.person_id = crewlink.current_person_id()
        )
        OR crewlink.is_ops_or_admin()
    );

-- Shifts
CREATE POLICY "Read shifts" ON crewlink.shifts
    FOR SELECT TO authenticated
    USING (TRUE);

-- Assignments
CREATE POLICY "Read assignments" ON crewlink.assignments
    FOR SELECT TO authenticated
    USING (
        crew_person_id = crewlink.current_person_id()
        OR crewlink.is_ops_or_admin()
        OR EXISTS (
            SELECT 1 FROM crewlink.shifts s
            JOIN crewlink.projects p ON p.id = s.project_id
            JOIN crewlink.organization_members om ON om.organization_id = p.organization_id
            WHERE s.id = assignments.shift_id
              AND om.person_id = crewlink.current_person_id()
        )
    );

-- Contracts & Signatures
CREATE POLICY "Read own contract signature" ON crewlink.contract_signatures
    FOR SELECT TO authenticated
    USING (signer_person_id = crewlink.current_person_id() OR crewlink.is_ops_or_admin());

CREATE POLICY "Insert own contract signature" ON crewlink.contract_signatures
    FOR INSERT TO authenticated
    WITH CHECK (signer_person_id = crewlink.current_person_id());

-- Settlements
CREATE POLICY "Read own settlements" ON crewlink.settlements
    FOR SELECT TO authenticated
    USING (crew_person_id = crewlink.current_person_id() OR crewlink.is_ops_or_admin());

-- Audit & Outbox
CREATE POLICY "Audit events ops read" ON crewlink.audit_events
    FOR SELECT TO authenticated
    USING (crewlink.is_ops_or_admin());

CREATE POLICY "Outbox events ops read" ON crewlink.outbox_events
    FOR SELECT TO authenticated
    USING (crewlink.is_ops_or_admin());
