import { describe, it, expect } from 'vitest';
import { ReplacementService } from './replacement.service';

describe('ReplacementService (동시성 배정 방지 및 충돌 검증)', () => {
  it('동일 슬롯에 대해 2개의 동시 배정 요청 시 1개만 성공하고 1개는 409 Conflict 에러를 반환해야 한다 (Quality Gate 3)', async () => {
    const service = new ReplacementService();
    const requestId = 'req-t30-01';

    // Simulate two concurrent operators or candidates attempting to claim the same vacancy
    // Both start with expectedVersion = 1
    const promise1 = service.atomicClaimReservation(requestId, 'crew-cand-01', 1);
    const promise2 = service.atomicClaimReservation(requestId, 'crew-cand-02', 1);

    const results = await Promise.allSettled([promise1, promise2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 must succeed
    expect(fulfilled.length).toBe(1);
    // Exactly 1 must fail with conflict (409)
    expect(rejected.length).toBe(1);

    if (rejected[0].status === 'rejected') {
      const error = rejected[0].reason as Error & { statusCode?: number };
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain('선점');
    }
  });
});
