/**
 * Tax Tech Identification & Withholding Verification Adapter (Fake/Mock & Interface)
 * Strictly complies with privacy rules: Uses tax_provider_user_key without storing raw SSN
 */

export type TaxIdentifierVerificationRequest = {
  personId: string;
  taxProviderUserKey: string;
  name: string;
};

export type TaxIdentifierVerificationResponse = {
  verified: boolean;
  taxProviderUserKey: string;
  residentStatus: 'DOMESTIC_RESIDENT' | 'NON_RESIDENT';
  verifiedAt: string;
  eligibleForPersonalServiceIncome: boolean;
};

export interface ITaxAdapter {
  verifyTaxIdentifier(req: TaxIdentifierVerificationRequest): Promise<TaxIdentifierVerificationResponse>;
}

export class FakeTaxAdapter implements ITaxAdapter {
  async verifyTaxIdentifier(req: TaxIdentifierVerificationRequest): Promise<TaxIdentifierVerificationResponse> {
    const { taxProviderUserKey, name } = req;

    if (!taxProviderUserKey || taxProviderUserKey.length < 8) {
      throw new Error('INVALID_TAX_KEY: Tax provider user key must be at least 8 characters');
    }

    if (taxProviderUserKey.endsWith('_INVALID')) {
      return {
        verified: false,
        taxProviderUserKey,
        residentStatus: 'DOMESTIC_RESIDENT',
        verifiedAt: new Date().toISOString(),
        eligibleForPersonalServiceIncome: false,
      };
    }

    return {
      verified: true,
      taxProviderUserKey,
      residentStatus: 'DOMESTIC_RESIDENT',
      verifiedAt: new Date().toISOString(),
      eligibleForPersonalServiceIncome: true,
    };
  }
}

export const taxAdapter = new FakeTaxAdapter();
