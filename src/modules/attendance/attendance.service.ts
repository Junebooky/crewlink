import { createClient } from '@/lib/supabase/server';
import { CheckinResult, ManualReviewRequest } from './attendance.types';

export class AttendanceService {
  /**
   * Concurrency-safe and idempotent QR v2 check-in calling Supabase checkin_with_qr_v2 RPC
   */
  async checkinWithQR(
    assignmentId: string,
    tokenHash: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<CheckinResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('checkin_with_qr_v2', {
      p_assignment_id: assignmentId,
      p_token_hash: tokenHash,
      p_latitude: coords?.latitude ?? null,
      p_longitude: coords?.longitude ?? null,
      p_raw_metadata: {},
    });

    if (error) {
      throw new Error(`출근 처리 실패: ${error.message}`);
    }

    const rpcResult = data as {
      success: boolean;
      already_recorded: boolean;
      assignment_id: string;
      checked_in_at: string;
      message: string;
    };

    return {
      success: rpcResult.success,
      alreadyRecorded: rpcResult.already_recorded,
      assignmentId: rpcResult.assignment_id,
      checkedInAt: rpcResult.checked_in_at,
      message: rpcResult.message,
    };
  }

  /**
   * Mark departure for crew member via real Supabase database update
   */
  async markDeparted(assignmentId: string): Promise<{ success: boolean; departedAt: string }> {
    const supabase = await createClient();

    // Fetch assignment to verify current status
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, status, version')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND: 배정 정보를 찾을 수 없습니다.');
    }

    if (assignment.status === 'checked_in') {
      throw new Error('ALREADY_CHECKED_IN: 이미 출근 확인된 과업입니다.');
    }

    const departedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('assignments')
      .update({
        status: 'departed',
        departed_at: departedAt,
        version: assignment.version + 1,
      })
      .eq('id', assignmentId);

    if (updateError) {
      throw new Error(`출발 상태 갱신 실패: ${updateError.message}`);
    }

    return { success: true, departedAt };
  }

  /**
   * Request manual face-to-face verification when QR scanning fails or is blocked
   */
  async requestFaceToFaceReview(req: ManualReviewRequest): Promise<{ success: boolean; status: string }> {
    const supabase = await createClient();

    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, version, crew_person_id')
      .eq('id', req.assignmentId)
      .single();

    if (fetchError || !assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND: 배정 정보를 찾을 수 없습니다.');
    }

    // Update assignment status to waiting_ops
    const { error: updateError } = await supabase
      .from('assignments')
      .update({
        status: 'waiting_ops',
        version: assignment.version + 1,
      })
      .eq('id', req.assignmentId);

    if (updateError) {
      throw new Error(`대면 확인 요청 전송 실패: ${updateError.message}`);
    }

    // Record audit event for ops queue
    await supabase.from('audit_events').insert({
      actor_person_id: assignment.crew_person_id,
      entity_type: 'assignments',
      entity_id: req.assignmentId,
      action: 'REQUEST_FACE_TO_FACE_CHECKIN',
      diff: {
        reason: req.reason,
        note: req.note,
        requested_at: req.requestedAt,
      },
    });

    return {
      success: true,
      status: 'WAITING_OPS_REVIEW',
    };
  }

  async getAssignment(assignmentId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .maybeSingle();

    return data;
  }
}

export const attendanceService = new AttendanceService();
