import { NextResponse } from 'next/server';
import { attendanceService } from '@/modules/attendance/attendance.service';
import { getAuthenticatedContext, verifyAssignmentOwnership } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    // 1. Authentication Guard
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ message: 'assignmentId가 필요합니다.' }, { status: 400 });
    }

    // 2. Ownership Guard
    const ownershipError = await verifyAssignmentOwnership(assignmentId, authContext!.personId);
    if (ownershipError) return ownershipError;

    // 3. Execute State Transition in DB
    const result = await attendanceService.markDeparted(assignmentId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
