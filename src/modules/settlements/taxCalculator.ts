export type BusinessIncomeInput = {
  taxableGrossWon: number;
  paidOn: string; // YYYY-MM-DD
  incomeType: 'RESIDENT_PERSONAL_SERVICE';
};

export type SettlementBreakdown = {
  taxableGrossWon: number;
  incomeTaxWon: number;
  localIncomeTaxWon: number;
  totalTaxWon: number;
  netTaxablePayWon: number;
  paidOn: string;
  taxPolicyVersion: string;
};

export function calculateBusinessIncomePay(input: BusinessIncomeInput): SettlementBreakdown {
  if (!input || input.incomeType !== 'RESIDENT_PERSONAL_SERVICE') {
    throw new Error('UNSUPPORTED_INCOME_TYPE');
  }
  const { taxableGrossWon, paidOn } = input;
  if (!Number.isSafeInteger(taxableGrossWon) || taxableGrossWon < 0) {
    throw new Error('INVALID_WON_AMOUNT');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) {
    throw new Error('INVALID_PAYMENT_DATE');
  }
  if (paidOn < '2024-07-01' || paidOn > '2026-10-09') {
    throw new Error('TAX_POLICY_REVIEW_REQUIRED');
  }

  const gross = BigInt(taxableGrossWon);
  // 국고금 관리법 제47조: 10원 미만 절사 (1,000원 미만 면제 분기 없음)
  const incomeTax = (gross * 3n / 100n / 10n) * 10n;
  // 지방회계법 제55조: 소득세의 10%, 10원 미만 절사
  const localIncomeTax = (incomeTax / 10n / 10n) * 10n;
  const totalTax = incomeTax + localIncomeTax;

  return {
    taxableGrossWon,
    incomeTaxWon: Number(incomeTax),
    localIncomeTaxWon: Number(localIncomeTax),
    totalTaxWon: Number(totalTax),
    netTaxablePayWon: Number(gross - totalTax),
    paidOn,
    taxPolicyVersion: 'KR_RESIDENT_PERSONAL_SERVICE_REVIEW_2026-10-09',
  };
}
