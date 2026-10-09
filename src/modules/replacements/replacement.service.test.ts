import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReplacementService } from './replacement.service';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('ReplacementService (동시성 배정 방지 및 충돌 검증)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('존재하지 않는 후보 ID로 배정 요청 시 404 CANDIDATE_NOT_FOUND 에러를 반환해야 한다', async () => {
    const service = new ReplacementService();
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'people') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    await expect(
      service.atomicClaimReservation('req-01', 'non-existent-crew', 1)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('CANDIDATE_NOT_FOUND'),
    });
  });

  it('존재하지 않는 결원 요청 ID 시 404 REPLACEMENT_REQUEST_NOT_FOUND 에러를 반환해야 한다', async () => {
    const service = new ReplacementService();
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'people') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'crew-01', full_name: '홍길동', is_active: true },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'replacement_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    await expect(
      service.atomicClaimReservation('req-non-existent', 'crew-01', 1)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('REPLACEMENT_REQUEST_NOT_FOUND'),
    });
  });

  it('동일 슬롯에 대해 2개의 동시 배정 요청 시 1개만 성공하고 1개는 409 Conflict 에러를 반환해야 한다 (Quality Gate 3)', async () => {
    const service = new ReplacementService();
    const requestId = 'req-t30-01';

    // State maintained in shared DB simulation
    let currentVersion = 1;
    let requestStatus = 'open';
    const reservations: string[] = [];

    const createDbInstance = () => ({
      from: vi.fn((table: string) => {
        if (table === 'people') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col, val) => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: val, full_name: '크루', is_active: true },
                  error: null,
                }),
              })),
            }),
          };
        }
        if (table === 'replacement_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(() =>
                  Promise.resolve({
                    data: {
                      id: requestId,
                      assignment_id: 'asgn-01',
                      shift_id: 'shift-01',
                      status: requestStatus,
                      version: currentVersion,
                    },
                    error: null,
                  })
                ),
              }),
            }),
            update: vi.fn((updates: any) => ({
              eq: vi.fn().mockImplementation(() => {
                currentVersion = updates.version;
                requestStatus = updates.status;
                return Promise.resolve({ error: null });
              }),
            })),
          };
        }
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    start_time: '2026-10-09T10:00:00Z',
                    end_time: '2026-10-09T18:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'work_reservations') {
          return {
            insert: vi.fn((record: any) => {
              if (reservations.includes(record.assignment_id)) {
                return Promise.resolve({
                  error: { code: '23P01', message: 'conflicting key value violates exclusion constraint' },
                });
              }
              reservations.push(record.assignment_id);
              return Promise.resolve({ error: null });
            }),
          };
        }
        if (table === 'assignments') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    });

    (createClient as any).mockImplementation(() => Promise.resolve(createDbInstance()));

    // Simulate concurrent requests
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
      expect(error.message).toContain('CONCURRENCY_CONFLICT');
    }
  });

  it('work_reservations 배타 제약 충돌 시 409 CONCURRENCY_CONFLICT 에러를 반환해야 한다', async () => {
    const service = new ReplacementService();
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'people') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'crew-01', full_name: '홍길동', is_active: true },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'replacement_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'req-01',
                    assignment_id: 'asgn-01',
                    shift_id: 'shift-01',
                    status: 'open',
                    version: 1,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { start_time: '2026-10-09T10:00:00Z', end_time: '2026-10-09T18:00:00Z' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'work_reservations') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { code: '23P01', message: 'overlapping reservation range' },
            }),
          };
        }
        return {};
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    await expect(
      service.atomicClaimReservation('req-01', 'crew-01', 1)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('CONCURRENCY_CONFLICT'),
    });
  });
});
