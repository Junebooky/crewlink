export type EventCategory = 'popup' | 'expo' | 'brand' | 'festival';
export type RecruitmentStatus = 'OPEN' | 'CLOSING_SOON' | 'CLOSED';

export interface EventDateItem {
  id: string;
  date: string;
  dayOfWeek: string;
}

export interface EventRoleItem {
  title: string;
  desc: string;
}

export interface EventDressCode {
  type: 'FORMAL' | 'CASUAL' | 'UNIFORM';
  title: string;
  desc: string;
}

export interface EventItem {
  id: string;
  title: string;
  displayTitle: string;
  hostName: string;
  hostVerified?: boolean;
  category: EventCategory;
  categoryLabel: string;
  regionId: string;
  regionLabel: string;
  venueAddress: string;
  venueDetail: string;
  stationInfo?: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  dateRangeLabel: string;
  workHoursLabel: string;
  breakMinutesLabel: string;
  breakMinutes?: number;
  isMultiDayRequired?: boolean;
  dailyWageWon: number;
  requiredCount: number;
  confirmedCount: number;
  deadlineDate: string;
  deadlineDateLabel: string;
  recruitmentStatus: RecruitmentStatus;
  primaryRoles: string[];
  roles: EventRoleItem[];
  dressCode: EventDressCode;
  qualifications: string[];
  description?: string;
  dates: EventDateItem[];
  createdAt: string;
}

// Backward compatibility aliases
export type EventListItem = EventItem;
export type EventDetailData = EventItem;

export const EVENT_FEED_DATA: EventItem[] = [
  {
    id: 'evt-2026-001',
    title: '2026 성수 럭셔리 뷰티 브랜드 팝업스토어 현장 운영 크루',
    displayTitle: '성수 뷰티 팝업 운영 크루',
    hostName: '(주)글로우랩스 코리아',
    hostVerified: true,
    category: 'popup',
    categoryLabel: '팝업스토어',
    regionId: 'seongsu',
    regionLabel: '서울 성동구',
    venueAddress: '서울 성동구 연무장길 45',
    venueDetail: '성수역 3번 출구 도보 5분 메인 팝업존',
    stationInfo: '성수역 도보 5분',
    latitude: 37.5421542,
    longitude: 127.0573211,
    startDate: '2026-10-16',
    endDate: '2026-10-20',
    dateRangeLabel: '10.16–10.20 · 5일간',
    workHoursLabel: '11:00 ~ 20:00',
    breakMinutesLabel: '60분 휴게',
    breakMinutes: 60,
    isMultiDayRequired: false,
    dailyWageWon: 120000,
    requiredCount: 6,
    confirmedCount: 2,
    deadlineDate: '2026-10-18',
    deadlineDateLabel: '10.18까지 모집',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['관람객 안내', '체험 부스 지원', '사은품 배부'],
    roles: [
      {
        title: '동선 및 관람객 입장 통제',
        desc: '사전 예약자 대기열 라인 정돈 및 현장 대기 인원 동선 분리 안내',
      },
      {
        title: '체험 부스 및 이벤트 지원',
        desc: '포토존 인솔, 럭키드로우 룰렛 진행 및 인스타그램 인증 확인',
      },
      {
        title: '사은품 배부 및 체크리스트 관리',
        desc: '방문 완료 키트 패키징 불출 및 수량 체크',
      },
    ],
    dressCode: {
      type: 'FORMAL',
      title: '단정 올블랙 정장 및 단화 착용',
      desc: '상/하의 단정한 블랙 슬랙스 및 셔츠, 찢어진 바지/운동화/슬리퍼 불가',
    },
    qualifications: [
      '고객 응대에 밝고 적극적인 태도를 가지신 분',
      '시간 엄수 및 근태가 성실하신 분 (지각/무단이탈 절대 불가)',
      '단정한 용모와 복장 규정 준수가 가능하신 분',
    ],
    dates: [
      { id: 'd1', date: '2026-10-16', dayOfWeek: '금' },
      { id: 'd2', date: '2026-10-17', dayOfWeek: '토' },
      { id: 'd3', date: '2026-10-18', dayOfWeek: '일' },
      { id: 'd4', date: '2026-10-19', dayOfWeek: '월' },
      { id: 'd5', date: '2026-10-20', dayOfWeek: '화' },
    ],
    description:
      '글로벌 프리미엄 뷰티 브랜드의 2026 F/W 시즌 런칭을 기념하는 성수동 플래그십 팝업스토어입니다. 감각적인 인테리어와 다양한 인터랙티브 체험존에서 방문객들에게 최고의 경험을 선사할 크루를 모집합니다.',
    createdAt: '2026-10-08T09:00:00Z',
  },
  {
    id: 'evt-2026-002',
    title: '2026 서울 모빌리티 엑스포 VIP 리셉션 및 등록 안내 스태프',
    displayTitle: '모빌리티 엑스포 VIP 리셉션',
    hostName: '모빌리티혁신협회',
    hostVerified: true,
    category: 'expo',
    categoryLabel: '전시·박람회',
    regionId: 'gangnam',
    regionLabel: '서울 강남구',
    venueAddress: '서울 강남구 영동대로 513 코엑스 3층 D홀 전관',
    venueDetail: '삼성역 코엑스 3층 컨벤션홀',
    stationInfo: '삼성역 코엑스',
    latitude: 37.511854,
    longitude: 127.059287,
    startDate: '2026-10-22',
    endDate: '2026-10-25',
    dateRangeLabel: '10.22–10.25 · 4일간',
    workHoursLabel: '09:00 ~ 18:00',
    breakMinutesLabel: '60분 휴게',
    breakMinutes: 60,
    isMultiDayRequired: true,
    dailyWageWon: 135000,
    requiredCount: 8,
    confirmedCount: 3,
    deadlineDate: '2026-10-18',
    deadlineDateLabel: '10.18까지 모집',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['VIP 라운지', '외국어 응대', '등록 데스크'],
    roles: [
      {
        title: 'VIP 라운지 리셉션',
        desc: '국내외 주요 바이어 및 연사 다과 케이터링 안내',
      },
      {
        title: '외국어 안내 지원',
        desc: '해외 참관객 바코드 발권 및 행사장 디렉토리 안내',
      },
      {
        title: '현장 등록 데스크',
        desc: '사전등록 키오스크 발권 보조 및 네임택 스트랩 배부',
      },
    ],
    dressCode: {
      type: 'FORMAL',
      title: '네이비/블랙 정장 슈트 스타일',
      desc: '단정한 셔츠 및 편안한 단화 (명찰 현장 지급)',
    },
    qualifications: [
      '기본적인 비즈니스 매너를 갖추신 분',
      '외국어(영어/일본어) 간단 회화 가능자 우대',
      '대규모 전시회 유경험자 우대',
    ],
    dates: [
      { id: 'd1', date: '2026-10-22', dayOfWeek: '목' },
      { id: 'd2', date: '2026-10-23', dayOfWeek: '금' },
      { id: 'd3', date: '2026-10-24', dayOfWeek: '토' },
      { id: 'd4', date: '2026-10-25', dayOfWeek: '일' },
    ],
    description:
      '아시아 최대 규모의 모빌리티 산업 전시회로, 글로벌 완성차 제조사 및 테크 스타트업이 참여합니다. 품격 있는 VIP 라운지와 원활한 등록 데스크 운영을 함께할 전문 스태프를 모십니다.',
    createdAt: '2026-10-09T03:00:00Z',
  },
  {
    id: 'evt-2026-003',
    title: '영캐주얼 스트릿 브랜드 런칭 기념 팝업 이벤트 진행 보조',
    displayTitle: '여의도 영캐주얼 런칭 팝업',
    hostName: '스튜디오 바이브',
    hostVerified: true,
    category: 'popup',
    categoryLabel: '팝업스토어',
    regionId: 'yeouido',
    regionLabel: '서울 영등포구',
    venueAddress: '서울 영등포구 여의대로 108 더현대 서울 지하 2층',
    venueDetail: '더현대 서울 지하 2층 아이코닉스퀘어',
    stationInfo: '여의도 더현대',
    latitude: 37.525897,
    longitude: 126.928426,
    startDate: '2026-10-19',
    endDate: '2026-10-25',
    dateRangeLabel: '10.19–10.25 · 7일간',
    workHoursLabel: '10:00 ~ 20:00',
    breakMinutesLabel: '60분 휴게',
    breakMinutes: 60,
    isMultiDayRequired: false,
    dailyWageWon: 130000,
    requiredCount: 4,
    confirmedCount: 1,
    deadlineDate: '2026-10-15',
    deadlineDateLabel: '10.15까지 모집',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['대기열 안내', '이벤트 진행', 'SNS 인증 확인'],
    roles: [
      {
        title: '입장 대기열 관리',
        desc: '백화점 매장 앞 웨이팅 등록 태블릿 안내 및 동선 정리',
      },
      {
        title: '럭키드로우 진행',
        desc: '구매 고객 대상 럭키드로우 룰렛 이벤트 운영 및 경품 배부',
      },
      {
        title: '포토부스 안내',
        desc: '브랜드 인생네컷 포토존 촬영 보조 및 소품 정리',
      },
    ],
    dressCode: {
      type: 'CASUAL',
      title: '브랜드 오버핏 후드 티셔츠 제공',
      desc: '하의: 깔끔한 블랙/청바지, 활동하기 편한 스니커즈 착용',
    },
    qualifications: [
      '스트릿 패션에 관심이 많으신 분',
      '에너지 넘치고 친근한 소통이 가능하신 분',
      '원하는 요일 선택 지원 가능',
    ],
    dates: [
      { id: 'd1', date: '2026-10-19', dayOfWeek: '월' },
      { id: 'd2', date: '2026-10-20', dayOfWeek: '화' },
      { id: 'd3', date: '2026-10-21', dayOfWeek: '수' },
      { id: 'd4', date: '2026-10-22', dayOfWeek: '목' },
      { id: 'd5', date: '2026-10-23', dayOfWeek: '금' },
      { id: 'd6', date: '2026-10-24', dayOfWeek: '토' },
      { id: 'd7', date: '2026-10-25', dayOfWeek: '일' },
    ],
    description:
      '더현대 서울 아이코닉 존에서 펼쳐지는 힙한 영캐주얼 브랜드의 팝업스토어입니다. 활기차고 에너지 넘치는 현장에서 방문객들과 소통할 열정적인 크루를 기다립니다.',
    createdAt: '2026-10-07T12:00:00Z',
  },
  {
    id: 'evt-2026-004',
    title: '2026 대한민국 스마트 안전산업 박람회 종합 안내소 운영',
    displayTitle: '킨텍스 안전산업 박람회 안내',
    hostName: '(주)세이프티엔지니어링',
    hostVerified: true,
    category: 'expo',
    categoryLabel: '전시·박람회',
    regionId: 'kintex',
    regionLabel: '경기 고양시',
    venueAddress: '경기 고양시 일산서구 킨텍스로 217 제1전시장 1·2홀',
    venueDetail: '킨텍스 제1전시장 1·2홀 메인 로비',
    stationInfo: '킨텍스 제1전시장',
    latitude: 37.669818,
    longitude: 126.746011,
    startDate: '2026-10-28',
    endDate: '2026-10-30',
    dateRangeLabel: '10.28–10.30 · 3일간',
    workHoursLabel: '09:30 ~ 17:30',
    breakMinutesLabel: '60분 휴게',
    breakMinutes: 60,
    isMultiDayRequired: true,
    dailyWageWon: 105000,
    requiredCount: 3,
    confirmedCount: 0,
    deadlineDate: '2026-10-24',
    deadlineDateLabel: '10.24까지 모집',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['명찰 배부', '동선 안내'],
    roles: [
      {
        title: '종합 안내소 운영',
        desc: '전시장 배치도 배부 및 세미나실 위치 안내',
      },
      {
        title: '출입 게이트 바코드 리딩',
        desc: '참관객 입장 바코드 스캐너 태그 확인 및 출입 통제',
      },
    ],
    dressCode: {
      type: 'FORMAL',
      title: '깔끔한 비즈니스 캐주얼',
      desc: '자켓 또는 셔츠, 편안한 운동화/단화 가능',
    },
    qualifications: [
      '차분하고 꼼꼼한 응대가 가능하신 분',
      '일산/고양 및 인근 거주자 우대',
      '점심 식사 제공',
    ],
    dates: [
      { id: 'd1', date: '2026-10-28', dayOfWeek: '수' },
      { id: 'd2', date: '2026-10-29', dayOfWeek: '목' },
      { id: 'd3', date: '2026-10-30', dayOfWeek: '금' },
    ],
    description:
      '국내외 첨단 산업 안전 기술을 선보이는 국가급 박람회입니다. 종합 안내소 및 게이트에서 안전하고 질서 있는 관람 환경을 함께 만들어갈 크루를 모집합니다.',
    createdAt: '2026-10-06T15:00:00Z',
  },
];

/**
 * 전체 모집 공고 목록 반환 (SSOT)
 */
export function getPublicEvents(): EventItem[] {
  return EVENT_FEED_DATA;
}

/**
 * 특정 공고 상세 데이터 반환 (SSOT)
 */
export function getEventById(id: string): EventItem | undefined {
  return EVENT_FEED_DATA.find((e) => e.id === id);
}

/**
 * 모집 마감일 표시 함수 (예: '10.15까지 모집')
 */
export function formatRecruitmentDeadline(deadlineStr: string): string {
  const parts = deadlineStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}.${parts[2]}까지 모집`;
  }
  return `${deadlineStr.slice(5).replace('-', '.')}까지 모집`;
}
