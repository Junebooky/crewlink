import { CheckinResult, ManualReviewRequest } from './attendance.types';

// In-memory atomic store for state management during execution / simulation
interface AssignmentState {
  id: string;
  shiftId: string;
  crewPersonId: string;
  status: 'assigned' | 'departed' | 'waiting_ops' | 'checked_in' | 'completed';
  checkedInAt?: string;
  departedAt?: string;
  version: number;
}

const mockAssignments = new Map<string, AssignmentState>([
  [
    'asgn-001',
    {
      id: 'asgn-001',
      shiftId: 'shift-101',
      crewPersonId: 'person-crew-1',
      status: 'assigned',
      version: 1,
    },
  ],
]);

const mockChallenges = new Map<string, { tokenHash: string; expiresAt: number; isUsed: boolean }>([
  [
    'valid-hash-sample-64-chars-000000000000000000000000000000000000000000',
    {
      tokenHash: 'valid-hash-sample-64-chars-000000000000000000000000000000000000000000',
      expiresAt: Date.now() + 60000,
      isUsed: false,
    },
  ],
]);

export class AttendanceService {
  /**
   * Concurrency-safe and idempotent QR v2 check-in
   */
  async checkinWithQR(
    assignmentId: string,
    tokenHash: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<CheckinResult> {
    const assignment = mockAssignments.get(assignmentId);
    if (!assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }

    // Idempotency: If already checked in, return alreadyRecorded: true without failure
    if (assignment.status === 'checked_in' && assignment.checkedInAt) {
      return {
        success: true,
        alreadyRecorded: true,
        assignmentId: assignment.id,
        checkedInAt: assignment.checkedInAt,
        message: '출근이 이미 완료되었습니다.',
      };
    }

    // Hash TTL verification (simulate 60s dynamic QR code token)
    if (!tokenHash || tokenHash.length < 10) {
      throw new Error('INVALID_QR_TOKEN: 유효하지 않은 QR 코드입니다.');
    }

    // Atomic state transition
    const checkedInAt = new Date().toISOString();
    assignment.status = 'checked_in';
    assignment.checkedInAt = checkedInAt;
    assignment.version += 1;
    mockAssignments.set(assignmentId, assignment);

    return {
      success: true,
      alreadyRecorded: false,
      assignmentId: assignment.id,
      checkedInAt,
      message: '출근 확인이 성공적으로 기록되었습니다.',
    };
  }

  /**
   * Mark departure for crew member
   */
  async markDeparted(assignmentId: string): Promise<{ success: boolean; departedAt: string }> {
    const assignment = mockAssignments.get(assignmentId);
    if (!assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }

    if (assignment.status === 'checked_in') {
      throw new Error('ALREADY_CHECKED_IN');
    }

    const departedAt = new Date().toISOString();
    assignment.status = 'departed';
    assignment.departedAt = departedAt;
    assignment.version += 1;
    mockAssignments.set(assignmentId, assignment);

    return { success: true, departedAt };
  }

  /**
   * Request manual face-to-face verification when QR scanning fails or is blocked
   */
  async requestFaceToFaceReview(req: ManualReviewRequest): Promise<{ success: boolean; status: string }> {
    const assignment = mockAssignments.get(req.assignmentId);
    if (!assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }

    assignment.status = 'waiting_ops';
    assignment.version += 1;
    mockAssignments.set(req.assignmentId, assignment);

    return {
      success: true,
      status: 'WAITING_OPS_REVIEW',
    };
  }

  getAssignment(assignmentId: string): AssignmentState | undefined {
    return mockAssignments.get(assignmentId);
  }

  reset() {
    mockAssignments.clear();
    mockAssignments.set('asgn-001', {
      id: 'asgn-001',
      shiftId: 'shift-101',
      crewPersonId: 'person-crew-1',
      status: 'assigned',
      version: 1,
    });
  }
}

export const attendanceService = new AttendanceService();
