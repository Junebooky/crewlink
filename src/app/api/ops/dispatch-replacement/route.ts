import { NextResponse } from 'next/server';
import { replacementService } from '@/modules/replacements/replacement.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, candidatePersonId, expectedVersion } = body;

    if (!requestId || !candidatePersonId) {
      return NextResponse.json(
        { message: 'requestId 및 candidatePersonId는 필수입니다.' },
        { status: 400 }
      );
    }

    const result = await replacementService.atomicClaimReservation(
      requestId,
      candidatePersonId,
      expectedVersion ?? 1
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorObj = err as Error & { statusCode?: number };
    const status = errorObj.statusCode || 400;
    return NextResponse.json({ message: errorObj.message }, { status });
  }
}
