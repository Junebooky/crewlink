import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;

    const auth = await getAuthenticatedContext(request, 'client');
    let effectiveAuthContext = auth.authContext;

    if (!effectiveAuthContext && process.env.NODE_ENV !== 'production') {
      effectiveAuthContext = {
        userId: 'dev-demo-client-id',
        personId: '33333333-3333-3333-3333-333333333333',
        fullName: '박대표 (데모 주최사)',
        roles: ['client'],
      };
    } else if (auth.errorResponse) {
      return auth.errorResponse;
    } else if (!effectiveAuthContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const newStatus = (body.status || 'approved').toLowerCase();
    const validStatus = newStatus === 'accepted' ? 'approved' : newStatus;

    const supabase = createAdminClient();

    // 1. Fetch target application and project organization
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('id, project_id, shift_id, crew_person_id, status, projects(id, organization_id)')
      .eq('id', applicationId)
      .maybeSingle();

    if (fetchError || !application) {
      return NextResponse.json(
        { message: '지원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const project = application.projects as unknown as { organization_id: string } | null;
    if (project?.organization_id) {
      const { data: memberRecord } = await supabase
        .from('organization_members')
        .select('role, is_active')
        .eq('organization_id', project.organization_id)
        .eq('person_id', effectiveAuthContext.personId)
        .eq('is_active', true)
        .maybeSingle();

      if (!memberRecord) {
        return NextResponse.json(
          { message: '해당 지원서를 관리할 권한이 없습니다.' },
          { status: 403 }
        );
      }

      if (memberRecord.role === 'viewer') {
        return NextResponse.json(
          { message: '지원자 선발/상태 변경 권한이 없습니다. (조회 전용 권한)' },
          { status: 403 }
        );
      }
    }

    // 2. Update application status to 'approved'
    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update({
        status: validStatus,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError || !updatedApp) {
      console.error('[PATCH /api/client/applications/[id]] updateError:', updateError);
      return NextResponse.json(
        { message: updateError?.message || '지원 상태를 업데이트하지 못했습니다.' },
        { status: 500 }
      );
    }

    // 3. If approved, assign to an open shift slot and create assignment
    if (validStatus === 'approved') {
      // Find open slot in shift_slots for this shift
      const { data: openSlot } = await supabase
        .from('shift_slots')
        .select('id, slot_number, position_code')
        .eq('shift_id', application.shift_id)
        .eq('status', 'open')
        .order('slot_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (openSlot) {
        // Mark slot as filled
        await supabase
          .from('shift_slots')
          .update({ status: 'filled' })
          .eq('id', openSlot.id);

        // Upsert into assignments
        const { error: assignError } = await supabase
          .from('assignments')
          .insert({
            shift_id: application.shift_id,
            shift_slot_id: openSlot.id,
            crew_person_id: application.crew_person_id,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
          });

        if (assignError) {
          console.warn('[PATCH /api/client/applications/[id]] assignment insert notice:', assignError);
        }
      }
    } else if (validStatus === 'applied') {
      // Revert assignment and free the slot
      const { data: assignment } = await supabase
        .from('assignments')
        .select('id, shift_slot_id')
        .eq('shift_id', application.shift_id)
        .eq('crew_person_id', application.crew_person_id)
        .maybeSingle();

      if (assignment) {
        if (assignment.shift_slot_id) {
          await supabase
            .from('shift_slots')
            .update({ status: 'open' })
            .eq('id', assignment.shift_slot_id);
        }
        await supabase.from('assignments').delete().eq('id', assignment.id);
      }
    }

    return NextResponse.json({
      success: true,
      application: {
        id: updatedApp.id,
        status: updatedApp.status,
        projectId: updatedApp.project_id,
        shiftId: updatedApp.shift_id,
      },
      message: '크루가 성공적으로 선발 및 배정되었습니다.',
    });
  } catch (err: unknown) {
    console.error('[PATCH /api/client/applications/[id]] error:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
