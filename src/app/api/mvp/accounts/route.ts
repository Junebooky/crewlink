import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import fs from 'node:fs';
import path from 'node:path';

// Known profile summaries for demo crews to provide rich UX in switcher
const CREW_META: Record<string, { summary: string; tags: string[] }> = {
  'crew_doyoon@crewlink.kr': {
    summary: 'VIP 의전 및 외국어 안내 전문 · 경력 3년',
    tags: ['VIP 의전', '영어 능통', '평점 4.98'],
  },
  'crew_seojun@crewlink.kr': {
    summary: '전시·박람회 부스 운영 및 관람객 동선 통제',
    tags: ['전시 안내', '동선 관리', '평점 4.95'],
  },
  'crew_jiwon@crewlink.kr': {
    summary: '팝업스토어 현장 응대 및 결제 지원',
    tags: ['팝업 전문', '친절 응대', '평점 4.96'],
  },
  'crew_minho@crewlink.kr': {
    summary: '무대 음향 및 페스티벌 안전 관리 전문',
    tags: ['공연·축제', '안전 관리', '평점 4.92'],
  },
  'crew_haeun@crewlink.kr': {
    summary: '패션/뷰티 브랜드 팝업 및 이벤트 진행 보조',
    tags: ['브랜드 팝업', '이벤트', '평점 4.97'],
  },
  'crew_yoojin@crewlink.kr': {
    summary: '마포/홍대 행사 및 등록 데스크 전문 · 차분하고 정확한 안내',
    tags: ['등록데스크', '동선안내', '평점 4.94'],
  },
  'crew_yujin@crewlink.kr': {
    summary: '국제 컨퍼런스 등록 데스크 및 바이어 응대',
    tags: ['등록 데스크', '외국어 안내', '평점 4.94'],
  },
  'crew_jiho@crewlink.kr': {
    summary: '대기열 번호표 배부 및 현장 질서 정돈',
    tags: ['대기열 관리', '신속 대응', '평점 4.90'],
  },
  'crew_seoyeon@crewlink.kr': {
    summary: 'VIP 리셉션 및 다과 라운지 운영 전문',
    tags: ['VIP 리셉션', '의전 매너', '평점 4.99'],
  },
  'crew_jimin@crewlink.kr': {
    summary: '야외 페스티벌 동선 안내 및 사은품 불출',
    tags: ['야외 행사', '사은품 증정', '평점 4.93'],
  },
  'crew_taehyun@crewlink.kr': {
    summary: '전시장 등록 키오스크 안내 및 기기 지원',
    tags: ['키오스크 안내', '현장 지원', '평점 4.91'],
  },
  'crew_minjae@crewlink.kr': {
    summary: '공연장 입장 검표 및 객석 안내 전문',
    tags: ['검표·안내', '공연장', '평점 4.89'],
  },
  'crew_subin@crewlink.kr': {
    summary: '브랜드 체험 부스 안내 및 참여 유도',
    tags: ['체험 부스', '밝은 미소', '평점 4.96'],
  },
  'crew_hyunwoo@crewlink.kr': {
    summary: '산업 박람회 바이어 라운지 운영 지원',
    tags: ['바이어 라운지', '동선 통제', '평점 4.92'],
  },
  'crew_daeun@crewlink.kr': {
    summary: '문화행사 현장 안내 및 홍보물 배포',
    tags: ['문화 행사', '안내 지원', '평점 4.95'],
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role') || 'crew';

    const supabase = createAdminClient();

    // 1. Fetch registered demo persons from mvp_seed_registry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: registryEntries, error: regError } = await (supabase.from('mvp_seed_registry' as any) as any)
      .select('entity_id, entity_type, namespace')
      .eq('entity_type', 'person');

    if (regError) {
      console.error('[GET /api/mvp/accounts] registry error:', regError);
      return NextResponse.json({ message: '테스트 계정 목록을 불러오지 못했습니다.' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registeredPersonIds = (registryEntries || []).map((r: any) => r.entity_id as string);

    // Also fallback to read .secrets/demo_accounts.json if registry is empty
    let secretEmails = new Set<string>();
    try {
      const secretsPath = path.resolve(process.cwd(), '.secrets/demo_accounts.json');
      if (fs.existsSync(secretsPath)) {
        const secretData = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
        if (Array.isArray(secretData?.accounts)) {
          secretEmails = new Set(secretData.accounts.map((a: { email: string }) => a.email));
        }
      }
    } catch {
      // ignore
    }

    if (requestedRole === 'crew') {
      // Query people with role 'crew'
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select(`
          id,
          full_name,
          display_name,
          auth_user_id,
          platform_roles!inner(role, is_active),
          crew_profiles(profile_image_url)
        `)
        .eq('platform_roles.role', 'crew')
        .eq('platform_roles.is_active', true)
        .eq('is_active', true);

      if (peopleError) {
        console.error('[GET /api/mvp/accounts] peopleError:', peopleError);
        return NextResponse.json({ message: '크루 목록 조회 실패' }, { status: 500 });
      }

      // Get emails from auth.users (admin API) to map metadata cleanly
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 100 });
      const authUserMap = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));

      // Filter by registered test accounts
      const matched = (people || []).filter((p) => {
        const email = authUserMap.get(p.auth_user_id || '');
        return registeredPersonIds.includes(p.id) || (Boolean(email) && secretEmails.has(email!));
      });

      const accounts = matched.map((p) => {
        const email = authUserMap.get(p.auth_user_id || '') || '';
        const meta = CREW_META[email] || {
          summary: '성실하고 책임감 있는 현장 크루',
          tags: ['현장 크루', '평점 4.95'],
        };
        const profile = Array.isArray(p.crew_profiles) ? p.crew_profiles[0] : p.crew_profiles;

        return {
          id: p.id,
          email,
          name: p.full_name || p.display_name || '크루',
          role: 'crew',
          profileImageUrl: profile?.profile_image_url || null,
          summary: meta.summary,
          tags: meta.tags,
        };
      });

      // Sort consistently by name
      accounts.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

      return NextResponse.json({
        success: true,
        role: 'crew',
        accounts,
        totalCount: accounts.length,
      });
    }

    if (requestedRole === 'client') {
      // Query people with role 'client'
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select(`
          id,
          full_name,
          display_name,
          auth_user_id,
          platform_roles!inner(role, is_active),
          organization_members(organization_id, role, organizations(id, name, is_verified))
        `)
        .eq('platform_roles.role', 'client')
        .eq('platform_roles.is_active', true)
        .eq('is_active', true);

      if (peopleError) {
        console.error('[GET /api/mvp/accounts] client error:', peopleError);
        return NextResponse.json({ message: '주최사 목록 조회 실패' }, { status: 500 });
      }

      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 100 });
      const authUserMap = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));

      const matched = (people || []).filter((p) => {
        const email = authUserMap.get(p.auth_user_id || '');
        return registeredPersonIds.includes(p.id) || (Boolean(email) && secretEmails.has(email!));
      });

      // Count events per organization
      const { data: projects } = await supabase
        .from('projects')
        .select('organization_id')
        .in('status', ['published', 'in_progress', 'draft']);

      const projectCounts = new Map<string, number>();
      for (const pr of projects || []) {
        if (pr.organization_id) {
          projectCounts.set(pr.organization_id, (projectCounts.get(pr.organization_id) || 0) + 1);
        }
      }

      const accounts = matched.map((p) => {
        const email = authUserMap.get(p.auth_user_id || '') || '';
        const member = Array.isArray(p.organization_members)
          ? p.organization_members[0]
          : p.organization_members;
        const org = member?.organizations as unknown as { id: string; name: string; is_verified?: boolean } | null;
        const eventCount = org?.id ? projectCounts.get(org.id) || 0 : 0;

        return {
          id: p.id,
          email,
          name: p.full_name || p.display_name || '주최사 담당자',
          organizationName: org?.name || '주최사 조직',
          organizationId: org?.id || null,
          role: 'client',
          isVerified: org?.is_verified ?? true,
          eventCount,
        };
      });

      accounts.sort((a, b) => a.organizationName.localeCompare(b.organizationName, 'ko'));

      return NextResponse.json({
        success: true,
        role: 'client',
        accounts,
        totalCount: accounts.length,
      });
    }

    return NextResponse.json({ message: '올바르지 않은 역할입니다.' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[GET /api/mvp/accounts] error:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
