export type AttendanceStatus =
  | 'ASSIGNED'
  | 'DEPARTED'
  | 'CHECKED_IN'
  | 'WAITING_OPS_REVIEW'
  | 'NO_SHOW'
  | 'COMPLETED';

export type CheckinMethod = 'qr_v2' | 'manual_ops' | 'geofence';

export interface CheckinChallenge {
  shiftId: string;
  tokenHash: string;
  expiresAt: string;
}

export interface CheckinResult {
  success: boolean;
  alreadyRecorded: boolean;
  assignmentId: string;
  checkedInAt: string;
  message: string;
}

export interface ManualReviewRequest {
  assignmentId: string;
  reason: 'CAMERA_PERMISSION_DENIED' | 'QR_SCAN_FAILED' | 'SYSTEM_ERROR';
  note?: string;
  requestedAt: string;
}
