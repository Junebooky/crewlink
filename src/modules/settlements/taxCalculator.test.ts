import { describe, it, expect } from 'vitest';
import { calculateBusinessIncomePay, BusinessIncomeInput } from './taxCalculator';

describe('calculateBusinessIncomePay (원천징수 세무 엔진)', () => {
  const validDate = '2026-10-09';

  // 1. Mandatory 6 boundary test cases specified in TASK_MASTER.md
  describe('필수 6대 경계값 검증', () => {
    it('1. 0원 지급 시 세액 0원 및 실수령액 0원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 0,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(0);
      expect(res.localIncomeTaxWon).toBe(0);
      expect(res.totalTaxWon).toBe(0);
      expect(res.netTaxablePayWon).toBe(0);
    });

    it('2. 30,000원 지급 시 소득세 900원, 지방소득세 90원, 실수령액 29,010원 (소액부징수 면제 미적용 검증)', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 30000,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(900);
      expect(res.localIncomeTaxWon).toBe(90);
      expect(res.totalTaxWon).toBe(990);
      expect(res.netTaxablePayWon).toBe(29010);
    });

    it('3. 33,333원 지급 시 소득세 990원 (999원 10원 미만 절사), 지방소득세 90원, 실수령액 32,253원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 33333,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(990);
      expect(res.localIncomeTaxWon).toBe(90);
      expect(res.totalTaxWon).toBe(1080);
      expect(res.netTaxablePayWon).toBe(32253);
    });

    it('4. 33,334원 지급 시 소득세 1,000원, 지방소득세 100원, 실수령액 32,234원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 33334,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(1000);
      expect(res.localIncomeTaxWon).toBe(100);
      expect(res.totalTaxWon).toBe(1100);
      expect(res.netTaxablePayWon).toBe(32234);
    });

    it('5. 100,000원 지급 시 소득세 3,000원, 지방소득세 300원, 실수령액 96,700원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 100000,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(3000);
      expect(res.localIncomeTaxWon).toBe(300);
      expect(res.totalTaxWon).toBe(3300);
      expect(res.netTaxablePayWon).toBe(96700);
    });

    it('6. 123,456원 지급 시 소득세 3,700원, 지방소득세 370원, 실수령액 119,386원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 123456,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(3700);
      expect(res.localIncomeTaxWon).toBe(370);
      expect(res.totalTaxWon).toBe(4070);
      expect(res.netTaxablePayWon).toBe(119386);
    });
  });

  // 2. Standard Amounts Verification (tests 7~20)
  describe('다양한 표준 시급 및 일당 금액 검증', () => {
    const testCases = [
      { gross: 10000, incomeTax: 300, localTax: 30, net: 9670 },
      { gross: 15000, incomeTax: 450, localTax: 40, net: 14510 },
      { gross: 50000, incomeTax: 1500, localTax: 150, net: 48350 },
      { gross: 80000, incomeTax: 2400, localTax: 240, net: 77360 },
      { gross: 90000, incomeTax: 2700, localTax: 270, net: 87030 },
      { gross: 150000, incomeTax: 4500, localTax: 450, net: 145050 },
      { gross: 200000, incomeTax: 6000, localTax: 600, net: 193400 },
      { gross: 250000, incomeTax: 7500, localTax: 750, net: 241750 },
      { gross: 300000, incomeTax: 9000, localTax: 900, net: 290100 },
      { gross: 500000, incomeTax: 15000, localTax: 1500, net: 483500 },
      { gross: 750000, incomeTax: 22500, localTax: 2250, net: 725250 },
      { gross: 1000000, incomeTax: 30000, localTax: 3000, net: 967000 },
      { gross: 1500000, incomeTax: 45000, localTax: 4500, net: 1450500 },
      { gross: 2500000, incomeTax: 75000, localTax: 7500, net: 2417500 },
    ];

    testCases.forEach(({ gross, incomeTax, localTax, net }, idx) => {
      it(`케이스 ${idx + 7}: ${gross.toLocaleString()}원 계산 정확도`, () => {
        const res = calculateBusinessIncomePay({
          taxableGrossWon: gross,
          paidOn: validDate,
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        });
        expect(res.incomeTaxWon).toBe(incomeTax);
        expect(res.localIncomeTaxWon).toBe(localTax);
        expect(res.netTaxablePayWon).toBe(net);
      });
    });
  });

  // 3. 10원 단위 절사 미묘한 경계값 검증 (tests 21~28)
  describe('10원 미만 절사(Floor) 상세 경계값 검증', () => {
    it('21. 1원 단위 절사: 33,331원 -> 소득세 990원, 지방소득세 90원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 33331,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(990);
      expect(res.localIncomeTaxWon).toBe(90);
    });

    it('22. 1원 단위 절사: 33,332원 -> 소득세 990원, 지방소득세 90원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 33332,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(990);
      expect(res.localIncomeTaxWon).toBe(90);
    });

    it('23. 1원 단위 절사: 33,335원 -> 소득세 1000원, 지방소득세 100원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 33335,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(1000);
      expect(res.localIncomeTaxWon).toBe(100);
    });

    it('24. 1원 단위 절사: 33,339원 -> 소득세 1000원, 지방소득세 100원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 33339,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(1000);
      expect(res.localIncomeTaxWon).toBe(100);
    });

    it('25. 1원 단위 절사: 66,666원 -> 소득세 1,990원, 지방소득세 190원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 66666,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(1990);
      expect(res.localIncomeTaxWon).toBe(190);
    });

    it('26. 1원 단위 절사: 99,999원 -> 소득세 2,990원, 지방소득세 290원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 99999,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(2990);
      expect(res.localIncomeTaxWon).toBe(290);
    });

    it('27. 소액 지급액 100원 -> 소득세 0원, 지방세 0원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 100,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(0);
      expect(res.localIncomeTaxWon).toBe(0);
      expect(res.netTaxablePayWon).toBe(100);
    });

    it('28. 소액 지급액 333원 -> 소득세 0원, 지방세 0원', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 333,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.incomeTaxWon).toBe(0);
      expect(res.localIncomeTaxWon).toBe(0);
      expect(res.netTaxablePayWon).toBe(333);
    });
  });

  // 4. Date validation & Policy Range (tests 29~34)
  describe('지급일자 및 세법 적용 기간 검증', () => {
    it('29. 적용 시작일 정상 (2024-07-01)', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 100000,
        paidOn: '2024-07-01',
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.paidOn).toBe('2024-07-01');
      expect(res.netTaxablePayWon).toBe(96700);
    });

    it('30. 기준 종료일 정상 (2026-10-09)', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 100000,
        paidOn: '2026-10-09',
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.paidOn).toBe('2026-10-09');
    });

    it('31. 2024-07-01 이전 일자는 TAX_POLICY_REVIEW_REQUIRED 예외', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 100000,
          paidOn: '2024-06-30',
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('TAX_POLICY_REVIEW_REQUIRED');
    });

    it('32. 2026-10-09 이후 일자는 TAX_POLICY_REVIEW_REQUIRED 예외', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 100000,
          paidOn: '2026-10-10',
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('TAX_POLICY_REVIEW_REQUIRED');
    });

    it('33. 잘못된 날짜 포맷 (YYYY/MM/DD) 예외', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 100000,
          paidOn: '2025/08/01',
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_PAYMENT_DATE');
    });

    it('34. 날짜 문자열 공백/누락 예외', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 100000,
          paidOn: '',
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_PAYMENT_DATE');
    });

    it('34-1. 달력상 존재하지 않는 날짜(예: 2025-02-29, 2025-04-31)는 INVALID_CALENDAR_DATE 예외', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 100000,
          paidOn: '2025-02-29',
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_CALENDAR_DATE');

      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 100000,
          paidOn: '2025-04-31',
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_CALENDAR_DATE');
    });
  });

  // 5. Input Validation & Edge Error handling (tests 35~40)
  describe('입력값 무결성 및 비정상 입력 검증', () => {
    it('35. 음수 금액 예외 (INVALID_WON_AMOUNT)', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: -50000,
          paidOn: validDate,
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_WON_AMOUNT');
    });

    it('36. 소수점 포함 금액 예외 (INVALID_WON_AMOUNT)', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 50000.5,
          paidOn: validDate,
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_WON_AMOUNT');
    });

    it('37. 미지원 소득 타입 예외 (UNSUPPORTED_INCOME_TYPE)', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: 50000,
          paidOn: validDate,
          // @ts-expect-error intentionally testing invalid input
          incomeType: 'OTHER_INCOME',
        })
      ).toThrow('UNSUPPORTED_INCOME_TYPE');
    });

    it('38. NaN 또는 Infinity 입력 시 예외', () => {
      expect(() =>
        calculateBusinessIncomePay({
          taxableGrossWon: NaN,
          paidOn: validDate,
          incomeType: 'RESIDENT_PERSONAL_SERVICE',
        })
      ).toThrow('INVALID_WON_AMOUNT');
    });

    it('39. input 객체 null/undefined 예외', () => {
      // @ts-expect-error intentionally passing null
      expect(() => calculateBusinessIncomePay(null)).toThrow('UNSUPPORTED_INCOME_TYPE');
    });

    it('40. 세법 정책 버전 태그 명시 검증 (KR_RESIDENT_PERSONAL_SERVICE_REVIEW_2026-10-09)', () => {
      const res = calculateBusinessIncomePay({
        taxableGrossWon: 50000,
        paidOn: validDate,
        incomeType: 'RESIDENT_PERSONAL_SERVICE',
      });
      expect(res.taxPolicyVersion).toBe('KR_RESIDENT_PERSONAL_SERVICE_REVIEW_2026-10-09');
      expect(res.totalTaxWon).toBe(res.incomeTaxWon + res.localIncomeTaxWon);
      expect(res.netTaxablePayWon).toBe(res.taxableGrossWon - res.totalTaxWon);
    });
  });
});
