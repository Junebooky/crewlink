import { NextResponse } from 'next/server';
import { attendanceService } from '@/modules/attendance/attendance.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assignmentId, reason, note } = body;

    if (!assignmentId || !reason) {
      return NextResponse.json(
        { message: 'assignmentId와 사유는 필수입니다.' },
        { status: 400 }
      );
    }

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
