import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';
import { getEventById } from '@/lib/data/events';

// Map static feed events to known shift UUIDs or resolve dynamically
const STATIC_EVENT_SHIFT_MAP: Record<string, { projectId: string; shiftId: string }> = {
  'evt-2026-002': {
    projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    shiftId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  },
};

export async function POST(request: Request) {
  try {
    // 1. Session user authentication & ownership guard
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
      shiftId: reqShiftId,
      applicantName,
      applicantPhone,
      agreeNotice,
    } = body;

    if (!agreeNotice) {
      return NextResponse.json(
        { message: '행사 안내 및 성실 참여 약속에 동의해 주세요.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const todayStr = new Date().toISOString().slice(0, 10);

    let targetProjectId: string | null = null;
    let targetShiftId: string | null = reqShiftId || null;

    // 2. Check Static Event Data if eventId provided
    if (eventId) {
      const event = getEventById(eventId);
      if (event) {
        // Validation: Recruitment Status
        if (event.recruitmentStatus === 'CLOSED') {
          return NextResponse.json(
            { message: '이미 모집이 마감된 공고예요.' },
            { status: 400 }
          );
        }
        // Validation: Deadline Date (deadlineDate >= CURRENT_DATE)
        if (event.deadlineDate < todayStr) {
          return NextResponse.json(
            { message: '지원 마감일이 지난 공고예요.' },
            { status: 400 }
          );
        }

        // Resolve mapped shift ID if static
        if (STATIC_EVENT_SHIFT_MAP[eventId]) {
          targetProjectId = STATIC_EVENT_SHIFT_MAP[eventId].projectId;
          targetShiftId = STATIC_EVENT_SHIFT_MAP[eventId].shiftId;
        }
      }
    }

    // If shiftId given directly or need to lookup shift in DB
    if (targetShiftId) {
      const { data: shiftRecord } = await supabase
        .from('shifts')
        .select('id, project_id, start_time, projects(id, status, title)')
        .eq('id', targetShiftId)
        .maybeSingle();

      if (shiftRecord) {
        targetProjectId = shiftRecord.project_id;
        const project = shiftRecord.projects as unknown as { status: string } | null;
        if (project && (project.status === 'cancelled' || project.status === 'completed')) {
          return NextResponse.json(
            { message: '모집이 종료되었거나 취소된 행사예요.' },
            { status: 400 }
          );
        }
      }
    }

    // Fallback: If no shift found in DB yet (for newly generated static event IDs), ensure a shift exists
    if (!targetShiftId || !targetProjectId) {
      const { data: defaultShift } = await supabase
        .from('shifts')
        .select('id, project_id')
        .limit(1)
        .maybeSingle();

      if (defaultShift) {
        targetShiftId = defaultShift.id;
        targetProjectId = defaultShift.project_id;
      } else {
        return NextResponse.json(
          { message: '지원 가능한 일정을 찾지 못했어요.' },
          { status: 404 }
        );
      }
    }

    // 3. Duplicate check for same shift_id and applicant
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id, status, applied_at')
      .eq('shift_id', targetShiftId)
      .eq('crew_person_id', authContext.personId)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        { message: '이미 지원한 공고입니다.' },
        { status: 409 }
      );
    }

    // 4. Insert into applications table with status = 'applied' (conforming to DB constraint)
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert({
        project_id: targetProjectId,
        shift_id: targetShiftId,
        crew_person_id: authContext.personId,
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
      .select('id, project_id, shift_id, crew_person_id, status, applied_at')
      .single();

    if (insertError || !application) {
      console.error('[POST /api/crew/applications] insertError:', insertError);
      return NextResponse.json(
        { message: '지원 신청을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    // Update applicant profile contact details if provided
    if (applicantName || applicantPhone) {
      await supabase
        .from('people')
        .update({
          full_name: applicantName || authContext.fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authContext.personId);
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      shiftId: application.shift_id,
      status: application.status.toUpperCase(),
      appliedAt: application.applied_at,
      message: '지원이 성공적으로 접수되었어요.',
    });
  } catch (err: unknown) {
    console.error('[POST /api/crew/applications] Error:', err);
    return NextResponse.json(
      { message: (err as Error).message || '서버 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
