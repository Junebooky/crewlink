import { createClient, createAdminClient } from '@/lib/supabase/server';
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

  // Support development/test bypass header only in non-production environments
  const isDevOrTest = process.env.NODE_ENV !== 'production';
  const headerActorId = isDevOrTest ? request?.headers.get('x-actor-person-id') : null;

  if (!user && !headerActorId) {
    return {
      errorResponse: NextResponse.json(
        { message: '다시 로그인해 주세요.' },
        { status: 401 }
      ),
    };
  }

  // Lookup person in Supabase DB using adminClient to bypass RLS bootstrap restriction
  const adminClient = createAdminClient();
  let query = adminClient.from('people').select('id, full_name, auth_user_id, is_active');
  if (user) {
    query = query.or(`auth_user_id.eq.${user.id},id.eq.${user.id}`);
  } else if (headerActorId) {
    query = query.eq('id', headerActorId);
  }

  const { data: person, error: personError } = await query.limit(1).maybeSingle();

  if (!person || !person.is_active) {
    return {
      errorResponse: NextResponse.json(
        { message: '계정 상태를 확인할 수 없어요. 운영팀에 문의해 주세요.' },
        { status: 401 }
      ),
    };
  }

  // Query platform roles for RBAC verification
  const { data: roleRecords } = await adminClient
    .from('platform_roles')
    .select('role')
    .eq('person_id', person.id)
    .eq('is_active', true);

  const roles = (roleRecords || []).map((r) => r.role);

  // Check required role if specified (strict 403 if missing)
  if (requiredRole) {
    if (requiredRole === 'ops' || requiredRole === 'admin') {
      const isOps = roles.includes('ops') || roles.includes('admin');
      if (!isOps) {
        return {
          errorResponse: NextResponse.json(
            { message: '이 화면에 접근할 권한이 없어요. 운영팀에 문의해 주세요.' },
            { status: 403 }
          ),
        };
      }
    } else if (requiredRole === 'client') {
      const isClient = roles.includes('client') || roles.includes('ops') || roles.includes('admin');
      if (!isClient) {
        return {
          errorResponse: NextResponse.json(
            { message: '주최사 계정 권한이 필요해요.' },
            { status: 403 }
          ),
        };
      }
    } else if (requiredRole === 'crew') {
      // Crew role check or default active person
      const isCrew = roles.includes('crew') || roles.length === 0;
      if (!isCrew && !roles.includes('admin') && !roles.includes('ops')) {
        return {
          errorResponse: NextResponse.json(
            { message: '크루 권한이 필요해요.' },
            { status: 403 }
          ),
        };
      }
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
      { message: '배정된 일정을 찾지 못했어요. 일정 화면에서 다시 확인해 주세요.' },
      { status: 404 }
    );
  }

  if (assignment.crew_person_id !== personId) {
    return NextResponse.json(
      { message: '내게 배정된 일정에서만 처리할 수 있어요.' },
      { status: 403 }
    );
  }

  return null;
}
