import { describe, it, expect, beforeEach } from 'vitest';
import { AttendanceService } from './attendance.service';

describe('AttendanceService (출결 RPC 및 멱등성 검증)', () => {
  const service = new AttendanceService();

  beforeEach(() => {
    service.reset();
  });
  it('동일한 assignment_id로 연속 2회 호출 시 두 번째 호출이 alreadyRecorded: true를 반환해야 한다 (Quality Gate 4)', async () => {
    const service = new AttendanceService();
    const assignmentId = 'asgn-001';
    const validTokenHash = 'valid-hash-sample-64-chars-000000000000000000000000000000000000000000';

    // 1st Check-in Call
    const firstCall = await service.checkinWithQR(assignmentId, validTokenHash);
    expect(firstCall.success).toBe(true);
    expect(firstCall.alreadyRecorded).toBe(false);
    expect(firstCall.checkedInAt).toBeDefined();

    // 2nd Idempotent Check-in Call
    const secondCall = await service.checkinWithQR(assignmentId, validTokenHash);
    expect(secondCall.success).toBe(true);
    expect(secondCall.alreadyRecorded).toBe(true);
    expect(secondCall.checkedInAt).toBe(firstCall.checkedInAt);
  });

  it('출발 상태 전송 시 상태가 departed로 전이되어야 한다', async () => {
    const service = new AttendanceService();
    const result = await service.markDeparted('asgn-001');
    expect(result.success).toBe(true);
    expect(result.departedAt).toBeDefined();

    const assignment = service.getAssignment('asgn-001');
    expect(assignment?.status).toBe('departed');
  });

  it('카메라 인식 불가 시 대면 확인 요청 접수가 정상 처리되어야 한다', async () => {
    const service = new AttendanceService();
    const result = await service.requestFaceToFaceReview({
      assignmentId: 'asgn-001',
      reason: 'QR_SCAN_FAILED',
      requestedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('WAITING_OPS_REVIEW');
  });
});
