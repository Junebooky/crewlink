/**
 * Solapi Alimtalk Notification Adapter (Fake/Mock & Interface)
 */

export type AlimtalkTemplate =
  | 'D1_CONFIRMATION'      // D-1 행사 일정 확인 및 참석 확정
  | 'T60_DEPARTURE_PROMPT' // T-60 출발 유도 및 지각 예방 알림
  | 'EMERGENCY_REPLACEMENT'// 긴급 결원 대타 호출 브로드캐스트
  | 'SETTLEMENT_STATEMENT';// 정산 명세서 발행 알림

export type SendAlimtalkRequest = {
  recipientPhoneNumber: string;
  templateCode: AlimtalkTemplate;
  variables: {
    crewName?: string;
    projectName?: string;
    shiftTime?: string;
    venueName?: string;
    hourlyRateWon?: number;
    statementUrl?: string;
    actionUrl?: string;
    [key: string]: string | number | undefined;
  };
};

export type SendAlimtalkResponse = {
  success: boolean;
  messageId: string;
  sentAt: string;
  templateCode: AlimtalkTemplate;
  recipient: string;
};

export interface INotificationAdapter {
  sendAlimtalk(req: SendAlimtalkRequest): Promise<SendAlimtalkResponse>;
}

export class FakeNotificationAdapter implements INotificationAdapter {
  private sentMessages: SendAlimtalkRequest[] = [];

  async sendAlimtalk(req: SendAlimtalkRequest): Promise<SendAlimtalkResponse> {
    if (!req.recipientPhoneNumber || !req.recipientPhoneNumber.replace(/-/g, '').match(/^01[016789]\d{7,8}$/)) {
      throw new Error('INVALID_PHONE_NUMBER: Phone number must be a valid Korean mobile number');
    }

    this.sentMessages.push(req);

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sentAt: new Date().toISOString(),
      templateCode: req.templateCode,
      recipient: req.recipientPhoneNumber,
    };
  }

  getSentMessages() {
    return [...this.sentMessages];
  }

  clear() {
    this.sentMessages = [];
  }
}

export const notificationAdapter = new FakeNotificationAdapter();
