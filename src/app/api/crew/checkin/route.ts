import { NextResponse } from 'next/server';
import { attendanceService } from '@/modules/attendance/attendance.service';
import { getAuthenticatedContext, verifyAssignmentOwnership } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    // 1. Authentication Guard
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { assignmentId, tokenHash, coords } = body;

    if (!assignmentId || !tokenHash) {
      return NextResponse.json(
        { message: 'QR과 배정 정보를 다시 확인해 주세요.' },
        { status: 400 }
      );
    }

    // 2. Ownership Guard
    const ownershipError = await verifyAssignmentOwnership(assignmentId, authContext!.personId);
    if (ownershipError) return ownershipError;

    // 3. Execute check-in RPC v2 via Supabase
    const result = await attendanceService.checkinWithQR(assignmentId, tokenHash, coords);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
