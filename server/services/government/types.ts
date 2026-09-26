import { BenefitVerificationStatus, VerificationSource } from '../../types.ts';

export interface OtpResponse {
  otpTxnId: string;
  maskedMobile: string;
  expiresInSeconds: number;
  mode: VerificationSource;
  message: string;
  demoOtp?: string;
}

export interface BenefitVerificationResult {
  verificationStatus: BenefitVerificationStatus;
  beneficiaryStatus?: string;
  schemeName: string;
  verifiedAt: string;
  source: VerificationSource;
  message: string;
  beneficiaryDetails?: {
    maskedName?: string;
    cardStatus?: string;
    schemeType?: string;
    hospitalEligibilityNote?: string;
  };
}

export interface EligibilityStatusResult {
  beneficiaryId: string;
  isEligible: boolean;
  status: string;
  details: string;
}

export interface BenefitDetailsResult {
  schemeName: string;
  coverageCategory: string;
  empaneledHospitalNotice: string;
}
