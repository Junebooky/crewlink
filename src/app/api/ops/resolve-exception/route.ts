import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    // 1. RBAC Guard: Requires OPS or ADMIN role
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'ops');
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { taskId, expectedVersion, reason, action = 'APPROVE' } = body;

    if (!taskId || !reason || !reason.trim()) {
      return NextResponse.json(
        { message: '처리 사유(reason) 입력은 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Query target replacement request or assignment to check optimistic version lock
    let currentVersion = 1;
    let isReplacementReq = false;

    const { data: repReq } = await supabase
      .from('replacement_requests')
      .select('id, version, status')
      .eq('id', taskId)
      .maybeSingle();

    if (repReq) {
      currentVersion = repReq.version;
      isReplacementReq = true;
    } else {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('id, version, status')
        .eq('id', taskId)
        .maybeSingle();

      if (assignment) {
        currentVersion = assignment.version;
      }
    }

    // 3. Concurrency Lock: verify expectedVersion
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      return NextResponse.json(
        {
          message: `선점 충돌: 다른 운영자에 의해 이미 해당 작업이 변경되었습니다. (현재 버전: v${currentVersion}, 요청 버전: v${expectedVersion})`,
        },
        { status: 409 }
      );
    }

    const nextVersion = currentVersion + 1;

    // 4. Update status and bump version
    if (isReplacementReq) {
      await supabase
        .from('replacement_requests')
        .update({
          status: action === 'APPROVE' ? 'closed' : 'open',
          version: nextVersion,
        })
        .eq('id', taskId);
    } else {
      await supabase
        .from('assignments')
        .update({
          status: action === 'APPROVE' ? 'checked_in' : 'assigned',
          version: nextVersion,
        })
        .eq('id', taskId);
    }

    // 5. Audit Event Recording
    await supabase.from('audit_events').insert({
      actor_person_id: authContext?.personId || null,
      entity_type: isReplacementReq ? 'replacement_requests' : 'assignments',
      entity_id: taskId,
      action: `RESOLVE_EXCEPTION_${action}`,
      diff: {
        reason,
        previous_version: currentVersion,
        new_version: nextVersion,
        resolved_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      taskId,
      action,
      newVersion: nextVersion,
      resolvedAt: new Date().toISOString(),
      reason,
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
