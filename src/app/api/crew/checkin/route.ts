import { NextResponse } from 'next/server';
import { attendanceService } from '@/modules/attendance/attendance.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assignmentId, tokenHash, coords } = body;

    if (!assignmentId || !tokenHash) {
      return NextResponse.json(
        { message: 'assignmentId 및 tokenHash는 필수입니다.' },
        { status: 400 }
      );
    }

    const result = await attendanceService.checkinWithQR(assignmentId, tokenHash, coords);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
