#!/usr/bin/env node
/**
 * scripts/seed-demo-data.mjs
 * CrewLink MVP Seed Script
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
const refTimeArg = args.find((a) => a.startsWith('--ref-time='))?.split('=')[1];

const NAMESPACE = nsArg || 'crewlink_mvp_socialproof_v1';
const REFERENCE_TIME = refTimeArg ? new Date(refTimeArg) : new Date();

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
  console.error('[seed-demo-data] Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabaseHost = new URL(SUPABASE_URL).host;
const projectRef = supabaseHost.split('.')[0];

if (targetArg && targetArg !== projectRef) {
  console.error(`[seed-demo-data] Target mismatch: expected ${targetArg}, got connected project ${projectRef}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: 'crewlink' },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log(`=== CrewLink MVP Seed Tool ===`);
console.log(`Namespace: ${NAMESPACE}`);
console.log(`Target Project: ${projectRef}`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN (No modifications will be made)' : 'LIVE SEED'}`);
console.log(`Reference Time (KST): ${REFERENCE_TIME.toISOString()}`);
console.log('-------------------------------------------');

// Accounts Specification
const CLIENT_SPECS = [
  {
    email: 'client_metaverse@crewlink.kr',
    name: '넥스트웨이브',
    orgName: '넥스트웨이브 엔터테인먼트',
    ceoName: '이대표',
    fixtureKey: 'client-nextwave',
  },
  {
    email: 'client_exhibition@crewlink.kr',
    name: '코리아MICE',
    orgName: '코리아 MICE 솔루션즈',
    ceoName: '김대표',
    fixtureKey: 'client-mice',
  },
  {
    email: 'client_festival@crewlink.kr',
    name: '라이브컬쳐',
    orgName: '라이브컬쳐 기획',
    ceoName: '박대표',
    fixtureKey: 'client-liveculture',
  },
];

const CREW_SPECS = [
  {
    email: 'crew_doyoon@crewlink.kr',
    name: '김도윤',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0001',
    fixtureKey: 'crew-1',
  },
  {
    email: 'crew_seojun@crewlink.kr',
    name: '박서준',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0002',
    fixtureKey: 'crew-2',
  },
  {
    email: 'crew_jiwon@crewlink.kr',
    name: '이지원',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0003',
    fixtureKey: 'crew-3',
  },
  {
    email: 'crew_minho@crewlink.kr',
    name: '최민호',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0004',
    fixtureKey: 'crew-4',
  },
];

// Calculate KST dates
function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const PROJECT_SPECS = [
  {
    fixtureKey: 'hot-seongsu',
    title: '성수 플래그십 VIP 오프닝 크루',
    clientKey: 'client-nextwave',
    category: 'popup',
    venueName: '성수 테스트 행사장',
    roadAddress: '서울 성동구 연무장길 45',
    detailAddress: '메인 팝업존',
    lat: 37.542154,
    lng: 127.057321,
    startOffsetDays: 7,
    durationDays: 3,
    dailyWageWon: 130000,
    hourlyRateWon: 14444,
    headcountPerShift: 8,
    scopes: ['VIP 의전 및 현장 응대', '관람객 동선 안내', '체험 부스 지원'],
    dressCode: '단정 올블랙 슬랙스 및 셔츠',
  },
  {
    fixtureKey: 'coex-expo',
    title: '코엑스 전시 안내 크루',
    clientKey: 'client-mice',
    category: 'expo',
    venueName: '코엑스',
    roadAddress: '서울 강남구 영동대로 513',
    detailAddress: '3층 D홀 전관',
    lat: 37.511854,
    lng: 127.059287,
    startOffsetDays: 12,
    durationDays: 1,
    dailyWageWon: 125000,
    hourlyRateWon: 13888,
    headcountPerShift: 6,
    scopes: ['전시관 입구 등록 데스크', '행사장 내부 질서 유지'],
    dressCode: '비즈니스 캐주얼 또는 슬랙스',
  },
  {
    fixtureKey: 'kintex-expo',
    title: '킨텍스 박람회 운영 크루',
    clientKey: 'client-mice',
    category: 'expo',
    venueName: '킨텍스',
    roadAddress: '경기 고양시 일산서구 킨텍스로 217',
    detailAddress: '제1전시장 2홀',
    lat: 37.669866,
    lng: 126.747065,
    startOffsetDays: 16,
    durationDays: 1,
    dailyWageWon: 120000,
    hourlyRateWon: 13333,
    headcountPerShift: 5,
    scopes: ['바이어 동선 통제', '무대 음향 주변 질서 안내'],
    dressCode: '어두운 계열 단정한 복장',
  },
  {
    fixtureKey: 'olympic-concert',
    title: '올림픽홀 공연 안내 크루',
    clientKey: 'client-liveculture',
    category: 'festival',
    venueName: '올림픽홀',
    roadAddress: '서울 송파구 올림픽로 424',
    detailAddress: '올림픽공원 올림픽홀 로비',
    lat: 37.517316,
    lng: 127.126438,
    startOffsetDays: 20,
    durationDays: 1,
    dailyWageWon: 135000,
    hourlyRateWon: 15000,
    headcountPerShift: 4,
    scopes: ['티켓 검표 및 입장 동선 관리', '객석 안전 통제'],
    dressCode: '올블랙 복장 및 편안한 운동화',
  },
  {
    fixtureKey: 'yeouido-popup',
    title: '여의도 브랜드 팝업 크루',
    clientKey: 'client-nextwave',
    category: 'popup',
    venueName: '여의도 테스트 행사장',
    roadAddress: '서울 영동구 여의대로 108',
    detailAddress: '지하 2층 팝업 스퀘어',
    lat: 37.525897,
    lng: 126.928426,
    startOffsetDays: 24,
    durationDays: 1,
    dailyWageWon: 125000,
    hourlyRateWon: 13888,
    headcountPerShift: 8,
    scopes: ['대기열 번호표 배부', '사은품 증정 키트 불출'],
    dressCode: '단정 올블랙 슬랙스',
  },
  {
    fixtureKey: 'brand-reception',
    title: '브랜드 리셉션 운영 크루',
    clientKey: 'client-liveculture',
    category: 'brand',
    venueName: '서울 테스트 행사장',
    roadAddress: '서울 중구 세종대로 110',
    detailAddress: '그랜드 볼룸 홀',
    lat: 37.566295,
    lng: 126.977945,
    startOffsetDays: 28,
    durationDays: 1,
    dailyWageWon: 140000,
    hourlyRateWon: 15555,
    headcountPerShift: 6,
    scopes: ['VIP 라운지 체크인', '환영 키트 증정'],
    dressCode: '포멀 정장 또는 자켓 착용',
  },
];

async function main() {
  // Query existing registry records
  const { data: registryRows, error: regErr } = await supabase
    .from('mvp_seed_registry')
    .select('*')
    .eq('namespace', NAMESPACE);

  if (regErr && !regErr.message.includes('relation "crewlink.mvp_seed_registry" does not exist')) {
    console.error('Error fetching registry:', regErr);
    process.exit(1);
  }

  const existingRegistry = new Map();
  for (const r of registryRows || []) {
    existingRegistry.set(`${r.entity_type}:${r.metadata?.fixtureKey || r.entity_id}`, r);
  }

  // Load existing auth users list
  const { data: userListData } = await supabase.auth.admin.listUsers();
  const existingUsers = new Map((userListData?.users || []).map((u) => [u.email, u]));

  const createdEntities = {
    authUsers: 0,
    people: 0,
    orgs: 0,
    projects: 0,
    shifts: 0,
    slots: 0,
    applications: 0,
  };

  const secretsMap = [];

  // Helper for registering
  async function recordRegistry(entityType, entityId, metadata = {}) {
    if (isDryRun) return;
    await supabase.from('mvp_seed_registry').upsert(
      {
        namespace: NAMESPACE,
        entity_type: entityType,
        entity_id: String(entityId),
        metadata,
      },
      { onConflict: 'namespace,entity_type,entity_id' }
    );
  }

  // 1. Process Client Accounts & Orgs
  const resolvedClients = new Map();
  for (const c of CLIENT_SPECS) {
    let authUser = existingUsers.get(c.email);
    const testPassword = `CrewLink2026!${c.fixtureKey}`;

    if (!authUser) {
      if (!isDryRun) {
        const { data: newAuth, error: authErr } = await supabase.auth.admin.createUser({
          email: c.email,
          password: testPassword,
          email_confirm: true,
          user_metadata: { full_name: c.name, role: 'client' },
          app_metadata: { namespace: NAMESPACE, fixtureKey: c.fixtureKey },
        });
        if (authErr || !newAuth?.user) {
          throw new Error(`Failed to create client auth user ${c.email}: ${authErr?.message}`);
        }
        authUser = newAuth.user;
        createdEntities.authUsers++;
      } else {
        createdEntities.authUsers++;
        authUser = { id: `dry-auth-${c.fixtureKey}`, email: c.email };
      }
    }

    secretsMap.push({ email: c.email, role: 'client', name: c.name, password: testPassword });
    await recordRegistry('auth_user', authUser.id, { fixtureKey: c.fixtureKey, email: c.email });

    // Person
    let personId;
    if (!isDryRun) {
      const { data: existingPerson } = await supabase
        .from('people')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const { data: newPerson, error: pErr } = await supabase
          .from('people')
          .insert({
            auth_user_id: authUser.id,
            full_name: c.name,
            display_name: c.name,
            is_active: true,
          })
          .select('id')
          .single();
        if (pErr) throw new Error(`Failed to create person for ${c.email}: ${pErr.message}`);
        personId = newPerson.id;
        createdEntities.people++;
      }

      await supabase.from('platform_roles').upsert(
        { person_id: personId, role: 'client', is_active: true },
        { onConflict: 'person_id,role' }
      );
    } else {
      personId = `dry-person-${c.fixtureKey}`;
      createdEntities.people++;
    }

    await recordRegistry('person', personId, { fixtureKey: c.fixtureKey, role: 'client' });

    // Organization
    let orgId;
    if (!isDryRun) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', c.orgName)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: oErr } = await supabase
          .from('organizations')
          .insert({
            name: c.orgName,
            ceo_name: c.ceoName,
            is_verified: true,
          })
          .select('id')
          .single();
        if (oErr) throw new Error(`Failed to create org ${c.orgName}: ${oErr.message}`);
        orgId = newOrg.id;
        createdEntities.orgs++;
      }

      // Org Member
      await supabase.from('organization_members').upsert(
        {
          organization_id: orgId,
          person_id: personId,
          role: 'owner',
          is_active: true,
        },
        { onConflict: 'organization_id,person_id' }
      );
    } else {
      orgId = `dry-org-${c.fixtureKey}`;
      createdEntities.orgs++;
    }

    await recordRegistry('organization', orgId, { fixtureKey: c.fixtureKey, name: c.orgName });
    resolvedClients.set(c.fixtureKey, { authUser, personId, orgId });
  }

  // 2. Process Crew Accounts
  const resolvedCrews = new Map();
  for (const cr of CREW_SPECS) {
    let authUser = existingUsers.get(cr.email);
    const testPassword = `CrewLink2026!${cr.fixtureKey}`;

    if (!authUser) {
      if (!isDryRun) {
        const { data: newAuth, error: authErr } = await supabase.auth.admin.createUser({
          email: cr.email,
          password: testPassword,
          email_confirm: true,
          user_metadata: { full_name: cr.name, role: 'crew' },
          app_metadata: { namespace: NAMESPACE, fixtureKey: cr.fixtureKey },
        });
        if (authErr || !newAuth?.user) {
          throw new Error(`Failed to create crew auth user ${cr.email}: ${authErr?.message}`);
        }
        authUser = newAuth.user;
        createdEntities.authUsers++;
      } else {
        createdEntities.authUsers++;
        authUser = { id: `dry-auth-${cr.fixtureKey}`, email: cr.email };
      }
    }

    secretsMap.push({ email: cr.email, role: 'crew', name: cr.name, password: testPassword });
    await recordRegistry('auth_user', authUser.id, { fixtureKey: cr.fixtureKey, email: cr.email });

    // Person
    let personId;
    if (!isDryRun) {
      const { data: existingPerson } = await supabase
        .from('people')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const { data: newPerson, error: pErr } = await supabase
          .from('people')
          .insert({
            auth_user_id: authUser.id,
            full_name: cr.name,
            display_name: cr.name,
            is_active: true,
          })
          .select('id')
          .single();
        if (pErr) throw new Error(`Failed to create person for ${cr.email}: ${pErr.message}`);
        personId = newPerson.id;
        createdEntities.people++;
      }

      // Platform role & contact
      await supabase.from('platform_roles').upsert(
        { person_id: personId, role: 'crew', is_active: true },
        { onConflict: 'person_id,role' }
      );
      await supabase.from('private_contact_details').upsert(
        { person_id: personId, phone_number: cr.phone, email: cr.email },
        { onConflict: 'person_id' }
      );

      // Crew Profile
      await supabase.from('crew_profiles').upsert(
        {
          person_id: personId,
          profile_image_url: cr.photoUrl,
          profile_photo_url: cr.photoUrl,
          uniform_size: 'L',
          height_cm: 175,
          top_size: 'L',
          bottom_size: '30',
          shoe_size_mm: 265,
          experience_years: 1.5,
          rating_avg: 5.0,
          total_shifts_completed: 10,
          bio: '약속을 철저히 지키며 불평 불만 없이 주도적인 마인드로 업무에 집중하는 크루입니다.',
        },
        { onConflict: 'person_id' }
      );
    } else {
      personId = `dry-person-${cr.fixtureKey}`;
      createdEntities.people++;
    }

    await recordRegistry('person', personId, { fixtureKey: cr.fixtureKey, role: 'crew' });
    resolvedCrews.set(cr.fixtureKey, { authUser, personId });
  }

  // 3. Process Projects, Shifts & Slots
  const resolvedProjects = new Map();
  for (const p of PROJECT_SPECS) {
    const client = resolvedClients.get(p.clientKey);
    const startDate = addDays(REFERENCE_TIME, p.startOffsetDays);
    const endDate = addDays(REFERENCE_TIME, p.startOffsetDays + p.durationDays - 1);

    const shiftDates = [];
    for (let i = 0; i < p.durationDays; i++) {
      shiftDates.push(addDays(REFERENCE_TIME, p.startOffsetDays + i));
    }

    let projectId;
    if (!isDryRun) {
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', client.orgId)
        .eq('title', p.title)
        .maybeSingle();

      const sowSpec = {
        category: p.category,
        dates: shiftDates,
        headcount: p.headcountPerShift,
        isMultiDay: p.durationDays > 1,
        breakMinutes: 60,
        scopes: p.scopes,
        dressCode: p.dressCode,
        fixtureKey: p.fixtureKey,
      };

      if (existingProject) {
        projectId = existingProject.id;
        await supabase
          .from('projects')
          .update({
            status: 'published',
            start_date: startDate,
            end_date: endDate,
            sow_spec: sowSpec,
            is_demo: true,
          })
          .eq('id', projectId);
      } else {
        const { data: newProj, error: prErr } = await supabase
          .from('projects')
          .insert({
            organization_id: client.orgId,
            title: p.title,
            description: `${p.title} 현장 크루를 모집합니다. 질서 있고 쾌적한 행사 운영을 함께 만들어가요!`,
            venue_name: p.venueName,
            road_address: p.roadAddress,
            detail_address: p.detailAddress,
            latitude: p.lat,
            longitude: p.lng,
            status: 'published',
            start_date: startDate,
            end_date: endDate,
            sow_spec: sowSpec,
            is_demo: true,
          })
          .select('id')
          .single();
        if (prErr) throw new Error(`Failed to create project ${p.title}: ${prErr.message}`);
        projectId = newProj.id;
        createdEntities.projects++;
      }
    } else {
      projectId = `dry-project-${p.fixtureKey}`;
      createdEntities.projects++;
    }

    await recordRegistry('project', projectId, { fixtureKey: p.fixtureKey, title: p.title });

    // Shifts
    const shiftList = [];
    for (let dayIdx = 0; dayIdx < shiftDates.length; dayIdx++) {
      const dateStr = shiftDates[dayIdx];
      const shiftName = `${p.title} (${dateStr})`;
      const startTime = `${dateStr}T09:00:00+09:00`;
      const endTime = `${dateStr}T18:00:00+09:00`;
      const checkinOpensAt = `${dateStr}T08:30:00+09:00`;
      const checkinClosesAt = `${dateStr}T09:15:00+09:00`;

      let shiftId;
      if (!isDryRun) {
        const { data: existingShift } = await supabase
          .from('shifts')
          .select('id')
          .eq('project_id', projectId)
          .eq('date', dateStr)
          .maybeSingle();

        if (existingShift) {
          shiftId = existingShift.id;
        } else {
          const { data: newShift, error: sErr } = await supabase
            .from('shifts')
            .insert({
              project_id: projectId,
              shift_name: shiftName,
              required_headcount: p.headcountPerShift,
              start_time: startTime,
              end_time: endTime,
              checkin_opens_at: checkinOpensAt,
              checkin_closes_at: checkinClosesAt,
              hourly_rate_won: p.hourlyRateWon,
              daily_wage: p.dailyWageWon,
              date: dateStr,
            })
            .select('id')
            .single();
          if (sErr) throw new Error(`Failed to create shift for ${shiftName}: ${sErr.message}`);
          shiftId = newShift.id;
          createdEntities.shifts++;
        }
      } else {
        shiftId = `dry-shift-${p.fixtureKey}-${dayIdx}`;
        createdEntities.shifts++;
      }

      await recordRegistry('shift', shiftId, { fixtureKey: `${p.fixtureKey}-${dayIdx}`, date: dateStr });
      shiftList.push({ shiftId, dateStr });

      // Slots
      for (let slotNum = 1; slotNum <= p.headcountPerShift; slotNum++) {
        let slotId;
        if (!isDryRun) {
          const { data: existingSlot } = await supabase
            .from('shift_slots')
            .select('id')
            .eq('shift_id', shiftId)
            .eq('slot_number', slotNum)
            .maybeSingle();

          if (existingSlot) {
            slotId = existingSlot.id;
          } else {
            const { data: newSlot, error: slErr } = await supabase
              .from('shift_slots')
              .insert({
                shift_id: shiftId,
                slot_number: slotNum,
                position_code: 'CREW_STANDARD',
                status: 'open',
              })
              .select('id')
              .single();
            if (slErr) throw new Error(`Failed to create slot: ${slErr.message}`);
            slotId = newSlot.id;
            createdEntities.slots++;
          }
        } else {
          slotId = `dry-slot-${shiftId}-${slotNum}`;
          createdEntities.slots++;
        }
        await recordRegistry('shift_slot', slotId, { shiftId, slotNum });
      }
    }

    resolvedProjects.set(p.fixtureKey, { projectId, shifts: shiftList });
  }

  // 4. Process Application Fixtures (Section 6)
  // Target: hot-seongsu: Crews 1, 2, 3, 4 each apply for ALL 3 shifts = 12 applications
  // All 4 crews are unique applicants for hot-seongsu.
  // First application of each crew is set within last 24h (e.g. ref - 3h), so newApplicantCount24h = 4!
  // Other projects:
  // - coex-expo: crew-1 applies (1 app), set to ref - 30h (>24h ago)
  // - kintex-expo: crew-2 applies (1 app), set to ref - 32h (>24h ago)
  // - yeouido-popup: crew-3 applies (1 app), set to ref - 34h (>24h ago)
  // olympic-concert, brand-reception: 0 apps
  // Total applications = 12 + 3 = 15 applications!
  const APPLICATION_FIXTURES = [];

  // hot-seongsu
  const seongsu = resolvedProjects.get('hot-seongsu');
  const crewKeys = ['crew-1', 'crew-2', 'crew-3', 'crew-4'];
  for (let cIdx = 0; cIdx < crewKeys.length; cIdx++) {
    const cKey = crewKeys[cIdx];
    const crew = resolvedCrews.get(cKey);
    // Applied within last 24h
    const appliedAt = new Date(REFERENCE_TIME.getTime() - (3 + cIdx) * 3600 * 1000).toISOString();
    for (const sh of seongsu.shifts) {
      APPLICATION_FIXTURES.push({
        projectId: seongsu.projectId,
        shiftId: sh.shiftId,
        crewPersonId: crew.personId,
        appliedAt,
        status: 'applied',
        fixtureKey: `app-seongsu-${cKey}-${sh.dateStr}`,
      });
    }
  }

  // coex-expo (crew-1, 30h ago)
  const coex = resolvedProjects.get('coex-expo');
  APPLICATION_FIXTURES.push({
    projectId: coex.projectId,
    shiftId: coex.shifts[0].shiftId,
    crewPersonId: resolvedCrews.get('crew-1').personId,
    appliedAt: new Date(REFERENCE_TIME.getTime() - 30 * 3600 * 1000).toISOString(),
    status: 'applied',
    fixtureKey: 'app-coex-crew-1',
  });

  // kintex-expo (crew-2, 32h ago)
  const kintex = resolvedProjects.get('kintex-expo');
  APPLICATION_FIXTURES.push({
    projectId: kintex.projectId,
    shiftId: kintex.shifts[0].shiftId,
    crewPersonId: resolvedCrews.get('crew-2').personId,
    appliedAt: new Date(REFERENCE_TIME.getTime() - 32 * 3600 * 1000).toISOString(),
    status: 'applied',
    fixtureKey: 'app-kintex-crew-2',
  });

  // yeouido-popup (crew-3, 34h ago)
  const yeouido = resolvedProjects.get('yeouido-popup');
  APPLICATION_FIXTURES.push({
    projectId: yeouido.projectId,
    shiftId: yeouido.shifts[0].shiftId,
    crewPersonId: resolvedCrews.get('crew-3').personId,
    appliedAt: new Date(REFERENCE_TIME.getTime() - 34 * 3600 * 1000).toISOString(),
    status: 'applied',
    fixtureKey: 'app-yeouido-crew-3',
  });

  for (const app of APPLICATION_FIXTURES) {
    let appId;
    if (!isDryRun) {
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('shift_id', app.shiftId)
        .eq('crew_person_id', app.crewPersonId)
        .maybeSingle();

      if (existingApp) {
        appId = existingApp.id;
      } else {
        const { data: newApp, error: aErr } = await supabase
          .from('applications')
          .insert({
            project_id: app.projectId,
            shift_id: app.shiftId,
            crew_person_id: app.crewPersonId,
            status: app.status,
            applied_at: app.appliedAt,
          })
          .select('id')
          .single();
        if (aErr) throw new Error(`Failed to create application for ${app.fixtureKey}: ${aErr.message}`);
        appId = newApp.id;
        createdEntities.applications++;
      }
    } else {
      appId = `dry-app-${app.fixtureKey}`;
      createdEntities.applications++;
    }

    await recordRegistry('application', appId, { fixtureKey: app.fixtureKey });
  }

  // Write demo accounts secrets locally (git-ignored)
  const secretsDir = path.resolve(process.cwd(), '.secrets');
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
  }
  const secretsFilePath = path.join(secretsDir, 'demo_accounts.json');
  fs.writeFileSync(
    secretsFilePath,
    JSON.stringify(
      {
        namespace: NAMESPACE,
        projectRef,
        generatedAt: new Date().toISOString(),
        accounts: secretsMap,
      },
      null,
      2
    ),
    { mode: 0o600 }
  );

  console.log(`\n=== Execution Summary ===`);
  console.log(`Auth Users:       ${CLIENT_SPECS.length + CREW_SPECS.length} (New created: ${createdEntities.authUsers})`);
  console.log(`People:           ${CLIENT_SPECS.length + CREW_SPECS.length} (New created: ${createdEntities.people})`);
  console.log(`Organizations:    ${CLIENT_SPECS.length} (New created: ${createdEntities.orgs})`);
  console.log(`Projects:         ${PROJECT_SPECS.length} (New created: ${createdEntities.projects})`);
  console.log(`Shifts:           8 (New created: ${createdEntities.shifts})`);
  console.log(`Shift Slots:      53 (New created: ${createdEntities.slots})`);
  console.log(`Applications:     15 (New created: ${createdEntities.applications})`);
  console.log(`- hot-seongsu:    12 applications (4 unique crews, all within 24h)`);
  console.log(`- coex-expo:      1 application (crew-1, >24h)`);
  console.log(`- kintex-expo:    1 application (crew-2, >24h)`);
  console.log(`- yeouido-popup:  1 application (crew-3, >24h)`);
  console.log(`- olympic/brand:  0 applications`);
  console.log(`Login credentials saved securely to: .secrets/demo_accounts.json`);
  console.log(`Status: ${isDryRun ? 'DRY-RUN SUCCESS' : 'SUCCESS'}`);
}

main().catch((err) => {
  console.error('[seed-demo-data] Fatal error:', err);
  process.exit(1);
});
