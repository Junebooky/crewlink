/**
 * TossPayments Integration Adapter (Fake/Mock & Interface)
 */

export type PaymentApprovalRequest = {
  paymentKey: string;
  orderId: string;
  amountWon: number;
};

export type PaymentApprovalResponse = {
  success: boolean;
  paymentKey: string;
  orderId: string;
  approvedAt: string;
  status: 'DONE' | 'ABORTED' | 'EXPIRED';
  method: string;
  amountWon: number;
};

export type PaymentCancelRequest = {
  paymentKey: string;
  cancelReason: string;
  cancelAmountWon?: number;
};

export type PaymentCancelResponse = {
  success: boolean;
  paymentKey: string;
  canceledAt: string;
  status: 'CANCELED';
  cancelAmountWon: number;
  reason: string;
};

export interface IPaymentAdapter {
  approvePayment(req: PaymentApprovalRequest): Promise<PaymentApprovalResponse>;
  cancelPayment(req: PaymentCancelRequest): Promise<PaymentCancelResponse>;
}

export class FakePaymentAdapter implements IPaymentAdapter {
  async approvePayment(req: PaymentApprovalRequest): Promise<PaymentApprovalResponse> {
    const { paymentKey, orderId, amountWon } = req;

    // Simulation of credit card limit exceeded
    if (paymentKey.endsWith('_LIMIT_EXCEEDED')) {
      const err = new Error('TOSS_PAYMENT_ERROR: CARD_LIMIT_EXCEEDED');
      (err as unknown as { code: string }).code = 'CARD_LIMIT_EXCEEDED';
      throw err;
    }

    // Simulation of insufficient balance / funds
    if (paymentKey.endsWith('_INSUFFICIENT_FUNDS')) {
      const err = new Error('TOSS_PAYMENT_ERROR: INSUFFICIENT_FUNDS');
      (err as unknown as { code: string }).code = 'INSUFFICIENT_FUNDS';
      throw err;
    }

    return {
      success: true,
      paymentKey,
      orderId,
      approvedAt: new Date().toISOString(),
      status: 'DONE',
      method: 'CARD',
      amountWon,
    };
  }

  async cancelPayment(req: PaymentCancelRequest): Promise<PaymentCancelResponse> {
    const { paymentKey, cancelReason, cancelAmountWon } = req;

    return {
      success: true,
      paymentKey,
      canceledAt: new Date().toISOString(),
      status: 'CANCELED',
      cancelAmountWon: cancelAmountWon || 0,
      reason: cancelReason,
    };
  }
}

export const paymentAdapter = new FakePaymentAdapter();
