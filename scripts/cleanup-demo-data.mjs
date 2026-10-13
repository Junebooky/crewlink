#!/usr/bin/env node
/**
 * scripts/cleanup-demo-data.mjs
 * CrewLink MVP Cleanup Script
 * Namespace: crewlink_mvp_socialproof_v1
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// 1. Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const targetArg = args.find((a) => a.startsWith('--target='))?.split('=')[1];
const nsArg = args.find((a) => a.startsWith('--namespace='))?.split('=')[1];

const NAMESPACE = nsArg || 'crewlink_mvp_socialproof_v1';

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
  console.error('[cleanup-demo-data] Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabaseHost = new URL(SUPABASE_URL).host;
const projectRef = supabaseHost.split('.')[0];

if (targetArg && targetArg !== projectRef) {
  console.error(`[cleanup-demo-data] Target mismatch: expected ${targetArg}, got connected project ${projectRef}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: 'crewlink' },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log(`=== CrewLink MVP Cleanup Tool ===`);
console.log(`Namespace: ${NAMESPACE}`);
console.log(`Target Project: ${projectRef}`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN (Preview only, no deletions)' : 'LIVE CLEANUP'}`);
console.log('-------------------------------------------');

async function main() {
  // Query all entities tracked in registry for this namespace
  const { data: registryRows, error: regErr } = await supabase
    .from('mvp_seed_registry')
    .select('*')
    .eq('namespace', NAMESPACE);

  if (regErr) {
    if (regErr.message.includes('relation "crewlink.mvp_seed_registry" does not exist')) {
      console.log('Registry table does not exist. Nothing to cleanup.');
      return;
    }
    throw new Error(`Failed to read registry: ${regErr.message}`);
  }

  if (!registryRows || registryRows.length === 0) {
    console.log(`No entities found in registry for namespace "${NAMESPACE}".`);
    return;
  }

  const grouped = {
    application: [],
    shift_slot: [],
    shift: [],
    project: [],
    organization: [],
    person: [],
    auth_user: [],
  };

  for (const r of registryRows) {
    if (grouped[r.entity_type]) {
      grouped[r.entity_type].push(r.entity_id);
    }
  }

  console.log(`Tracked entities in namespace "${NAMESPACE}":`);
  console.log(`- Applications:    ${grouped.application.length}`);
  console.log(`- Shift Slots:     ${grouped.shift_slot.length}`);
  console.log(`- Shifts:          ${grouped.shift.length}`);
  console.log(`- Projects:        ${grouped.project.length}`);
  console.log(`- Organizations:   ${grouped.organization.length}`);
  console.log(`- People:          ${grouped.person.length}`);
  console.log(`- Auth Users:      ${grouped.auth_user.length}`);

  // Safety check: ensure external non-seed applications on demo projects are not blindly wiped
  if (grouped.project.length > 0) {
    const { data: foreignApps } = await supabase
      .from('applications')
      .select('id, project_id, crew_person_id')
      .in('project_id', grouped.project);

    const seedPersonSet = new Set(grouped.person);
    const foreignFound = (foreignApps || []).filter((a) => !seedPersonSet.has(a.crew_person_id));
    if (foreignFound.length > 0) {
      console.warn(`[WARNING] Detected ${foreignFound.length} external applications on demo projects!`);
      console.warn(`Preserving external data and conflicting projects.`);
      const conflictedProjectIds = new Set(foreignFound.map((f) => f.project_id));
      grouped.project = grouped.project.filter((pid) => !conflictedProjectIds.has(pid));
    }
  }

  if (isDryRun) {
    console.log('\n[Dry-Run Preview] The above entities would be deleted safely in dependency order.');
    console.log('No database rows or auth users were modified.');
    return;
  }

  console.log('\n[Live Cleanup] Deleting entities in dependency order...');

  // 1. Applications
  if (grouped.application.length > 0) {
    const { error } = await supabase.from('applications').delete().in('id', grouped.application);
    if (error) console.error('Error deleting applications:', error.message);
    else console.log(`✓ Deleted ${grouped.application.length} applications`);
  }

  // 2. Shift Slots
  if (grouped.shift_slot.length > 0) {
    const { error } = await supabase.from('shift_slots').delete().in('id', grouped.shift_slot);
    if (error) console.error('Error deleting shift_slots:', error.message);
    else console.log(`✓ Deleted ${grouped.shift_slot.length} shift slots`);
  }

  // 3. Shifts
  if (grouped.shift.length > 0) {
    const { error } = await supabase.from('shifts').delete().in('id', grouped.shift);
    if (error) console.error('Error deleting shifts:', error.message);
    else console.log(`✓ Deleted ${grouped.shift.length} shifts`);
  }

  // 4. Projects
  if (grouped.project.length > 0) {
    const { error } = await supabase.from('projects').delete().in('id', grouped.project);
    if (error) console.error('Error deleting projects:', error.message);
    else console.log(`✓ Deleted ${grouped.project.length} projects`);
  }

  // 5. Organization Members
  if (grouped.organization.length > 0) {
    await supabase.from('organization_members').delete().in('organization_id', grouped.organization);
  }

  // 6. Organizations
  if (grouped.organization.length > 0) {
    const { error } = await supabase.from('organizations').delete().in('id', grouped.organization);
    if (error) console.error('Error deleting organizations:', error.message);
    else console.log(`✓ Deleted ${grouped.organization.length} organizations`);
  }

  // 7. Crew Profiles, Contact Details, Platform Roles
  if (grouped.person.length > 0) {
    await supabase.from('crew_profiles').delete().in('person_id', grouped.person);
    await supabase.from('private_contact_details').delete().in('person_id', grouped.person);
    await supabase.from('platform_roles').delete().in('person_id', grouped.person);
    const { error } = await supabase.from('people').delete().in('id', grouped.person);
    if (error) console.error('Error deleting people:', error.message);
    else console.log(`✓ Deleted ${grouped.person.length} people records`);
  }

  // 8. Auth Users
  let authUsersDeleted = 0;
  for (const authUserId of grouped.auth_user) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(authUserId);
      if (!error) authUsersDeleted++;
    } catch (e) {
      console.warn(`Failed to delete auth user ${authUserId}:`, e.message);
    }
  }
  console.log(`✓ Deleted ${authUsersDeleted} Auth users`);

  // 9. Registry entries
  const { error: regDelErr } = await supabase
    .from('mvp_seed_registry')
    .delete()
    .eq('namespace', NAMESPACE);

  if (regDelErr) console.error('Error deleting registry records:', regDelErr.message);
  else console.log(`✓ Removed registry tracking records for namespace "${NAMESPACE}"`);

  console.log('\n=== Cleanup Completed Successfully ===');
}

main().catch((err) => {
  console.error('[cleanup-demo-data] Fatal error:', err);
  process.exit(1);
});
