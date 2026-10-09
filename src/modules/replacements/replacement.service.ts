/**
 * Emergency Replacement Domain Service
 * Atomically handles T-30 vacancy alarms, nearby candidate queries, and first-come assignment lock.
 */

export interface ReplacementCandidate {
  personId: string;
  name: string;
  distanceKm: number;
  ratingAvg: number;
  totalShifts: number;
  phoneToken: string;
}

export interface ReplacementRequestState {
  id: string;
  shiftId: string;
  slotId: string;
  projectName: string;
  urgencyLevel: 'standard' | 'urgent_t30';
  status: 'open' | 'matched' | 'closed';
  matchedPersonId?: string;
  version: number;
}

// In-memory atomic state store
const mockReplacementRequests = new Map<string, ReplacementRequestState>([
  [
    'req-t30-01',
    {
      id: 'req-t30-01',
      shiftId: 'shift-101',
      slotId: 'POS-08',
      projectName: '2026 서울 모빌리티 엑스포 (무대 대기열 통제)',
      urgencyLevel: 'urgent_t30',
      status: 'open',
      version: 1,
    },
  ],
]);

const mockCandidates: ReplacementCandidate[] = [
  {
    personId: 'crew-cand-01',
    name: '강*민',
    distanceKm: 1.2,
    ratingAvg: 4.96,
    totalShifts: 24,
    phoneToken: '010-****-1192',
  },
  {
    personId: 'crew-cand-02',
    name: '송*우',
    distanceKm: 2.1,
    ratingAvg: 4.88,
    totalShifts: 15,
    phoneToken: '010-****-3341',
  },
  {
    personId: 'crew-cand-03',
    name: '임*아',
    distanceKm: 3.0,
    ratingAvg: 4.92,
    totalShifts: 31,
    phoneToken: '010-****-7789',
  },
];

export class ReplacementService {
  /**
   * Search available nearby qualified crew members within range
   */
  async findNearbyCandidates(shiftId: string): Promise<ReplacementCandidate[]> {
    return [...mockCandidates];
  }

  /**
   * Atomic first-come reservation lock
   * If already matched by another candidate, throws 409 Conflict error
   */
  async atomicClaimReservation(requestId: string, candidatePersonId: string, expectedVersion: number) {
    const request = mockReplacementRequests.get(requestId);
    if (!request) {
      throw new Error('REPLACEMENT_REQUEST_NOT_FOUND');
    }

    // Concurrency lock: version mismatch
    if (request.version !== expectedVersion) {
      const conflictError = new Error('CONCURRENCY_CONFLICT: 타 운영자 또는 타 후보자에 의해 이미 선점되었습니다.');
      (conflictError as unknown as { statusCode: number }).statusCode = 409;
      throw conflictError;
    }

    if (request.status !== 'open') {
      const conflictError = new Error('ALREADY_FILLED: 이미 배정이 완료된 결원 슬롯입니다.');
      (conflictError as unknown as { statusCode: number }).statusCode = 409;
      throw conflictError;
    }

    // Atomic update
    request.status = 'matched';
    request.matchedPersonId = candidatePersonId;
    request.version += 1;
    mockReplacementRequests.set(requestId, request);

    return {
      success: true,
      requestId,
      matchedPersonId: candidatePersonId,
      assignedAt: new Date().toISOString(),
      newVersion: request.version,
    };
  }

  getRequest(requestId: string) {
    return mockReplacementRequests.get(requestId);
  }
}

export const replacementService = new ReplacementService();
