# [TASK_MASTER.md] 크루링크(CrewLink) 풀스택 구현 작업명령서

**문서 버전:** v2.0-Production  
**기준 문서:** `crewlink-review.txt` v2.0, `crewlink-frontend-design.md` v1.0  
**실행 주체:** AI Coding Agent (Senior Full-Stack Engineer & Task Master)

---

## 0. 에이전트 행동 지침 및 절대 원칙 (Non-Negotiables)

너는 B2B 디지털 행사 도급 플랫폼 **'크루링크(CrewLink)'**의 시니어 풀스택 엔지니어이자 테스크 마스터다. 아래 원칙을 반드시 준수하며 단계별로 작업을 실행하라.

1. **법적·노무 실질 준수:** 현장 스태프를 일괄 3.3% 프리랜서로 간주하지 않는다. SOW(과업지시서) 기반 도급 구조를 기본으로 하며, 플랫폼/운영사 직접 고용 또는 검증된 협력사 고용 체계를 지원한다. 노쇼·지각에 대한 일률적 임금 벌금 차감 로직은 작성하지 않는다 (근로기준법 제20조).
2. **세무 계산의 정밀성:** 
   - 2024년 7월 1일 이후 지급분에 대해 인적용역 사업소득 1,000원 미만 면제(소액부징수) 분기를 절대 적용하지 않는다.
   - 모든 세액 계산은 원화 정수(BigInt) 연산과 국고금 관리법 제47조 및 지방회계법 제55조에 따른 10원 미만 절사를 적용한다.
3. **개인정보 보호 엄수:** 
   - 데이터베이스에 주민등록번호 원문 또는 단순 암호화 필드를 임의로 생성하지 않는다. 세무 테크 연동 식별자(`tax_provider_user_key`)를 사용한다.
   - 계좌번호, 연락처 등 민감 정보는 공개 프로필과 완전히 분리한다.
4. **동시성 및 무결성 보장:** 
   - 크루 배정 정원 초과 방지 및 시간 중복 방지는 Redis에만 의존하지 않고, PostgreSQL 수준의 제약(`EXCLUDE USING gist`)과 `FOR UPDATE` 트랜잭션으로 강제한다.
5. **허위 낙관적 UI(Optimistic UI) 및 가짜 인터랙션 금지:** 
   - 출근 완료, 전자서명 완료, 결제 승인, 임금 지급은 서버의 성공 응답이 확정된 후에만 UI에 반영한다.
   - 금융 금액 카운트업, 카드 점멸, 에러 시 쉐이크(shake) 모션, 가짜 프로그레스 바를 생성하지 않는다.

---

## 1. 프로젝트 아키텍처 및 디렉터리 구조

### 1.1 기술 스택
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide Icons, Pretendard (`tabular-nums`)
- **Backend & DB:** Supabase (PostgreSQL 16, Supabase Auth, Storage, Edge RPC)
- **State & Query:** TanStack Query v5 (Server State), Nuqs (URL State), Zustand (Client UI State Only)
- **DB Extensions:** `uuid-ossp`, `btree_gist`

### 1.2 모듈형 모놀리스 디렉터리 규격
```text
src/
├── app/                                # Presentation (App Router)
│   ├── (auth)/                         # 로그인, 인증 콜백
│   ├── (crew)/crew/                    # 크루 모바일 PWA 화면 (C01~C06)
│   ├── (client)/client/                # 고객(광고주) 포털 (B01~B04)
│   ├── (ops)/ops/                      # 운영자 관제/작업함 (O01~O03)
│   └── api/                            # Webhook, 인증 핸들러, Proxy
│
├── modules/                            # 도메인 비즈니스 로직 (Framework-Agnostic)
│   ├── attendance/                     # 출결 검증, QR 챌린지 생성, 지오펜싱
│   │   ├── attendance.service.ts
│   │   ├── attendance.types.ts
│   │   └── attendance.rpc.sql
│   ├── contracts/                      # 전자서약, 벡터 스트로크 보존, PDF 해시
│   ├── projects/                       # SOW 발주, 교대(Shift), 슬롯(Slot)
│   ├── settlements/                    # 원천세 정산 엔진, 대사(Reconciliation)
│   │   ├── taxCalculator.ts
│   │   └── taxCalculator.test.ts
│   └── replacements/                   # 대타 후보 조회, 긴급 배정 동시성 제어
│
├── lib/
│   ├── adapters/                       # 외부 API 연동 어댑터 (Fake/Mock 분리)
│   │   ├── payment.adapter.ts          # 토스페이먼츠
│   │   ├── tax.adapter.ts              # 세무 테크 API
│   │   └── notification.adapter.ts     # 솔라피 알림톡
│   ├── supabase/                       # client.ts, server.ts, middleware.ts
│   └── tokens/                         # 디자인 토큰 및 WCAG AA 색상 상수
│
└── types/                              # database.types.ts (Supabase CLI 자동 생성)
```

---

## 2. 세부 개발 태스크 (Sprint 1 ~ Sprint 4)

---

### [Phase 1] 기반 인프라 & 데이터베이스 v2 마이그레이션

#### Task 1.1: 프로젝트 초기화 및 환경 설정
1. Next.js 15 App Router 프로젝트 생성 (TypeScript, Tailwind, ESLint).
2. `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` 설치.
3. Pretendard 가변 폰트 세팅 및 `tabular-nums` 유틸리티 클래스 정의.

#### Task 1.2: PostgreSQL 확장 및 DDL v2 스키마 작성 (`supabase/migrations/00001_initial_schema.sql`)
반드시 아래 테이블 및 제약 조건을 정확히 구현할 것:
1. **확장 활성화:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

2. **테이블 구성 (28개 핵심 모델):**
* 사용자/인증: `people`, `account_links`, `private_contact_details`, `platform_roles`
* 조직/기업: `organizations`, `organization_members`
* 크루 상세: `crew_profiles`, `crew_availability`
* 행사/도급: `projects`, `shifts`, `shift_slots`, `quotes`, `quote_items`
* 지원/배정: `applications`, `assignments`, `work_reservations`
* **중복 배정 방지 제약 (Exclusion Constraint):**
```sql
ALTER TABLE public.work_reservations
ADD CONSTRAINT no_overlapping_reservations 
EXCLUDE USING gist (
    crew_person_id WITH =,
    reserved_range WITH &&
) WHERE (is_active = TRUE);
```
* 계약: `contracts`, `contract_signatures`
* 출결: `checkin_challenges` (token_hash CHAR(64)), `attendance_logs`, `work_sessions`
* 대타: `replacement_requests`, `replacement_offers`
* 결제/정산: `orders`, `payments`, `settlements`, `settlement_items`, `payout_accounts`, `payout_attempts`
* 감사/이벤트: `audit_events`, `outbox_events`

#### Task 1.3: 보안 RPC 함수 구현 (`supabase/migrations/00002_attendance_rpc.sql`)
1. 기존 취약한 `verify_crew_checkin` 폐기.
2. `checkin_with_qr_v2` 함수 작성:
* `SECURITY INVOKER`, `search_path = ''`
* `auth.role() = 'service_role'` 가드 (클라이언트 직접 실행 차단)
* `assignments FOR UPDATE` 행 잠금
* 동일 배정 이미 출근 여부 확인 및 멱등성 보장 (`already_recorded: true`)
* 60초 TTL SHA-256 해시 검증 및 `shifts.checkin_opens_at / closes_at` 시간 윈도우 검증
* 감사 로그(`audit_events`) 및 Outbox 이벤트(`outbox_events`) 동시 생성

#### Task 1.4: RLS(Row Level Security) 정책 정의
1. 모든 테이블에 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` 선언.
2. `anon`, `authenticated`의 불필요한 기본 테이블 권한 회수 (`REVOKE ALL`).
3. 크루는 본인에게 배정된 공개 DTO만 읽기 가능, 고객은 자기 조직의 발주 프로젝트 요약만 조회 가능.
4. 계좌번호, 주민등록 토큰, 시스템 역할(`role`), 정산 확정 상태는 서버 전용(`service_role`)으로만 수정 가능하도록 제한.

---

### [Phase 2] 핵심 도메인 로직 및 어댑터 레이어 구축

#### Task 2.1: 정산 원천세 산출 엔진 구현 (`src/modules/settlements/taxCalculator.ts`)
아래 코드를 작성하고 단위 테스트(`taxCalculator.test.ts`) 40개 케이스를 통과시킬 것.

#### Task 2.2: Mock / Fake 외부 연동 어댑터 구축
1. `PaymentAdapter`: 토스페이먼츠 결제 승인 / 환불 Fake 인터페이스 (성공, 한도초과, 잔액부족 모의 분기).
2. `NotificationAdapter`: 솔라피 알림톡 트리거 Fake (D-1 확인 알림, T-60 출발 유도).
3. `TaxAdapter`: 원천세 식별자 검증 Fake.

---

### [Phase 3] 디자인 시스템 및 프런트엔드 공통 기반

#### Task 3.1: 디자인 토큰 및 WCAG 2.2 AA 테마 설정
1. `tailwind.config.ts`에 시맨틱 컬러 정의
2. 모션 토큰 적용 (`prefers-reduced-motion` 대응)

#### Task 3.2: 반응형 AppShell & Navigation
1. **모바일:** 하단 4탭 고정 내비게이션 (높이 68px + safe-area-inset-bottom)
2. **PC:** 224px 좌측 사이드바 + 메인 작업 패널 확장
3. **가상 뷰포트 대응:** 모바일 입력 포커스 시 `window.visualViewport` 감지

#### Task 3.3: 특수 UI 컴포넌트
1. `SignatureCapture.tsx`: HTML5 Canvas 기반 벡터 스트로크
2. `HeadcountInput.tsx`: Stepper 버튼(`min=1`)
3. `StatusBadge.tsx`: 명시적 상태 텍스트 병기

---

### [Phase 4] 역할별 핵심 플로우 구현

#### Task 4.1: 크루 플로우 (Crew PWA)
- C01 오늘 (Today)
- C04 QR 출근 스캐너
- C03 전자서약
- C06 정산 명세서

#### Task 4.2: 고객(광고주) 플로우 (Client Web)
- B02 4-Step SOW 운영 요청 위저드
- B01 행사 관제 라이브 보드

#### Task 4.3: 슈퍼 어드민 관제 플로우 (Ops Dashboard)
- O01 작업함 (Inbox)
- O02 예외 처리 Sheet
- O03 긴급 대타 파견 모듈

---

## 3. 테스트 및 품질 검증 기준 (Quality Gates)
* [ ] **TypeScript 컴파일:** `tsc --noEmit` 에러 0건.
* [ ] **세금 계산기 단위 테스트:** 6개 필수 경계값 포함 40개 단위 테스트 통과.
* [ ] **동시성 배정 방지:** 동시 배정 충돌 제어 검증.
* [ ] **출근 RPC 멱등성:** 멱등 호출 검증.
* [ ] **접근성 명도 대비:** WCAG AA (4.5:1 이상) 준수.
