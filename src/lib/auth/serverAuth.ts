import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
  personId: string;
  fullName: string;
  email?: string;
  roles: string[];
}

/**
 * Validates authentication session and resolves matching person record
 */
export async function getAuthenticatedContext(
  request?: Request,
  requiredRole?: 'ops' | 'admin' | 'crew' | 'client'
): Promise<{
  authContext?: AuthContext;
  errorResponse?: NextResponse;
}> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Support development/test bypass header if explicitly provided
  const headerActorId = request?.headers.get('x-actor-person-id');

  if (!user && !headerActorId) {
    return {
      errorResponse: NextResponse.json(
        { message: '인증 세션이 없습니다. 로그인 후 다시 시도해 주세요.' },
        { status: 401 }
      ),
    };
  }

  // Lookup person in Supabase DB
  let query = supabase.from('people').select('id, full_name, auth_user_id, is_active');
  if (user) {
    query = query.or(`auth_user_id.eq.${user.id},id.eq.${user.id}`);
  } else if (headerActorId) {
    query = query.eq('id', headerActorId);
  }

  const { data: person, error: personError } = await query.limit(1).maybeSingle();

  if (!person || !person.is_active) {
    return {
      errorResponse: NextResponse.json(
        { message: '유효한 활성 사용자 프로필을 찾을 수 없습니다.' },
        { status: 401 }
      ),
    };
  }

  // Query platform roles for RBAC verification
  const { data: roleRecords } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('person_id', person.id)
    .eq('is_active', true);

  const roles = (roleRecords || []).map((r) => r.role);

  // Check required role if specified
  if (requiredRole === 'ops' || requiredRole === 'admin') {
    const isOps = roles.includes('ops') || roles.includes('admin');
    if (!isOps) {
      return {
        errorResponse: NextResponse.json(
          { message: '접근 권한이 없습니다. 운영자(OPS/ADMIN) 권한이 필요합니다.' },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authContext: {
      userId: user?.id || person.id,
      personId: person.id,
      fullName: person.full_name,
      email: user?.email,
      roles,
    },
  };
}

/**
 * Verifies that the given assignment belongs to the authenticated crew member
 */
export async function verifyAssignmentOwnership(
  assignmentId: string,
  personId: string
): Promise<NextResponse | null> {
  const supabase = await createClient();

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id, crew_person_id, status')
    .eq('id', assignmentId)
    .maybeSingle();

  if (error || !assignment) {
    return NextResponse.json(
      { message: '해당 배정(assignment) 정보를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  if (assignment.crew_person_id !== personId) {
    return NextResponse.json(
      { message: '소유권 검증 실패: 본인에게 배정된 과업만 수행할 수 있습니다.' },
      { status: 403 }
    );
  }

  return null;
}
