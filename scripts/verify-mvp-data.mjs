#!/usr/bin/env node
/**
 * scripts/verify-mvp-data.mjs
 * CrewLink MVP Data Verification Tool
 * Target Namespace: crewlink_mvp_linked_v2
 *
 * Validates:
 * 1. Auth Users & People (3 clients, 14 crews = 17+ total)
 * 2. 12 Projects (E01~E12)
 * 3. 16 Shifts
 * 4. 71 Shift Slots
 * 5. 80 Applications (69 applied, 8 approved, 1 rejected, 2 withdrawn)
 * 6. 47 Valid Crew-Project relationships
 * 7. 8 Active Assignments & Work Reservations
 * 8. Social Proof RPC functionality
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Parse CLI flags
const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith('--target='))?.split('=')[1];

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[verify-mvp-data] Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabaseHost = new URL(SUPABASE_URL).host;
const projectRef = supabaseHost.split('.')[0];

if (targetArg && targetArg !== projectRef) {
  console.error(`[verify-mvp-data] Target mismatch: expected ${targetArg}, got connected project ${projectRef}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: 'crewlink' },
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`===================================================`);
console.log(`       CrewLink MVP Data Verification Tool        `);
console.log(`===================================================`);
console.log(`Target Project:  ${projectRef}`);
console.log(`Timestamp:       ${new Date().toISOString()}`);
console.log(`---------------------------------------------------\n`);

async function runVerification() {
  const results = [];
  let allPassed = true;

  function report(name, expected, actual, pass) {
    if (!pass) allPassed = false;
    results.push({
      item: name,
      expected: String(expected),
      actual: String(actual),
      status: pass ? '✓ PASS' : '✗ FAIL',
    });
  }

  // 1. Auth Users
  const { data: authList, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (authErr) throw authErr;
  const emails = new Set((authList?.users || []).map((u) => u.email?.toLowerCase()));

  const expectedClientEmails = [
    'client_metaverse@crewlink.kr',
    'client_exhibition@crewlink.kr',
    'client_festival@crewlink.kr',
  ];
  const expectedCrewEmails = [
    'crew_doyoon@crewlink.kr',
    'crew_seojun@crewlink.kr',
    'crew_jiwon@crewlink.kr',
    'crew_minho@crewlink.kr',
    'crew_haeun@crewlink.kr',
    'crew_yoojin@crewlink.kr',
    'crew_jiho@crewlink.kr',
    'crew_seoyeon@crewlink.kr',
    'crew_jimin@crewlink.kr',
    'crew_taehyun@crewlink.kr',
    'crew_minjae@crewlink.kr',
    'crew_subin@crewlink.kr',
    'crew_hyunwoo@crewlink.kr',
    'crew_daeun@crewlink.kr',
  ];

  const clientMatchCount = expectedClientEmails.filter((e) => emails.has(e)).length;
  report('Client Auth Users', 3, clientMatchCount, clientMatchCount === 3);

  const crewMatchCount = expectedCrewEmails.filter((e) => emails.has(e)).length;
  report('Crew Auth Users', 14, crewMatchCount, crewMatchCount === 14);

  // 2. People & Roles
  const { data: people, error: pErr } = await supabase
    .from('people')
    .select('id, full_name, platform_roles(role)');
  if (pErr) throw pErr;

  const crewPeople = (people || []).filter((p) =>
    (p.platform_roles || []).some((r) => r.role === 'crew')
  );
  report('Crew People Records', '>= 14', crewPeople.length, crewPeople.length >= 14);

  // 3. Projects (Published & Demo)
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, title, status, is_demo, organization_id')
    .eq('status', 'published')
    .eq('is_demo', true);
  if (projErr) throw projErr;

  const projectCount = projects?.length || 0;
  report('Demo Projects (E01~E12)', 12, projectCount, projectCount === 12);

  const projectIds = (projects || []).map((p) => p.id);

  // 4. Shifts
  const { data: shifts, error: shErr } = await supabase
    .from('shifts')
    .select('id, project_id')
    .in('project_id', projectIds);
  if (shErr) throw shErr;

  const shiftCount = shifts?.length || 0;
  report('Total Shifts', 16, shiftCount, shiftCount === 16);

  const shiftIds = (shifts || []).map((s) => s.id);

  // 5. Shift Slots
  const { data: slots, error: slotErr } = await supabase
    .from('shift_slots')
    .select('id')
    .in('shift_id', shiftIds);
  if (slotErr) throw slotErr;

  const slotCount = slots?.length || 0;
  report('Total Shift Slots', 71, slotCount, slotCount === 71);

  // 6. Applications Breakdown
  const { data: apps, error: appErr } = await supabase
    .from('applications')
    .select('id, project_id, crew_person_id, status')
    .in('project_id', projectIds);
  if (appErr) throw appErr;

  const appCount = apps?.length || 0;
  report('Total Applications', 80, appCount, appCount === 80);

  const statusCounts = { applied: 0, approved: 0, rejected: 0, withdrawn: 0 };
  for (const a of apps || []) {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  }

  report('Applications: Applied', 69, statusCounts.applied, statusCounts.applied === 69);
  report('Applications: Approved', 8, statusCounts.approved, statusCounts.approved === 8);
  report('Applications: Rejected', 1, statusCounts.rejected, statusCounts.rejected === 1);
  report('Applications: Withdrawn', 2, statusCounts.withdrawn, statusCounts.withdrawn === 2);

  // Unique crew-project relations (valid = applied + approved)
  const validApps = (apps || []).filter((a) => a.status === 'applied' || a.status === 'approved');
  const validRelationSet = new Set(validApps.map((a) => `${a.project_id}_${a.crew_person_id}`));
  report('Valid Crew-Project Relations', 47, validRelationSet.size, validRelationSet.size === 47);

  // 7. Active Assignments
  const { data: assignments, error: assignErr } = await supabase
    .from('assignments')
    .select('id, status')
    .in('shift_id', shiftIds)
    .not('status', 'in', '("cancelled","released")');
  if (assignErr) throw assignErr;

  const assignCount = assignments?.length || 0;
  report('Active Assignments', 8, assignCount, assignCount === 8);

  // 8. Social Proof RPC Test
  const { data: socialProof, error: proofErr } = await supabase.rpc('get_events_social_proof', {
    p_project_ids: projectIds,
    p_reference_time: new Date().toISOString(),
    p_is_mvp: true,
  });

  const proofOk = !proofErr && Array.isArray(socialProof) && socialProof.length > 0;
  report('Social Proof RPC Executable', 'true', String(proofOk), proofOk);

  // Print diagnostics table
  console.log('| Metric                          | Expected | Actual   | Status  |');
  console.log('|---------------------------------|----------|----------|---------|');
  for (const r of results) {
    const itemCol = r.item.padEnd(31);
    const expCol = r.expected.padEnd(8);
    const actCol = r.actual.padEnd(8);
    console.log(`| ${itemCol} | ${expCol} | ${actCol} | ${r.status}  |`);
  }
  console.log('\n');

  if (allPassed) {
    console.log('✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED. Please review the table above.');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('[verify-mvp-data] Fatal error:', err);
  process.exit(1);
});
