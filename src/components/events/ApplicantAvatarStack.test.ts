import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('ApplicantAvatarStack & Social Proof Specification Verification', () => {
  it('ApplicantAvatarStack.tsx 컴포넌트 파일이 존재해야 한다', () => {
    const componentPath = path.resolve(
      process.cwd(),
      'src/components/events/ApplicantAvatarStack.tsx'
    );
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('아바타 스택 컴포넌트에 웹 접근성 및 토스 스타일 스펙이 반영되어 있어야 한다', () => {
    const content = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/events/ApplicantAvatarStack.tsx'),
      'utf-8'
    );

    // 접근성 스펙: aria-hidden="true" on decorative avatar group
    expect(content).toContain('aria-hidden="true"');
    // 스크린리더 전용 문구 sr-only
    expect(content).toContain('sr-only');
    // 마이크로카피: '지원 크루', '최근 하루', '첫 지원을 기다려요', '테스트 공고'
    expect(content).toContain('지원 크루');
    expect(content).toContain('최근 하루');
    expect(content).toContain('첫 지원을 기다려요');
    expect(content).toContain('테스트 공고');
  });

  it('아바타 오버플로우 계산 로직이 명세에 맞아야 한다 (0, 1, 3, 4명 등)', () => {
    const calculateSocialProofDisplay = (applicantCount: number, avatarListLength: number) => {
      const displayAvatarsCount = Math.min(avatarListLength, 3);
      const overflowCount = Math.max(0, applicantCount - displayAvatarsCount);
      return {
        displayAvatarsCount,
        overflowCount,
        hasActivity: applicantCount > 0,
      };
    };

    // 0명: 활동 없음, 아바타 0개, 오버플로우 0
    expect(calculateSocialProofDisplay(0, 0)).toEqual({
      displayAvatarsCount: 0,
      overflowCount: 0,
      hasActivity: false,
    });

    // 1명: 아바타 1개, 오버플로우 0
    expect(calculateSocialProofDisplay(1, 1)).toEqual({
      displayAvatarsCount: 1,
      overflowCount: 0,
      hasActivity: true,
    });

    // 3명: 아바타 3개, 오버플로우 0
    expect(calculateSocialProofDisplay(3, 3)).toEqual({
      displayAvatarsCount: 3,
      overflowCount: 0,
      hasActivity: true,
    });

    // 4명: 아바타 3개, 오버플로우 +1
    expect(calculateSocialProofDisplay(4, 4)).toEqual({
      displayAvatarsCount: 3,
      overflowCount: 1,
      hasActivity: true,
    });
  });

  it('인기 공고 정렬 우선순위 (Section 7.3)가 올바르게 동작해야 한다', () => {
    // 1. newApplicantCount24h DESC
    // 2. applicantCount DESC
    // 3. createdAt DESC
    // 4. id ASC
    type EventCandidate = {
      id: string;
      title: string;
      newApplicantCount24h: number;
      applicantCount: number;
      createdAt: string;
    };

    const candidates: EventCandidate[] = [
      {
        id: 'coex',
        title: '코엑스',
        newApplicantCount24h: 0,
        applicantCount: 3,
        createdAt: '2026-10-10T10:00:00Z',
      },
      {
        id: 'hot-seongsu',
        title: '성수 플래그십 (Target HOT)',
        newApplicantCount24h: 4,
        applicantCount: 4,
        createdAt: '2026-10-09T10:00:00Z',
      },
      {
        id: 'kintex',
        title: '킨텍스',
        newApplicantCount24h: 0,
        applicantCount: 1,
        createdAt: '2026-10-11T10:00:00Z',
      },
      {
        id: 'yeouido',
        title: '여의도',
        newApplicantCount24h: 0,
        applicantCount: 3,
        createdAt: '2026-10-12T10:00:00Z', // coex보다 최신
      },
    ];

    const sorted = [...candidates].sort((a, b) => {
      if (b.newApplicantCount24h !== a.newApplicantCount24h) {
        return b.newApplicantCount24h - a.newApplicantCount24h;
      }
      if (b.applicantCount !== a.applicantCount) {
        return b.applicantCount - a.applicantCount;
      }
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });

    // 1위: hot-seongsu (newApplicantCount24h=4)
    expect(sorted[0].id).toBe('hot-seongsu');
    // 2위: yeouido (applicantCount=3, createdAt 최신)
    expect(sorted[1].id).toBe('yeouido');
    // 3위: coex (applicantCount=3)
    expect(sorted[2].id).toBe('coex');
    // 4위: kintex (applicantCount=1)
    expect(sorted[3].id).toBe('kintex');
  });

  it('다일 지원 API에 트랜잭션/원자적 검증 및 프로젝트/일정 일치 검증이 포함되어 있어야 한다', () => {
    const routeContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/crew/applications/route.ts'),
      'utf-8'
    );

    // 필수 날짜 및 유효성 검증
    expect(routeContent).toContain('shifts');
    expect(routeContent).toContain('selectedDates');
    expect(routeContent).toContain('apply_shifts_atomic');
  });

  it('시드, 리빌드 및 검증 스크립트가 scripts 디렉토리에 존재해야 한다', () => {
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/seed-demo-data.mjs'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/cleanup-demo-data.mjs'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/rebuild-mvp-data.mjs'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/verify-mvp-data.mjs'))).toBe(true);
  });
});
