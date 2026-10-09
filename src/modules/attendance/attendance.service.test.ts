import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceService } from './attendance.service';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('AttendanceService (출결 RPC 및 멱등성 검증)', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('동일한 assignment_id로 연속 2회 호출 시 두 번째 호출이 alreadyRecorded: true를 반환해야 한다 (Quality Gate 4)', async () => {
    const service = new AttendanceService();
    const assignmentId = 'asgn-001';
    const validTokenHash = 'valid-hash-sample-64-chars-000000000000000000000000000000000000000000';
    const checkedInAt = '2026-10-09T10:00:00.000Z';

    let callCount = 0;
    mockSupabase = {
      rpc: vi.fn().mockImplementation((name, args) => {
        if (name === 'checkin_with_qr_v2') {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              data: {
                success: true,
                already_recorded: false,
                assignment_id: args.p_assignment_id,
                checked_in_at: checkedInAt,
                message: '출근 확인 완료',
              },
              error: null,
            });
          } else {
            return Promise.resolve({
              data: {
                success: true,
                already_recorded: true,
                assignment_id: args.p_assignment_id,
                checked_in_at: checkedInAt,
                message: '이미 출근 확인된 과업입니다.',
              },
              error: null,
            });
          }
        }
        return Promise.resolve({ data: null, error: new Error('Unknown RPC') });
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    // 1st Check-in Call
    const firstCall = await service.checkinWithQR(assignmentId, validTokenHash);
    expect(firstCall.success).toBe(true);
    expect(firstCall.alreadyRecorded).toBe(false);
    expect(firstCall.checkedInAt).toBe(checkedInAt);

    // 2nd Idempotent Check-in Call
    const secondCall = await service.checkinWithQR(assignmentId, validTokenHash);
    expect(secondCall.success).toBe(true);
    expect(secondCall.alreadyRecorded).toBe(true);
    expect(secondCall.checkedInAt).toBe(firstCall.checkedInAt);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  });

  it('출발 상태 전송 시 상태가 departed로 전이되어야 한다', async () => {
    const service = new AttendanceService();
    const assignmentId = 'asgn-001';

    let currentStatus = 'assigned';
    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'assignments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: assignmentId, status: currentStatus, version: 1 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn((updates: any) => ({
              eq: vi.fn().mockImplementation(() => {
                currentStatus = updates.status;
                return Promise.resolve({ error: null });
              }),
            })),
          };
        }
        return {};
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await service.markDeparted(assignmentId);
    expect(result.success).toBe(true);
    expect(result.departedAt).toBeDefined();
    expect(currentStatus).toBe('departed');
  });

  it('카메라 인식 불가 시 대면 확인 요청 접수가 정상 처리되어야 한다', async () => {
    const service = new AttendanceService();
    const assignmentId = 'asgn-001';

    let updatedStatus = '';
    const insertAuditMock = vi.fn().mockResolvedValue({ error: null });

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'assignments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: assignmentId,
                    version: 1,
                    crew_person_id: 'person-001',
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn((updates: any) => ({
              eq: vi.fn().mockImplementation(() => {
                updatedStatus = updates.status;
                return Promise.resolve({ error: null });
              }),
            })),
          };
        }
        if (table === 'audit_events') {
          return {
            insert: insertAuditMock,
          };
        }
        return {};
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const result = await service.requestFaceToFaceReview({
      assignmentId,
      reason: 'QR_SCAN_FAILED',
      requestedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('WAITING_OPS_REVIEW');
    expect(updatedStatus).toBe('waiting_ops');
    expect(insertAuditMock).toHaveBeenCalled();
  });
});
