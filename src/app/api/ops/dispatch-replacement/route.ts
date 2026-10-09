import { NextResponse } from 'next/server';
import { replacementService } from '@/modules/replacements/replacement.service';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    // 1. RBAC Guard: Requires OPS or ADMIN role
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'ops');
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { requestId, candidatePersonId, expectedVersion = 1 } = body;

    if (!requestId || !candidatePersonId) {
      return NextResponse.json(
        { message: '요청과 후보 크루를 다시 확인해 주세요.' },
        { status: 400 }
      );
    }

    // 2. Perform atomic claim backed by PostgreSQL work_reservations exclusion constraint
    const result = await replacementService.atomicClaimReservation(
      requestId,
      candidatePersonId,
      expectedVersion
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorObj = err as Error & { statusCode?: number };
    const status = errorObj.statusCode || 400;
    return NextResponse.json({ message: errorObj.message }, { status });
  }
}
