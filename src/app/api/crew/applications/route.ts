import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

/**
 * GET /api/crew/applications
 * Returns authenticated crew member's real applications & assignments from DB
 */
export async function GET(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Fetch crew applications with projects and shifts
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        project_id,
        shift_id,
        status,
        applied_at,
        projects (
          id,
          title,
          venue_name,
          road_address,
          start_date,
          end_date,
          sow_spec,
          organizations (name)
        ),
        shifts (
          id,
          date,
          start_time,
          end_time,
          daily_wage,
          hourly_rate_won
        )
      `)
      .eq('crew_person_id', authContext.personId)
      .order('applied_at', { ascending: false });

    if (appError) {
      console.error('[GET /api/crew/applications] appError:', appError);
      return NextResponse.json({ message: appError.message }, { status: 500 });
    }

    // 2. Fetch assignments for this crew member
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select(`
        id,
        shift_id,
        shift_slot_id,
        status,
        assigned_at,
        departed_at,
        checked_in_at,
        shifts (
          id,
          project_id,
          date,
          start_time,
          end_time,
          daily_wage,
          hourly_rate_won,
          projects (
            id,
            title,
            venue_name,
            road_address,
            organizations (name)
          )
        )
      `)
      .eq('crew_person_id', authContext.personId)
      .not('status', 'in', '("cancelled","released")')
      .order('assigned_at', { ascending: false });

    if (assignError) {
      console.error('[GET /api/crew/applications] assignError:', assignError);
    }

    // Map applications
    const formattedApps = (applications || []).map((app) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const project = app.projects as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shift = app.shifts as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sow = (project?.sow_spec as Record<string, any>) || {};

      return {
        id: app.id,
        projectId: app.project_id,
        projectTitle: project?.title || '행사',
        hostName: project?.organizations?.name || '주최사',
        venueName: project?.venue_name || '행사장',
        roadAddress: project?.road_address || '',
        shiftId: app.shift_id,
        date: shift?.date || '',
        startTime: shift?.start_time || '09:00',
        endTime: shift?.end_time || '18:00',
        dailyWage: shift?.daily_wage || sow?.dailyWage || 130000,
        status: app.status, // 'applied', 'approved', 'rejected', 'withdrawn'
        appliedAt: app.applied_at,
      };
    });

    // Map assignments (confirmed work schedules)
    const formattedAssignments = (assignments || []).map((asgn) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shift = asgn.shifts as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const project = shift?.projects as any;

      return {
        id: asgn.id,
        shiftId: asgn.shift_id,
        projectId: shift?.project_id,
        projectTitle: project?.title || '배정 행사',
        hostName: project?.organizations?.name || '주최사',
        venueName: project?.venue_name || '행사장',
        roadAddress: project?.road_address || '',
        date: shift?.date || '',
        startTime: shift?.start_time || '09:00',
        endTime: shift?.end_time || '18:00',
        dailyWage: shift?.daily_wage || 130000,
        status: asgn.status, // 'assigned', 'departed', 'checked_in', 'completed'
        assignedAt: asgn.assigned_at,
        departedAt: asgn.departed_at,
        checkedInAt: asgn.checked_in_at,
      };
    });

    return NextResponse.json({
      success: true,
      applications: formattedApps,
      assignments: formattedAssignments,
      counts: {
        totalApplications: formattedApps.length,
        applied: formattedApps.filter((a) => a.status === 'applied').length,
        approved: formattedApps.filter((a) => a.status === 'approved').length,
        rejected: formattedApps.filter((a) => a.status === 'rejected').length,
        withdrawn: formattedApps.filter((a) => a.status === 'withdrawn').length,
        activeAssignments: formattedAssignments.length,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/crew/applications] error:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/crew/applications
 * Atomic multi-shift application submission using DB RPC
 */
export async function POST(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      projectId: reqProjectId,
      shiftId: reqShiftId,
      selectedDates,
      agreeNotice,
      agreePrivacy,
    } = body;

    const hasAgreed = agreeNotice === true || agreePrivacy === true;
    if (!hasAgreed) {
      return NextResponse.json(
        { message: '개인정보 수집 및 행사 안내에 동의해 주세요.' },
        { status: 400 }
      );
    }

    const targetProjectId = reqProjectId || eventId;
    if (!targetProjectId) {
      return NextResponse.json(
        { message: '지원할 공고 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Resolve target shifts
    const { data: projectShifts, error: shiftError } = await supabase
      .from('shifts')
      .select('id, date')
      .eq('project_id', targetProjectId)
      .order('date', { ascending: true });

    if (shiftError || !projectShifts || projectShifts.length === 0) {
      return NextResponse.json(
        { message: '공고의 근무 일정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let targetShiftIds: string[] = [];

    if (Array.isArray(selectedDates) && selectedDates.length > 0) {
      const selectedSet = new Set(selectedDates);
      targetShiftIds = projectShifts
        .filter((s) => selectedSet.has(s.date) || selectedSet.has(s.id))
        .map((s) => s.id);
    } else if (reqShiftId) {
      const matched = projectShifts.find((s) => s.id === reqShiftId);
      if (matched) targetShiftIds = [matched.id];
    } else if (projectShifts.length === 1) {
      targetShiftIds = [projectShifts[0].id];
    }

    if (targetShiftIds.length === 0) {
      return NextResponse.json(
        { message: '지원할 일정을 하나 이상 선택해 주세요.' },
        { status: 400 }
      );
    }

    // 2. Call atomic DB procedure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcResult, error: rpcErr } = await (supabase.rpc as any)('apply_shifts_atomic', {
      p_project_id: targetProjectId,
      p_shift_ids: targetShiftIds,
      p_crew_person_id: authContext.personId,
    });

    if (rpcErr) {
      console.error('[POST /api/crew/applications] apply_shifts_atomic error:', rpcErr);
      const isConflict = rpcErr.code === '23505';
      const isNotFound = rpcErr.code === 'P0002';
      const status = isConflict ? 409 : isNotFound ? 404 : 400;

      return NextResponse.json(
        { message: rpcErr.message || '지원 접수에 실패했습니다.' },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      result: rpcResult,
      message: `성공적으로 ${targetShiftIds.length}개 일정에 지원했습니다.`,
    });
  } catch (err: unknown) {
    console.error('[POST /api/crew/applications] error:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

/**
 * DELETE /api/crew/applications
 * Atomic application withdrawal by authenticated crew
 */
export async function DELETE(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let applicationId = searchParams.get('id');

    if (!applicationId) {
      const body = await request.json().catch(() => ({}));
      applicationId = body?.applicationId || body?.id;
    }

    if (!applicationId) {
      return NextResponse.json(
        { message: '철회할 지원서 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcErr } = await (supabase.rpc as any)('withdraw_application', {
      p_application_id: applicationId,
      p_crew_person_id: authContext.personId,
    });

    if (rpcErr) {
      console.error('[DELETE /api/crew/applications] withdraw_application error:', rpcErr);
      const isForbidden = rpcErr.code === '42501';
      const status = isForbidden ? 403 : 400;
      return NextResponse.json(
        { message: rpcErr.message || '지원을 철회하지 못했습니다.' },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      message: '지원이 성공적으로 철회되었습니다.',
    });
  } catch (err: unknown) {
    console.error('[DELETE /api/crew/applications] error:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
