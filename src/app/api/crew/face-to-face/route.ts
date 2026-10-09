import { NextResponse } from 'next/server';
import { attendanceService } from '@/modules/attendance/attendance.service';
import { getAuthenticatedContext, verifyAssignmentOwnership } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    // 1. Authentication Guard
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { assignmentId, reason, note } = body;

    if (!assignmentId || !reason) {
      return NextResponse.json(
        { message: 'assignmentId와 사유는 필수입니다.' },
        { status: 400 }
      );
    }

    // 2. Ownership Guard
    const ownershipError = await verifyAssignmentOwnership(assignmentId, authContext!.personId);
    if (ownershipError) return ownershipError;

    // 3. Record face-to-face request in Supabase DB
    const result = await attendanceService.requestFaceToFaceReview({
      assignmentId,
      reason,
      note,
      requestedAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
