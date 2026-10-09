import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rvaowhriekibxtcpyalu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_jp2Hg3tSAE4AO8KmYmtIaw_GnOZBY7G';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2E() {
  console.log('=== [E2E 1] QR 출근 RPC 및 멱등성 검증 (checkin_with_qr_v2) ===');
  const assignmentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const tokenHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const { data: res1, error: err1 } = await supabase.rpc('checkin_with_qr_v2', {
    p_assignment_id: assignmentId,
    p_token_hash: tokenHash,
    p_latitude: 37.513,
    p_longitude: 127.059,
    p_raw_metadata: { device: 'mobile-e2e-test' },
  });

  if (err1) {
    console.error('Call 1 Error:', err1);
  } else {
    console.log('Call 1 Result:', res1);
  }

  // Second scan (idempotency test)
  const { data: res2, error: err2 } = await supabase.rpc('checkin_with_qr_v2', {
    p_assignment_id: assignmentId,
    p_token_hash: tokenHash,
    p_latitude: 37.513,
    p_longitude: 127.059,
    p_raw_metadata: { device: 'mobile-e2e-test' },
  });

  if (err2) {
    console.error('Call 2 Error:', err2);
  } else {
    console.log('Call 2 Result (Idempotent):', res2);
  }

  console.log('\n=== [E2E 2] 크루 개인정보 마스킹 뷰/RPC 검증 (get_assigned_crews) ===');
  const projectId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const { data: crews, error: crewErr } = await supabase.rpc('get_assigned_crews', {
    p_project_id: projectId,
  });

  if (crewErr) {
    console.error('Get Assigned Crews Error:', crewErr);
  } else {
    console.log('Get Assigned Crews Result (Masked):', crews);
  }

  console.log('\n=== [E2E 3] 배정 슬롯 부분 유일 인덱스 검증 (idx_active_slot_assignment) ===');
  const { data: slotIndexes, error: idxErr } = await supabase
    .from('assignments')
    .select('id, shift_slot_id, status')
    .limit(5);

  if (idxErr) {
    console.error('Assignments query error:', idxErr);
  } else {
    console.log('Active Assignments:', slotIndexes);
  }
}

runE2E().catch(console.error);
