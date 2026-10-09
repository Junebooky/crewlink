import { NextResponse } from 'next/server';
import { attendanceService } from '@/modules/attendance/attendance.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ message: 'assignmentId가 필요합니다.' }, { status: 400 });
    }

    const result = await attendanceService.markDeparted(assignmentId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
