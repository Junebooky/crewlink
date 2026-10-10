import { createClient, createAdminClient } from '@/lib/supabase/server';
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
    const supabase = typeof createAdminClient === 'function' ? createAdminClient() : await createClient();

    const { data, error } = await supabase.rpc('checkin_with_qr_v2', {
      p_assignment_id: assignmentId,
      p_token_hash: tokenHash,
      p_latitude: coords?.latitude ?? null,
      p_longitude: coords?.longitude ?? null,
      p_raw_metadata: {},
    });

    if (error) {
      const err = new Error('출근을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      (err as unknown as { code: string; originalMessage: string }).code = 'CHECKIN_FAILED';
      (err as unknown as { originalMessage: string }).originalMessage = error.message;
      throw err;
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
      message: rpcResult.already_recorded ? '이미 도착 확인을 마쳤어요.' : '도착 확인을 마쳤어요.',
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
      const notFoundErr = new Error('배정된 일정을 찾지 못했어요. 일정 화면에서 다시 확인해 주세요.');
      (notFoundErr as unknown as { code: string }).code = 'ASSIGNMENT_NOT_FOUND';
      throw notFoundErr;
    }

    if (assignment.status === 'checked_in') {
      const alreadyErr = new Error('이미 도착 확인을 마쳤어요.');
      (alreadyErr as unknown as { code: string }).code = 'ALREADY_CHECKED_IN';
      throw alreadyErr;
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
      const updateErr = new Error('출발 소식을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      (updateErr as unknown as { code: string; originalMessage: string }).code = 'UPDATE_DEPARTED_FAILED';
      (updateErr as unknown as { originalMessage: string }).originalMessage = updateError.message;
      throw updateErr;
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
      const notFoundErr = new Error('배정된 일정을 찾지 못했어요. 일정 화면에서 다시 확인해 주세요.');
      (notFoundErr as unknown as { code: string }).code = 'ASSIGNMENT_NOT_FOUND';
      throw notFoundErr;
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
      const updateErr = new Error('확인 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      (updateErr as unknown as { code: string; originalMessage: string }).code = 'FACE_TO_FACE_FAILED';
      (updateErr as unknown as { originalMessage: string }).originalMessage = updateError.message;
      throw updateErr;
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
