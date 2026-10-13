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
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const effectiveAuthContext = auth.authContext;
    if (!effectiveAuthContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const newStatus = (body.status || 'approved').toLowerCase();
    const validStatus = newStatus === 'accepted' ? 'approved' : newStatus;

    const supabase = createAdminClient();

    // Call atomic procedure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await (supabase.rpc as any)('select_applicant', {
      p_application_id: applicationId,
      p_new_status: validStatus,
      p_actor_person_id: effectiveAuthContext.personId,
    });

    if (rpcError) {
      console.error('[PATCH /api/client/applications/[id]] select_applicant error:', rpcError);
      const isForbidden = rpcError.code === '42501';
      const isNotFound = rpcError.code === 'P0002';
      const status = isForbidden ? 403 : isNotFound ? 404 : 400;

      return NextResponse.json(
        { message: rpcError.message || '지원 상태를 변경하지 못했습니다.' },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      application: result,
      message:
        validStatus === 'approved'
          ? '크루가 성공적으로 선발 및 배정되었습니다.'
          : validStatus === 'rejected'
            ? '지원을 반려했습니다.'
            : '지원 상태가 변경되었습니다.',
    });
  } catch (err: unknown) {
    console.error('[PATCH /api/client/applications/[id]] error:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
