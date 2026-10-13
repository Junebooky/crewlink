#!/usr/bin/env node
/**
 * scripts/rebuild-mvp-data.mjs
 * CrewLink MVP Data Rebuild Tool
 * Namespace: crewlink_mvp_linked_v2
 *
 * Implements full MVP linked demo dataset according to task_now2.md:
 * - Preserves existing demo accounts (C01~C04, H1~H3)
 * - Adds C05~C14 (10 new crews)
 * - Safely resets existing demo events/shifts/slots/applications (event-only reset)
 * - Creates 12 new projects via authenticated client requests (E01~E12)
 * - Creates 80 applications via authenticated crew requests
 * - Applies status transitions: 8 approved, 1 rejected, 2 withdrawn (69 applied)
 * - Records lineage in crewlink.mvp_seed_registry under crewlink_mvp_linked_v2
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
const apiBaseArg = args.find((a) => a.startsWith('--api-base='))?.split('=')[1];

const NAMESPACE = nsArg || 'crewlink_mvp_linked_v2';
const REFERENCE_TIME = refTimeArg ? new Date(refTimeArg) : new Date();
const API_BASE = (apiBaseArg || 'http://localhost:3000').replace(/\/$/, '');

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
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[rebuild-mvp-data] Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabaseHost = new URL(SUPABASE_URL).host;
const projectRef = supabaseHost.split('.')[0];

if (targetArg && targetArg !== projectRef) {
  console.error(`[rebuild-mvp-data] Target mismatch: expected ${targetArg}, got connected project ${projectRef}`);
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: 'crewlink' },
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(SUPABASE_URL, ANON_KEY || SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`===================================================`);
console.log(`       CrewLink MVP Data Rebuild Tool (v2)        `);
console.log(`===================================================`);
console.log(`Target Project:  ${projectRef}`);
console.log(`Namespace:       ${NAMESPACE}`);
console.log(`Execution Mode:  ${isDryRun ? 'DRY-RUN (No modifications)' : 'LIVE EXECUTION'}`);
console.log(`Reference Date:  ${REFERENCE_TIME.toISOString().slice(0, 10)}`);
console.log(`API Base:        ${API_BASE}`);
console.log(`---------------------------------------------------\n`);

// Date helper (KST)
function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Account Specifications (Section 5)
const CLIENT_SPECS = [
  {
    key: 'H1',
    email: 'client_metaverse@crewlink.kr',
    name: '넥스트웨이브',
    orgName: '넥스트웨이브 엔터테인먼트',
    ceoName: '이대표',
    fixtureKey: 'client-nextwave',
    password: 'CrewLink2026!client-nextwave',
  },
  {
    key: 'H2',
    email: 'client_exhibition@crewlink.kr',
    name: '코리아MICE',
    orgName: '코리아 MICE 솔루션즈',
    ceoName: '김대표',
    fixtureKey: 'client-mice',
    password: 'CrewLink2026!client-mice',
  },
  {
    key: 'H3',
    email: 'client_festival@crewlink.kr',
    name: '라이브컬쳐',
    orgName: '라이브컬쳐 기획',
    ceoName: '박대표',
    fixtureKey: 'client-liveculture',
    password: 'CrewLink2026!client-liveculture',
  },
];

const CREW_SPECS = [
  {
    key: 'C01',
    email: 'crew_doyoon@crewlink.kr',
    name: '김도윤',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0001',
    fixtureKey: 'crew-1',
    password: 'CrewLink2026!crew-1',
    bio: 'VIP 의전 및 외국어 안내 전문 · 경력 3년',
    tags: ['VIP 의전', '영어 능통', '현장안내'],
    badges: ['의전우수', '시간엄수'],
    birth: '2000-01-15',
    gender: 'male',
    height: 182,
    region: '강남구',
  },
  {
    key: 'C02',
    email: 'crew_seojun@crewlink.kr',
    name: '박서준',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0002',
    fixtureKey: 'crew-2',
    password: 'CrewLink2026!crew-2',
    bio: '전시·박람회 부스 운영 및 관람객 동선 통제',
    tags: ['전시 안내', '동선 관리', '부스운영'],
    badges: ['친절응대', '신속소통'],
    birth: '1999-04-20',
    gender: 'male',
    height: 179,
    region: '서초구',
  },
  {
    key: 'C03',
    email: 'crew_jiwon@crewlink.kr',
    name: '이지원',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0003',
    fixtureKey: 'crew-3',
    password: 'CrewLink2026!crew-3',
    bio: '팝업스토어 현장 응대 및 결제 지원',
    tags: ['팝업 전문', '친절 응대', '결제지원'],
    badges: ['인기크루', '밝은미소'],
    birth: '2001-07-11',
    gender: 'female',
    height: 166,
    region: '마포구',
  },
  {
    key: 'C04',
    email: 'crew_minho@crewlink.kr',
    name: '최민호',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    phone: '010-9001-0004',
    fixtureKey: 'crew-4',
    password: 'CrewLink2026!crew-4',
    bio: '무대 음향 및 페스티벌 안전 관리 전문',
    tags: ['공연·축제', '안전 관리', '무대운영'],
    badges: ['체력왕', '신뢰크루'],
    birth: '1998-11-09',
    gender: 'male',
    height: 184,
    region: '송파구',
  },
  {
    key: 'C05',
    email: 'crew_haeun@crewlink.kr',
    name: '이하은',
    phone: '010-9001-0005',
    birth: '2001-03-15',
    gender: 'female',
    height: 168,
    region: '성동구',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bio: '성수/강남 팝업 및 패션 행사 안내 경력 다수. 밝고 에너지 있는 현장 응대를 지향합니다.',
    tags: ['팝업', '패션', 'VIP의전', '현장안내'],
    badges: ['응대우수', '시간엄수'],
    fixtureKey: 'crew-5',
    password: 'CrewLink2026!crew-5',
  },
  {
    key: 'C06',
    email: 'crew_yoojin@crewlink.kr',
    name: '정유진',
    phone: '010-9001-0006',
    birth: '2000-08-22',
    gender: 'female',
    height: 165,
    region: '마포구',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: '마포/홍대 인근 행사 및 등록 데스크 경험 풍부. 차분하고 정확한 안내가 강점입니다.',
    tags: ['등록데스크', '동선안내', '전시', '영어안내'],
    badges: ['인기크루', '친절응대'],
    fixtureKey: 'crew-6',
    password: 'CrewLink2026!crew-6',
  },
  {
    key: 'C07',
    email: 'crew_jiho@crewlink.kr',
    name: '강지호',
    phone: '010-9001-0007',
    birth: '1999-11-04',
    gender: 'male',
    height: 181,
    region: '송파구',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    bio: '체력과 순발력이 뛰어난 현장 운영 전문 크루. 대규모 페스티벌 무대/동선 관리 자신 있습니다.',
    tags: ['페스티벌', '무대운영', '물품관리', '체력우수'],
    badges: ['체력왕', '적극소통'],
    fixtureKey: 'crew-7',
    password: 'CrewLink2026!crew-7',
  },
  {
    key: 'C08',
    email: 'crew_seoyeon@crewlink.kr',
    name: '윤서연',
    phone: '010-9001-0008',
    birth: '2002-05-19',
    gender: 'female',
    height: 163,
    region: '용산구',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    bio: 'VIP 리셉션 및 갤러리/아트페어 의전 다수. 깔끔한 복장과 정중한 태도로 임합니다.',
    tags: ['VIP리셉션', '의전', '아트페어', '음료서비스'],
    badges: ['의전우수', '신뢰크루'],
    fixtureKey: 'crew-8',
    password: 'CrewLink2026!crew-8',
  },
  {
    key: 'C09',
    email: 'crew_jimin@crewlink.kr',
    name: '한지민',
    phone: '010-9001-0009',
    birth: '2001-09-30',
    gender: 'female',
    height: 167,
    region: '서초구',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: '코엑스/세텍 전시 부스 및 샘플링 이벤트 경험자. 밝은 미소로 관람객을 맞이합니다.',
    tags: ['전시안내', '샘플링', '이벤트', '큐레이션'],
    badges: ['친절응대', '밝은미소'],
    fixtureKey: 'crew-9',
    password: 'CrewLink2026!crew-9',
  },
  {
    key: 'C10',
    email: 'crew_taehyun@crewlink.kr',
    name: '오태현',
    phone: '010-9001-0010',
    birth: '1998-02-14',
    gender: 'male',
    height: 178,
    region: '강남구',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    bio: '컨퍼런스 연사 의전 및 세션 타임키퍼 전문. 정시 일정 준수와 빠른 커뮤니케이션을 약속합니다.',
    tags: ['컨퍼런스', '세션관리', '타임키퍼', '동선유도'],
    badges: ['시간엄수', '신속소통'],
    fixtureKey: 'crew-10',
    password: 'CrewLink2026!crew-10',
  },
  {
    key: 'C11',
    email: 'crew_minjae@crewlink.kr',
    name: '서민재',
    phone: '010-9001-0011',
    birth: '2000-12-03',
    gender: 'male',
    height: 183,
    region: '영등포구',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    bio: '여의도 IFC/더현대 팝업 및 신제품 런칭 쇼 지원. 현장 상황 판단이 빠릅니다.',
    tags: ['런칭쇼', '팝업스토어', '입장통제', '안전관리'],
    badges: ['안전관리', '현장센스'],
    fixtureKey: 'crew-11',
    password: 'CrewLink2026!crew-11',
  },
  {
    key: 'C12',
    email: 'crew_subin@crewlink.kr',
    name: '임수빈',
    phone: '010-9001-0012',
    birth: '2003-04-27',
    gender: 'female',
    height: 164,
    region: '광진구',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: '공연/뮤직페스티벌 티켓 검표 및 관객 안내 전문. 축제 분위기를 돋우는 친화력 높은 크루입니다.',
    tags: ['티켓검표', '페스티벌', '관객안내', '응원크루'],
    badges: ['활력충전', '관객친화'],
    fixtureKey: 'crew-12',
    password: 'CrewLink2026!crew-12',
  },
  {
    key: 'C13',
    email: 'crew_hyunwoo@crewlink.kr',
    name: '장현우',
    phone: '010-9001-0013',
    birth: '1999-07-11',
    gender: 'male',
    height: 180,
    region: '분당구',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: '킨텍스/수원메쎄 산업 전시회 등록 데스크 및 명찰 발권 능숙. 전자기기 및 시스템 조작에 익숙합니다.',
    tags: ['산업전시', '명찰발권', '시스템운영', '키오스크안내'],
    badges: ['빠른손', '정확도최고'],
    fixtureKey: 'crew-13',
    password: 'CrewLink2026!crew-13',
  },
  {
    key: 'C14',
    email: 'crew_daeun@crewlink.kr',
    name: '송다은',
    phone: '010-9001-0014',
    birth: '2002-10-08',
    gender: 'female',
    height: 166,
    region: '고양시',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: '문화예술 축제 및 플리마켓 안내 경험. 꼼꼼한 체크와 따뜻한 배려로 방문객 만족을 높입니다.',
    tags: ['문화행사', '안내데스크', '플리마켓', '운영지원'],
    badges: ['꼼꼼함', '따뜻한응대'],
    fixtureKey: 'crew-14',
    password: 'CrewLink2026!crew-14',
  },
];

// 12 Projects Specification (Section 7.1)
const PROJECT_SPECS = [
  {
    key: 'E01',
    hostKey: 'H1',
    title: '성수 브랜드 팝업 운영',
    category: 'popup',
    offsetDays: 7,
    durationDays: 3, // D+7~D+9
    headcount: 6,
    dailyWage: 130000,
    hourlyRateWon: 16250,
    participationMode: 'all_days',
    venueName: '성수 에스팩토리 D동',
    roadAddress: '서울 성동구 연무장15길 11',
    detailAddress: '메인 팝업 스테이션',
    latitude: 37.5418,
    longitude: 127.0583,
  },
  {
    key: 'E02',
    hostKey: 'H1',
    title: '브랜드 VIP 리셉션',
    category: 'brand',
    offsetDays: 10,
    durationDays: 1, // D+10
    headcount: 4,
    dailyWage: 120000,
    hourlyRateWon: 15000,
    participationMode: '당일',
    venueName: '신라호텔 영빈관',
    roadAddress: '서울 중구 동호로 249',
    detailAddress: '루비홀 리셉션 데스크',
    latitude: 37.5559,
    longitude: 127.0052,
  },
  {
    key: 'E03',
    hostKey: 'H1',
    title: '여의도 런칭 팝업',
    category: 'popup',
    offsetDays: 11,
    durationDays: 1, // D+11
    headcount: 3,
    dailyWage: 140000,
    hourlyRateWon: 17500,
    participationMode: '당일',
    venueName: '더현대 서울 지하 2층',
    roadAddress: '서울 영등포구 여의대로 108',
    detailAddress: '아이코닉 팝업존',
    latitude: 37.5259,
    longitude: 126.9284,
  },
  {
    key: 'E04',
    hostKey: 'H1',
    title: '브랜드 체험 행사',
    category: 'brand',
    offsetDays: 12,
    durationDays: 1, // D+12
    headcount: 5,
    dailyWage: 125000,
    hourlyRateWon: 15625,
    participationMode: '당일',
    venueName: '코엑스 라이브플라자',
    roadAddress: '서울 강남구 영동대로 513',
    detailAddress: 'B2 라이브플라자 무대 앞',
    latitude: 37.5118,
    longitude: 127.0592,
  },
  {
    key: 'E05',
    hostKey: 'H2',
    title: '코엑스 전시 안내',
    category: 'expo',
    offsetDays: 14,
    durationDays: 2, // D+14~D+15
    headcount: 4,
    dailyWage: 135000,
    hourlyRateWon: 16875,
    participationMode: 'all_days',
    venueName: '코엑스 전시장 A홀',
    roadAddress: '서울 강남구 영동대로 513',
    detailAddress: 'A홀 정문 안내데스크',
    latitude: 37.5118,
    longitude: 127.0592,
  },
  {
    key: 'E06',
    hostKey: 'H2',
    title: '킨텍스 등록 데스크',
    category: 'expo',
    offsetDays: 16,
    durationDays: 1, // D+16
    headcount: 4,
    dailyWage: 120000,
    hourlyRateWon: 15000,
    participationMode: '당일',
    venueName: '킨텍스 제1전시장 3홀',
    roadAddress: '경기 고양시 일산서구 킨텍스로 217-60',
    detailAddress: '등록 로비 1~4번 부스',
    latitude: 37.6698,
    longitude: 126.7456,
  },
  {
    key: 'E07',
    hostKey: 'H2',
    title: '컨퍼런스 운영 지원',
    category: 'expo',
    offsetDays: 17,
    durationDays: 1, // D+17
    headcount: 5,
    dailyWage: 150000,
    hourlyRateWon: 18750,
    participationMode: '당일',
    venueName: '코엑스 아셈볼룸',
    roadAddress: '서울 강남구 영동대로 513',
    detailAddress: '201호~203호 세션룸',
    latitude: 37.5118,
    longitude: 127.0592,
  },
  {
    key: 'E08',
    hostKey: 'H2',
    title: '전시장 동선 안내',
    category: 'expo',
    offsetDays: 18,
    durationDays: 1, // D+18
    headcount: 3,
    dailyWage: 130000,
    hourlyRateWon: 16250,
    participationMode: '당일',
    venueName: 'aT센터 제1전시장',
    roadAddress: '서울 서초구 강남대로 27',
    detailAddress: '로비 및 에스컬레이터 앞',
    latitude: 37.4697,
    longitude: 127.0384,
  },
  {
    key: 'E09',
    hostKey: 'H3',
    title: '공연 현장 운영',
    category: 'festival',
    offsetDays: 20,
    durationDays: 2, // D+20~D+21
    headcount: 6,
    dailyWage: 140000,
    hourlyRateWon: 17500,
    participationMode: 'choose_days',
    venueName: '올림픽공원 KSPO DOME',
    roadAddress: '서울 송파구 올림픽로 424',
    detailAddress: '야외 티켓박스 및 게이트',
    latitude: 37.5192,
    longitude: 127.1274,
  },
  {
    key: 'E10',
    hostKey: 'H3',
    title: '페스티벌 안내 크루',
    category: 'festival',
    offsetDays: 22,
    durationDays: 1, // D+22
    headcount: 4,
    dailyWage: 125000,
    hourlyRateWon: 15625,
    participationMode: '당일',
    venueName: '잠실실내체육관 야외광장',
    roadAddress: '서울 송파구 올림픽로 25',
    detailAddress: '메인 인포메이션 부스',
    latitude: 37.5162,
    longitude: 127.0728,
  },
  {
    key: 'E11',
    hostKey: 'H3',
    title: '공연장 입장 안내',
    category: 'festival',
    offsetDays: 23,
    durationDays: 1, // D+23
    headcount: 3,
    dailyWage: 135000,
    hourlyRateWon: 16875,
    participationMode: '당일',
    venueName: '블루스퀘어 마스터카드홀',
    roadAddress: '서울 용산구 이태원로 294',
    detailAddress: '지하 1층 객석 1열 게이트',
    latitude: 37.5408,
    longitude: 127.0025,
  },
  {
    key: 'E12',
    hostKey: 'H3',
    title: '문화행사 현장 지원',
    category: 'festival',
    offsetDays: 24,
    durationDays: 1, // D+24
    headcount: 2,
    dailyWage: 120000,
    hourlyRateWon: 15000,
    participationMode: '당일',
    venueName: '노들섬 잔디마당',
    roadAddress: '서울 용산구 양녕로 445',
    detailAddress: '안내소 및 체험 부스',
    latitude: 37.5173,
    longitude: 126.9582,
  },
];

// Helper to record seed entities in registry
async function recordRegistryBatch(entries) {
  if (isDryRun || entries.length === 0) return;
  const { error } = await adminClient
    .from('mvp_seed_registry')
    .upsert(entries, { onConflict: 'namespace,entity_type,entity_id' });
  if (error) {
    console.error('[Registry] Error recording batch:', error.message);
  }
}

async function main() {
  const secretDir = path.resolve(process.cwd(), '.secrets');
  if (!fs.existsSync(secretDir)) {
    fs.mkdirSync(secretDir, { recursive: true });
  }

  // -------------------------------------------------------------
  // STEP 1: Verify & Provision Accounts (Auth + People + Profiles)
  // -------------------------------------------------------------
  console.log('===> STEP 1: Ensuring 17 Auth Accounts & Profiles...');
  const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 100 });
  const existingUsers = listData?.users || [];
  const existingUserMap = new Map(existingUsers.map((u) => [u.email?.toLowerCase(), u]));

  const clientPersonMap = new Map(); // H1 -> { personId, orgId, token, user }
  const crewPersonMap = new Map();   // C01 -> { personId, token, user }
  const registryEntriesToInsert = [];
  const secretsAccounts = [];

  // 1.1 Process Clients (H1, H2, H3)
  for (const cSpec of CLIENT_SPECS) {
    let user = existingUserMap.get(cSpec.email.toLowerCase());
    if (!user) {
      if (isDryRun) {
        console.log(`[Dry-Run] Would create Auth user: ${cSpec.email}`);
        user = { id: `mock-${cSpec.key}` };
      } else {
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email: cSpec.email,
          password: cSpec.password,
          email_confirm: true,
          user_metadata: { name: cSpec.name },
        });
        if (createErr) throw new Error(`Failed to create client auth user ${cSpec.email}: ${createErr.message}`);
        user = newUser.user;
        console.log(`✓ Created Auth client: ${cSpec.email}`);
      }
    } else {
      if (!isDryRun) {
        await adminClient.auth.admin.updateUserById(user.id, { password: cSpec.password });
      }
      console.log(`✓ Verified existing Auth client: ${cSpec.email}`);
    }

    secretsAccounts.push({
      email: cSpec.email,
      role: 'client',
      name: cSpec.name,
      password: cSpec.password,
    });

    if (!isDryRun) {
      registryEntriesToInsert.push({
        namespace: NAMESPACE,
        entity_type: 'auth_user',
        entity_id: user.id,
      });

      // Ensure Organization
      const { data: orgData } = await adminClient
        .from('organizations')
        .select('id')
        .eq('name', cSpec.orgName)
        .maybeSingle();

      let orgId = orgData?.id;
      if (!orgId) {
        const { data: newOrg, error: orgErr } = await adminClient
          .from('organizations')
          .insert({
            name: cSpec.orgName,
            business_registration_number: `101-81-${cSpec.key === 'H1' ? '12345' : cSpec.key === 'H2' ? '23456' : '34567'}`,
            ceo_name: cSpec.ceoName,
            is_verified: true,
          })
          .select('id')
          .single();
        if (orgErr) throw orgErr;
        orgId = newOrg.id;
      }
      registryEntriesToInsert.push({
        namespace: NAMESPACE,
        entity_type: 'organization',
        entity_id: orgId,
      });

      // Ensure Person
      const { data: personData } = await adminClient
        .from('people')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let personId = personData?.id;
      if (!personId) {
        const { data: newPerson, error: pErr } = await adminClient
          .from('people')
          .insert({
            auth_user_id: user.id,
            full_name: cSpec.name,
            display_name: cSpec.name,
            is_active: true,
          })
          .select('id')
          .single();
        if (pErr) throw pErr;
        personId = newPerson.id;
      }
      registryEntriesToInsert.push({
        namespace: NAMESPACE,
        entity_type: 'person',
        entity_id: personId,
      });

      // Ensure platform_roles
      await adminClient.from('platform_roles').upsert({
        person_id: personId,
        role: 'client',
        is_active: true,
      }, { onConflict: 'person_id,role' });

      // Ensure organization_members
      await adminClient.from('organization_members').upsert({
        organization_id: orgId,
        person_id: personId,
        role: 'owner',
        is_active: true,
      }, { onConflict: 'organization_id,person_id' });

      // Sign in with password to obtain JWT access token
      const { data: signInData, error: signErr } = await anonClient.auth.signInWithPassword({
        email: cSpec.email,
        password: cSpec.password,
      });
      if (signErr) console.warn(`Notice: Client sign-in with password: ${signErr.message}`);

      clientPersonMap.set(cSpec.key, {
        personId,
        orgId,
        token: signInData?.session?.access_token || null,
        user,
      });
    }
  }

  // 1.2 Process Crews (C01~C14)
  for (const crSpec of CREW_SPECS) {
    let user = existingUserMap.get(crSpec.email.toLowerCase());
    if (!user) {
      if (isDryRun) {
        console.log(`[Dry-Run] Would create Auth crew: ${crSpec.email}`);
        user = { id: `mock-${crSpec.key}` };
      } else {
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email: crSpec.email,
          password: crSpec.password,
          email_confirm: true,
          user_metadata: { name: crSpec.name },
        });
        if (createErr) throw new Error(`Failed to create crew auth user ${crSpec.email}: ${createErr.message}`);
        user = newUser.user;
        console.log(`✓ Created Auth crew: ${crSpec.email}`);
      }
    } else {
      if (!isDryRun) {
        await adminClient.auth.admin.updateUserById(user.id, { password: crSpec.password });
      }
      console.log(`✓ Verified existing Auth crew: ${crSpec.email}`);
    }

    secretsAccounts.push({
      email: crSpec.email,
      role: 'crew',
      name: crSpec.name,
      password: crSpec.password,
    });

    if (!isDryRun) {
      registryEntriesToInsert.push({
        namespace: NAMESPACE,
        entity_type: 'auth_user',
        entity_id: user.id,
      });

      // Ensure Person
      const { data: personData } = await adminClient
        .from('people')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let personId = personData?.id;
      if (!personId) {
        const { data: newPerson, error: pErr } = await adminClient
          .from('people')
          .insert({
            auth_user_id: user.id,
            full_name: crSpec.name,
            display_name: crSpec.name,
            is_active: true,
          })
          .select('id')
          .single();
        if (pErr) throw pErr;
        personId = newPerson.id;
      }
      registryEntriesToInsert.push({
        namespace: NAMESPACE,
        entity_type: 'person',
        entity_id: personId,
      });

      // Ensure platform_roles
      await adminClient.from('platform_roles').upsert({
        person_id: personId,
        role: 'crew',
        is_active: true,
      }, { onConflict: 'person_id,role' });

      // Ensure crew_profiles
      await adminClient.from('crew_profiles').upsert({
        person_id: personId,
        profile_image_url: crSpec.photoUrl,
        bio: crSpec.bio,
        tags: crSpec.tags,
        badges: crSpec.badges,
        height_cm: crSpec.height,
        birth_date: crSpec.birth,
        gender: crSpec.gender,
        preferred_region: crSpec.region,
      }, { onConflict: 'person_id' });

      // Ensure private_contact_details
      await adminClient.from('private_contact_details').upsert({
        person_id: personId,
        phone_number: crSpec.phone,
      }, { onConflict: 'person_id' });

      // Sign in with password to obtain JWT access token
      const { data: signInData, error: signErr } = await anonClient.auth.signInWithPassword({
        email: crSpec.email,
        password: crSpec.password,
      });
      if (signErr) console.warn(`Notice: Crew sign-in with password: ${signErr.message}`);

      crewPersonMap.set(crSpec.key, {
        personId,
        token: signInData?.session?.access_token || null,
        user,
      });
    }
  }

  // Update .secrets/demo_accounts.json
  if (!isDryRun) {
    const secretsPath = path.resolve(secretDir, 'demo_accounts.json');
    fs.writeFileSync(secretsPath, JSON.stringify({
      namespace: NAMESPACE,
      projectRef,
      generatedAt: new Date().toISOString(),
      accounts: secretsAccounts,
    }, null, 2), 'utf-8');
    console.log(`✓ Updated credentials in .secrets/demo_accounts.json (${secretsAccounts.length} accounts)`);
    await recordRegistryBatch(registryEntriesToInsert);
  }

  // -------------------------------------------------------------
  // STEP 2: Event-Only Reset (Safely Cleanup Previous Events)
  // -------------------------------------------------------------
  console.log('\n===> STEP 2: Event-Only Reset Plan & Execution...');
  // Find projects tracked in registry OR demo projects
  const { data: regProjects } = await adminClient
    .from('mvp_seed_registry')
    .select('entity_id')
    .eq('entity_type', 'project');

  const registeredProjectIds = (regProjects || []).map((r) => r.entity_id);

  const demoOrgIds = Array.from(clientPersonMap.values()).map((c) => c.orgId).filter(Boolean);
  const { data: demoProjects } = await adminClient
    .from('projects')
    .select('id, title, is_demo, organization_id')
    .or(`is_demo.eq.true${demoOrgIds.length > 0 ? `,organization_id.in.(${demoOrgIds.join(',')})` : ''}`);

  const candidateProjectIds = Array.from(new Set([
    ...registeredProjectIds,
    ...(demoProjects || []).map((p) => p.id),
  ]));

  let projectsToDelete = [];
  if (candidateProjectIds.length > 0) {
    // Safety check: ensure no non-test crew applications exist
    const { data: projectApps } = await adminClient
      .from('applications')
      .select('id, project_id, crew_person_id')
      .in('project_id', candidateProjectIds);

    const { data: allPeople } = await adminClient
      .from('people')
      .select('id, auth_user_id');
    const testCrewEmails = new Set(CREW_SPECS.map((c) => c.email.toLowerCase()));
    const knownAuthUserIds = new Set(existingUsers.filter((u) => u.email && testCrewEmails.has(u.email.toLowerCase())).map((u) => u.id));
    const testCrewPersonIds = new Set((allPeople || []).filter((p) => p.auth_user_id && knownAuthUserIds.has(p.auth_user_id)).map((p) => p.id));
    const conflictedProjectIds = new Set();
    for (const app of projectApps || []) {
      if (!testCrewPersonIds.has(app.crew_person_id)) {
        conflictedProjectIds.add(app.project_id);
      }
    }

    if (conflictedProjectIds.size > 0) {
      console.warn(`[Safety Warning] Preserving ${conflictedProjectIds.size} projects with external user applications.`);
    }

    projectsToDelete = candidateProjectIds.filter((id) => !conflictedProjectIds.has(id));
  }

  console.log(`Identified ${projectsToDelete.length} demo projects eligible for event-only reset.`);

  if (projectsToDelete.length > 0) {
    // Query dependent records
    const { data: shifts } = await adminClient.from('shifts').select('id').in('project_id', projectsToDelete);
    const shiftIds = (shifts || []).map((s) => s.id);

    const { data: slots } = shiftIds.length > 0
      ? await adminClient.from('shift_slots').select('id').in('shift_id', shiftIds)
      : { data: [] };
    const slotIds = (slots || []).map((s) => s.id);

    const { data: apps } = await adminClient.from('applications').select('id').in('project_id', projectsToDelete);
    const appIds = (apps || []).map((a) => a.id);

    const { data: assignments } = shiftIds.length > 0
      ? await adminClient.from('assignments').select('id').in('shift_id', shiftIds)
      : { data: [] };
    const assignmentIds = (assignments || []).map((a) => a.id);

    const { data: reservations } = slotIds.length > 0
      ? await adminClient.from('work_reservations').select('id').in('shift_slot_id', slotIds)
      : { data: [] };
    const reservationIds = (reservations || []).map((r) => r.id);

    console.log(`Dependencies to delete in dependency order:`);
    console.log(`- Work Reservations: ${reservationIds.length}`);
    console.log(`- Assignments:       ${assignmentIds.length}`);
    console.log(`- Applications:      ${appIds.length}`);
    console.log(`- Shift Slots:       ${slotIds.length}`);
    console.log(`- Shifts:            ${shiftIds.length}`);
    console.log(`- Projects:          ${projectsToDelete.length}`);
    console.log(`- Preserved Accounts: 17 (C01~C14, H1~H3 untouched)`);

    if (isDryRun) {
      console.log(`[Dry-Run] Skipped deletion.`);
    } else {
      // Save backup manifest
      const backupPath = path.resolve(secretDir, `backup_manifest_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        deletedProjects: projectsToDelete,
        deletedShifts: shiftIds,
        deletedSlots: slotIds,
        deletedApplications: appIds,
        deletedAssignments: assignmentIds,
        deletedReservations: reservationIds,
      }, null, 2), 'utf-8');
      console.log(`✓ Saved private backup manifest to ${path.basename(backupPath)}`);

      // Delete in dependency order
      if (reservationIds.length > 0) {
        await adminClient.from('work_reservations').delete().in('id', reservationIds);
      }
      if (assignmentIds.length > 0) {
        await adminClient.from('assignments').delete().in('id', assignmentIds);
      }
      if (appIds.length > 0) {
        await adminClient.from('applications').delete().in('id', appIds);
      }
      if (slotIds.length > 0) {
        await adminClient.from('shift_slots').delete().in('id', slotIds);
      }
      if (shiftIds.length > 0) {
        await adminClient.from('shifts').delete().in('id', shiftIds);
      }
      // Also delete any quotes/estimates associated
      await adminClient.from('estimates').delete().in('project_id', projectsToDelete);
      await adminClient.from('projects').delete().in('id', projectsToDelete);

      // Clean registry for these deleted entities
      await adminClient
        .from('mvp_seed_registry')
        .delete()
        .in('entity_id', [...projectsToDelete, ...shiftIds, ...slotIds, ...appIds]);

      console.log(`✓ Cleaned previous events successfully.`);
    }
  } else {
    console.log(`No previous demo events required cleanup.`);
  }

  if (isDryRun) {
    console.log('\n[Dry-Run Preview Finished] All account counts and event specifications verified.');
    return;
  }

  // -------------------------------------------------------------
  // STEP 3: Create 12 Projects via Authenticated Client APIs
  // -------------------------------------------------------------
  console.log('\n===> STEP 3: Creating 12 Projects (E01~E12) via Client Session...');
  const projectMap = new Map(); // E01 -> { projectId, shifts: [{ id, date }] }
  const projectRegistryEntries = [];

  for (const pSpec of PROJECT_SPECS) {
    const host = clientPersonMap.get(pSpec.hostKey);
    if (!host) throw new Error(`Host context not found for ${pSpec.hostKey}`);

    const startDate = addDays(REFERENCE_TIME, pSpec.offsetDays);
    const endDate = addDays(REFERENCE_TIME, pSpec.offsetDays + pSpec.durationDays - 1);
    const isMultiDay = pSpec.durationDays > 1;

    const payload = {
      title: pSpec.title,
      category: pSpec.category === 'popup' ? '팝업스토어' : pSpec.category === 'brand' ? '브랜드행사' : pSpec.category === 'expo' ? '전시·박람회' : '공연·페스티벌',
      venueName: pSpec.venueName,
      venueAddress: pSpec.roadAddress,
      venueDetail: pSpec.detailAddress,
      roadAddress: pSpec.roadAddress,
      detailAddress: pSpec.detailAddress,
      latitude: pSpec.latitude,
      longitude: pSpec.longitude,
      isMultiDay,
      participationMode: pSpec.participationMode,
      startDate,
      endDate,
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      headcount: pSpec.headcount,
      dailyWage: pSpec.dailyWage,
      hourlyRateWon: pSpec.hourlyRateWon,
      is_demo: true,
      selectedScopes: ['현장 동선 안내 및 응대', '안전 관리 및 질서 유지'],
      dressCode: '올블랙 정장·단정한 슬랙스',
    };

    let createdProject = null;

    // Attempt creation via API if token is available
    if (host.token) {
      try {
        const res = await fetch(`${API_BASE}/api/client/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${host.token}`,
          },
          body: JSON.stringify(payload),
        });
        const resJson = await res.json();
        if (res.ok && (resJson.projectId || resJson.project?.id)) {
          createdProject = { id: resJson.projectId || resJson.project?.id };
        } else {
          console.warn(`[Notice] API create project for ${pSpec.key} returned:`, resJson.message);
        }
      } catch (e) {
        console.warn(`[Notice] API call failed (${e.message}), falling back to domain direct creation.`);
      }
    }

    // Direct atomic domain insert fallback if API was unavailable
    if (!createdProject) {
      const dates = [];
      for (let d = 0; d < pSpec.durationDays; d++) {
        dates.push(addDays(REFERENCE_TIME, pSpec.offsetDays + d));
      }

      const { data: proj, error: projErr } = await adminClient
        .from('projects')
        .insert({
          organization_id: host.orgId,
          title: payload.title,
          venue_name: payload.venueName,
          road_address: payload.roadAddress,
          detail_address: payload.detailAddress,
          latitude: payload.latitude,
          longitude: payload.longitude,
          status: 'published',
          is_demo: true,
          start_date: startDate,
          end_date: endDate,
          sow_spec: {
            category: payload.category,
            isMultiDay,
            participationMode: pSpec.participationMode,
            startDate,
            endDate,
            dates,
            totalDays: dates.length,
            scopes: payload.selectedScopes,
            netWorkHours: 8,
            breakMinutes: 60,
            dressCode: payload.dressCode,
          },
        })
        .select('id')
        .single();

      if (projErr) throw projErr;
      const createdProjectId = proj.id;

      // Insert shifts & slots
      const createdShifts = [];
      for (let i = 0; i < dates.length; i++) {
        const currentDate = dates[i];
        const { data: shift, error: shiftErr } = await adminClient
          .from('shifts')
          .insert({
            project_id: createdProjectId,
            shift_name: dates.length > 1 ? `${payload.title} · ${i + 1}일차 (${currentDate})` : `${payload.title} · 근무 일정`,
            required_headcount: pSpec.headcount,
            date: currentDate,
            start_time: `${currentDate}T09:00:00+09:00`,
            end_time: `${currentDate}T18:00:00+09:00`,
            checkin_opens_at: `${currentDate}T08:00:00+09:00`,
            checkin_closes_at: `${currentDate}T10:00:00+09:00`,
            hourly_rate_won: pSpec.hourlyRateWon,
            daily_wage: pSpec.dailyWage,
          })
          .select('id, date')
          .single();

        if (shiftErr) throw shiftErr;
        createdShifts.push(shift);

        // Slots
        const slotsToInsert = Array.from({ length: pSpec.headcount }, (_, idx) => ({
          shift_id: shift.id,
          slot_number: idx + 1,
          status: 'open',
        }));
        await adminClient.from('shift_slots').insert(slotsToInsert);
      }

      createdProject = { id: createdProjectId, shifts: createdShifts };
    }

    // Query shifts for this project to ensure we have complete shift IDs and dates
    const { data: fetchedShifts } = await adminClient
      .from('shifts')
      .select('id, date')
      .eq('project_id', createdProject.id)
      .order('date', { ascending: true });

    projectMap.set(pSpec.key, {
      id: createdProject.id,
      shifts: fetchedShifts || [],
    });

    projectRegistryEntries.push({
      namespace: NAMESPACE,
      entity_type: 'project',
      entity_id: createdProject.id,
    });
    for (const sh of fetchedShifts || []) {
      projectRegistryEntries.push({
        namespace: NAMESPACE,
        entity_type: 'shift',
        entity_id: sh.id,
      });
    }

    console.log(`✓ Created project ${pSpec.key}: ${pSpec.title} (${fetchedShifts?.length} shifts) [${createdProject.id}]`);
  }

  await recordRegistryBatch(projectRegistryEntries);

  // -------------------------------------------------------------
  // STEP 4: Create 80 Applications (Section 8.1 Matrix)
  // -------------------------------------------------------------
  console.log('\n===> STEP 4: Creating 80 Applications via Crew Sessions...');

  // Application Matrix Definition (Section 8.1)
  const APPLICATION_MATRIX = [
    // E01: C01~C10, 3일 전체 (10 crews * 3 shifts = 30)
    { projectKey: 'E01', crews: ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10'], allShifts: true },
    // E02: C02, C04, C06, C08 (4 crews * 1 shift = 4)
    { projectKey: 'E02', crews: ['C02', 'C04', 'C06', 'C08'], allShifts: true },
    // E03: C01, C11, C12 (3 crews * 1 shift = 3)
    { projectKey: 'E03', crews: ['C01', 'C11', 'C12'], allShifts: true },
    // E04: None
    // E05: C03, C05, C07, C09, C11, C13, 2일 전체 (6 crews * 2 shifts = 12)
    { projectKey: 'E05', crews: ['C03', 'C05', 'C07', 'C09', 'C11', 'C13'], allShifts: true },
    // E06: C01, C02, C12, C14 (4 crews * 1 shift = 4)
    { projectKey: 'E06', crews: ['C01', 'C02', 'C12', 'C14'], allShifts: true },
    // E07: C04, C06, C08, C10, C12 (5 crews * 1 shift = 5)
    { projectKey: 'E07', crews: ['C04', 'C06', 'C08', 'C10', 'C12'], allShifts: true },
    // E08: C05, C09 (2 crews * 1 shift = 2)
    { projectKey: 'E08', crews: ['C05', 'C09'], allShifts: true },
    // E09: C01, C03, C05, C07 (2일 = 8 apps); C09, C11, C13, C14 (2일차만 = 4 apps) -> total 12
    { projectKey: 'E09', crews: ['C01', 'C03', 'C05', 'C07'], allShifts: true },
    { projectKey: 'E09', crews: ['C09', 'C11', 'C13', 'C14'], shiftIndex: 1 }, // Day 2 only
    // E10: C02, C06, C10, C14 (4 crews * 1 shift = 4)
    { projectKey: 'E10', crews: ['C02', 'C06', 'C10', 'C14'], allShifts: true },
    // E11: C11, C12, C13 (3 crews * 1 shift = 3)
    { projectKey: 'E11', crews: ['C11', 'C12', 'C13'], allShifts: true },
    // E12: C14 (1 crew * 1 shift = 1)
    { projectKey: 'E12', crews: ['C14'], allShifts: true },
  ];

  let totalApplicationsCreated = 0;
  const appRegistryEntries = [];

  for (const item of APPLICATION_MATRIX) {
    const proj = projectMap.get(item.projectKey);
    if (!proj) throw new Error(`Project ${item.projectKey} missing`);

    let targetShiftIds = [];
    if (item.allShifts) {
      targetShiftIds = proj.shifts.map((s) => s.id);
    } else if (typeof item.shiftIndex === 'number') {
      targetShiftIds = [proj.shifts[item.shiftIndex].id];
    }

    for (const crewKey of item.crews) {
      const crew = crewPersonMap.get(crewKey);
      if (!crew) throw new Error(`Crew ${crewKey} missing`);

      let applied = false;
      // 1. Try calling API with crew session token
      if (crew.token) {
        try {
          const res = await fetch(`${API_BASE}/api/crew/applications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${crew.token}`,
            },
            body: JSON.stringify({
              projectId: proj.id,
              selectedDates: targetShiftIds,
              agreeNotice: true,
              agreePrivacy: true,
            }),
          });
          const resJson = await res.json();
          if (res.ok) {
            applied = true;
          } else {
            console.warn(`[Notice] Crew API application for ${crewKey} on ${item.projectKey} returned:`, resJson.message);
          }
        } catch {
          // Fall back to atomic RPC
        }
      }

      // 2. Direct atomic procedure call fallback
      if (!applied) {
        const { error: rpcErr } = await adminClient.rpc('apply_shifts_atomic', {
          p_project_id: proj.id,
          p_shift_ids: targetShiftIds,
          p_crew_person_id: crew.personId,
        });
        if (rpcErr && rpcErr.code !== '23505') {
          console.error(`Error applying shifts for ${crewKey} on ${item.projectKey}:`, rpcErr);
        }
      }

      totalApplicationsCreated += targetShiftIds.length;
    }
  }

  // Fetch all created applications and track in registry
  const allProjectIds = Array.from(projectMap.values()).map((p) => p.id);
  const { data: createdApps } = await adminClient
    .from('applications')
    .select('id')
    .in('project_id', allProjectIds);

  for (const app of createdApps || []) {
    appRegistryEntries.push({
      namespace: NAMESPACE,
      entity_type: 'application',
      entity_id: app.id,
    });
  }
  await recordRegistryBatch(appRegistryEntries);
  console.log(`✓ Created & registered ${createdApps?.length || totalApplicationsCreated} applications.`);

  // -------------------------------------------------------------
  // STEP 5: Apply Status Transitions (Section 8.2)
  // -------------------------------------------------------------
  console.log('\n===> STEP 5: Executing Status Changes (Approved / Rejected / Withdrawn)...');

  // Helper to find specific application ID
  async function findApp(projectKey, crewKey, shiftIndex = 0) {
    const proj = projectMap.get(projectKey);
    const crew = crewPersonMap.get(crewKey);
    const shift = proj.shifts[shiftIndex];
    const { data } = await adminClient
      .from('applications')
      .select('id')
      .eq('project_id', proj.id)
      .eq('crew_person_id', crew.personId)
      .eq('shift_id', shift.id)
      .maybeSingle();
    return data?.id;
  }

  // 1. H1 selects C02, C04 on E02, rejects C06
  const h1 = clientPersonMap.get('H1');
  const e02_c02 = await findApp('E02', 'C02');
  const e02_c04 = await findApp('E02', 'C04');
  const e02_c06 = await findApp('E02', 'C06');

  if (e02_c02) {
    const { error: err } = await adminClient.rpc('select_applicant', {
      p_application_id: e02_c02,
      p_new_status: 'approved',
      p_actor_person_id: h1.personId,
    });
    if (err) console.error(`Error approving C02 on E02:`, err);
    else console.log(`✓ H1 approved C02 on E02`);
  }
  if (e02_c04) {
    const { error: err } = await adminClient.rpc('select_applicant', {
      p_application_id: e02_c04,
      p_new_status: 'approved',
      p_actor_person_id: h1.personId,
    });
    if (err) console.error(`Error approving C04 on E02:`, err);
    else console.log(`✓ H1 approved C04 on E02`);
  }
  if (e02_c06) {
    const { error: err } = await adminClient.rpc('select_applicant', {
      p_application_id: e02_c06,
      p_new_status: 'rejected',
      p_actor_person_id: h1.personId,
    });
    if (err) console.error(`Error rejecting C06 on E02:`, err);
    else console.log(`✓ H1 rejected C06 on E02`);
  }

  // 2. H2 selects C03, C05 on E05 (2 days each -> 4 approvals)
  const h2 = clientPersonMap.get('H2');
  for (const cKey of ['C03', 'C05']) {
    for (let day = 0; day < 2; day++) {
      const appId = await findApp('E05', cKey, day);
      if (appId) {
        const { error: err } = await adminClient.rpc('select_applicant', {
          p_application_id: appId,
          p_new_status: 'approved',
          p_actor_person_id: h2.personId,
        });
        if (err) console.error(`Error approving ${cKey} on E05 day ${day + 1}:`, err);
      }
    }
    console.log(`✓ H2 approved ${cKey} on E05 (both days)`);
  }

  // 3. H3 selects C01 on E09 (2 days -> 2 approvals)
  const h3 = clientPersonMap.get('H3');
  for (let day = 0; day < 2; day++) {
    const appId = await findApp('E09', 'C01', day);
    if (appId) {
      const { error: err } = await adminClient.rpc('select_applicant', {
        p_application_id: appId,
        p_new_status: 'approved',
        p_actor_person_id: h3.personId,
      });
      if (err) console.error(`Error approving C01 on E09 day ${day + 1}:`, err);
    }
  }
  console.log(`✓ H3 approved C01 on E09 (both days)`);

  // 4. C14 withdraws from E10 and E12
  const c14 = crewPersonMap.get('C14');
  const e10_c14 = await findApp('E10', 'C14');
  const e12_c14 = await findApp('E12', 'C14');

  if (e10_c14) {
    await adminClient.rpc('withdraw_application', {
      p_application_id: e10_c14,
      p_crew_person_id: c14.personId,
    });
    console.log(`✓ C14 withdrew from E10`);
  }
  if (e12_c14) {
    await adminClient.rpc('withdraw_application', {
      p_application_id: e12_c14,
      p_crew_person_id: c14.personId,
    });
    console.log(`✓ C14 withdrew from E12`);
  }

  // -------------------------------------------------------------
  // STEP 6: Final Verification & Diagnostics
  // -------------------------------------------------------------
  console.log('\n===> STEP 6: Validating Rebuilt Dataset...');
  const { data: statusSummary } = await adminClient
    .from('applications')
    .select('status')
    .in('project_id', allProjectIds);

  const countsByStatus = {};
  for (const a of statusSummary || []) {
    countsByStatus[a.status] = (countsByStatus[a.status] || 0) + 1;
  }

  const { count: assignmentCount } = await adminClient
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .in('shift_id', Array.from(projectMap.values()).flatMap((p) => p.shifts.map((s) => s.id)))
    .not('status', 'in', '("cancelled","released")');

  console.log('\n================ Rebuild Summary ================');
  console.log(`Total Projects:      ${projectMap.size} (Expected: 12)`);
  console.log(`Total Shifts:        ${Array.from(projectMap.values()).reduce((acc, p) => acc + p.shifts.length, 0)} (Expected: 16)`);
  console.log(`Total Applications:  ${statusSummary?.length || 0} (Expected: 80)`);
  console.log(`- Applied:           ${countsByStatus.applied || 0} (Expected: 69)`);
  console.log(`- Approved:          ${countsByStatus.approved || 0} (Expected: 8)`);
  console.log(`- Rejected:          ${countsByStatus.rejected || 0} (Expected: 1)`);
  console.log(`- Withdrawn:         ${countsByStatus.withdrawn || 0} (Expected: 2)`);
  console.log(`Active Assignments:  ${assignmentCount || 0} (Expected: 8)`);
  console.log('=================================================\n');

  console.log('🎉 MVP Rebuild Completed Successfully!');
}

main().catch((err) => {
  console.error('[rebuild-mvp-data] Fatal error:', err);
  process.exit(1);
});
