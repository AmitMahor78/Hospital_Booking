import {
  OtpResponse,
  BenefitVerificationResult,
  EligibilityStatusResult,
  BenefitDetailsResult,
} from './types.ts';

export interface GovernmentBenefitProvider {
  name: string;
  isAuthorizedLive: boolean;

  sendVerificationOtp(
    identifier: string,
    scheme: string,
    mobileHint?: string
  ): Promise<OtpResponse>;

  verifyOtp(
    otpTxnId: string,
    otp: string,
    identifier: string,
    scheme: string
  ): Promise<BenefitVerificationResult>;

  searchBeneficiary(
    identifier: string,
    scheme: string
  ): Promise<BenefitVerificationResult>;

  getEligibilityStatus(
    beneficiaryId: string
  ): Promise<EligibilityStatusResult>;

  getBenefitDetails(
    beneficiaryId: string
  ): Promise<BenefitDetailsResult>;
}
