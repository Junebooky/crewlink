/**
 * CrewLink UI 문구 & API 친화적 한국어 메시지 단일 사전
 */

export const copyKo = {
  common: {
    closeWindow: '창 닫기',
    cancel: '취소',
    confirm: '확인',
    next: '다음',
    prev: '이전',
    edit: '수정',
    delete: '삭제',
    retry: '다시 시도',
    loading: '불러오는 중…',
    saving: '저장하는 중…',
    submitting: '요청 보내는 중…',
  },
  roles: {
    crew: '크루',
    client: '행사 담당자',
    ops: '운영팀',
  },
  nav: {
    crew: {
      today: '오늘',
      schedule: '일정',
      settlements: '정산',
      profile: '내 정보',
    },
    client: {
      events: '내 행사',
      request: '행사 요청',
      billing: '결제',
      profile: '내 정보',
    },
    ops: {
      inbox: '작업함',
      projects: '행사',
      payouts: '지급',
      settings: '설정',
    },
  },
  errors: {
    ASSIGNMENT_NOT_FOUND: '배정된 일정을 찾지 못했어요. 일정 화면에서 다시 확인해 주세요.',
    SHIFT_NOT_FOUND: '근무 정보를 찾지 못했어요. 일정 화면에서 다시 확인해 주세요.',
    CHECKIN_WINDOW_NOT_OPEN: '아직 도착 확인 시간이 아니에요. 일정에 안내된 시간을 확인해 주세요.',
    CHECKIN_WINDOW_CLOSED: '도착 확인 시간이 지났어요. 현장 운영자에게 확인을 요청해 주세요.',
    INVALID_QR_TOKEN: '이 QR로는 확인할 수 없어요. 현장의 QR을 다시 스캔해 주세요.',
    QR_TOKEN_REVOKED: '사용할 수 없는 QR이에요. 현장의 새 QR을 스캔해 주세요.',
    QR_TOKEN_EXPIRED: 'QR이 만료됐어요. 현장의 새 QR을 스캔해 주세요.',
    ALREADY_CHECKED_IN: '이미 도착 확인을 마쳤어요.',
    CANDIDATE_NOT_FOUND: '후보 크루 정보를 찾지 못했어요. 후보 목록을 새로 확인해 주세요.',
    INACTIVE_CANDIDATE: '지금은 이 크루에게 제안할 수 없어요. 다른 후보를 선택해 주세요.',
    REPLACEMENT_REQUEST_NOT_FOUND: '대타 요청을 찾지 못했어요. 작업함에서 다시 확인해 주세요.',
    CONCURRENCY_CONFLICT_OPERATOR: '다른 운영자가 먼저 처리했어요. 최신 내용을 확인해 주세요.',
    CONCURRENCY_CONFLICT_SCHEDULE: '이 크루는 같은 시간에 다른 일정이 있어요. 다른 후보를 선택해 주세요.',
    ALREADY_FILLED: '이 자리는 이미 배정됐어요. 최신 내용을 확인해 주세요.',
    UNAUTHORIZED: '다시 로그인해 주세요.',
    FORBIDDEN: '이 화면에 접근할 권한이 없어요. 운영팀에 문의해 주세요.',
    OWNERSHIP_MISMATCH: '내게 배정된 일정에서만 처리할 수 있어요.',
    PROFILE_NOT_FOUND: '계정 상태를 확인할 수 없어요. 운영팀에 문의해 주세요.',
    CHECKIN_FAILED: '출근을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
    DEPARTURE_FAILED: '출발 소식을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    FACE_TO_FACE_FAILED: '확인 요청을 보내지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.',
    DEFAULT: '처리를 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
} as const;

/**
 * 내부 코드 또는 오류 메시지를 사용자 친화적인 한국어 메시지로 변환
 */
export function toUserMessage(codeOrMessage: string, fallback = copyKo.errors.DEFAULT): string {
  if (!codeOrMessage) return fallback;

  for (const [key, msg] of Object.entries(copyKo.errors)) {
    if (codeOrMessage.includes(key)) {
      return msg;
    }
  }

  if (codeOrMessage.includes('다른 운영자') || codeOrMessage.includes('선점')) {
    return copyKo.errors.CONCURRENCY_CONFLICT_OPERATOR;
  }
  if (codeOrMessage.includes('중복 배정') || codeOrMessage.includes('타 일정')) {
    return copyKo.errors.CONCURRENCY_CONFLICT_SCHEDULE;
  }
  if (codeOrMessage.includes('already been completed') || codeOrMessage.includes('이미 출근')) {
    return copyKo.errors.ALREADY_CHECKED_IN;
  }
  if (codeOrMessage.includes('Check-in successfully recorded') || codeOrMessage.includes('출근 완료')) {
    return '도착 확인을 마쳤어요.';
  }

  return fallback;
}
