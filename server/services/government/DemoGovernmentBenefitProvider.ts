import { GovernmentBenefitProvider } from './GovernmentBenefitProvider.ts';
import {
  OtpResponse,
  BenefitVerificationResult,
  EligibilityStatusResult,
  BenefitDetailsResult,
} from './types.ts';

interface StoredOtpSession {
  otpTxnId: string;
  hashedOtp: string;
  rawOtp: string;
  identifier: string;
  scheme: string;
  expiresAt: number;
  attemptsLeft: number;
}

export class DemoGovernmentBenefitProvider implements GovernmentBenefitProvider {
  public name = 'Demo/Sandbox Government Benefit Gateway (Simulated Official Provider)';
  public isAuthorizedLive = false;

  // In-memory short-lived OTP sessions with strict TTL
  private sessions = new Map<string, StoredOtpSession>();

  // Simple string hash for demo OTP storage
  private hashOtp(otp: string): string {
    let hash = 0;
    for (let i = 0; i < otp.length; i++) {
      hash = (hash << 5) - hash + otp.charCodeAt(i);
      hash |= 0;
    }
    return `h_${hash}`;
  }

  async sendVerificationOtp(
    identifier: string,
    scheme: string,
    mobileHint?: string
  ): Promise<OtpResponse> {
    // Basic format validation
    const cleanedId = identifier.trim();
    if (!cleanedId || cleanedId.length < 6) {
      throw new Error('Invalid scheme identifier format. Please enter a valid PM-JAY Card No, Ration Card No, or State Health ID.');
    }

    // Generate secure random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpTxnId = `tx-demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Store OTP session (10 minute expiration for comfortable testing)
    this.sessions.set(otpTxnId, {
      otpTxnId,
      hashedOtp: this.hashOtp(generatedOtp),
      rawOtp: generatedOtp,
      identifier: cleanedId,
      scheme,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attemptsLeft: 5,
    });

    const cleanMobile = mobileHint ? mobileHint.replace(/\D/g, '') : '';
    const maskedMobile = cleanMobile.length >= 10
      ? `${cleanMobile.slice(0, 2)}******${cleanMobile.slice(-2)}`
      : '98******10';

    return {
      otpTxnId,
      maskedMobile,
      expiresInSeconds: 600,
      mode: 'DEMO_SANDBOX',
      demoOtp: generatedOtp,
      message: `[Demo Sandbox] Verification OTP dispatched to registered mobile ${maskedMobile}. For testing sandbox flow, use OTP code: ${generatedOtp} (or 123456)`,
    };
  }

  async verifyOtp(
    otpTxnId: string,
    otp: string,
    identifier: string,
    scheme: string
  ): Promise<BenefitVerificationResult> {
    const cleanOtp = String(otp || '').trim();
    const session = this.sessions.get(otpTxnId);

    // Check if universal demo code '123456' / '000000' or matching session OTP
    const isUniversalCode = cleanOtp === '123456' || cleanOtp === '000000';
    const isSessionMatch = session && (cleanOtp === session.rawOtp || this.hashOtp(cleanOtp) === session.hashedOtp);

    // If session is expired or not found, but universal demo code is provided in demo sandbox mode, allow it
    if (!session && !isUniversalCode) {
      return {
        verificationStatus: 'VERIFICATION_FAILED',
        schemeName: scheme || 'PM-JAY (Ayushman Bharat)',
        verifiedAt: new Date().toISOString(),
        source: 'DEMO_SANDBOX',
        message: 'The verification session has expired or is invalid. Please request a new OTP (or use 123456).',
      };
    }

    if (session && Date.now() > session.expiresAt && !isUniversalCode) {
      this.sessions.delete(otpTxnId);
      return {
        verificationStatus: 'VERIFICATION_FAILED',
        schemeName: scheme,
        verifiedAt: new Date().toISOString(),
        source: 'DEMO_SANDBOX',
        message: 'OTP session expired. For security, please request a fresh verification OTP (or use 123456).',
      };
    }

    if (!isUniversalCode && !isSessionMatch) {
      if (session) {
        session.attemptsLeft -= 1;
        if (session.attemptsLeft <= 0) {
          this.sessions.delete(otpTxnId);
          return {
            verificationStatus: 'VERIFICATION_FAILED',
            schemeName: scheme,
            verifiedAt: new Date().toISOString(),
            source: 'DEMO_SANDBOX',
            message: 'Maximum retry limit exceeded. Please request a new OTP.',
          };
        }
        return {
          verificationStatus: 'VERIFICATION_FAILED',
          schemeName: scheme,
          verifiedAt: new Date().toISOString(),
          source: 'DEMO_SANDBOX',
          message: `Incorrect OTP. ${session.attemptsLeft} attempt(s) remaining. (Sandbox hint: use ${session.rawOtp} or 123456)`,
        };
      }
    }

    // Clean up used session
    if (session) {
      this.sessions.delete(otpTxnId);
    }

    // Simulated sandbox eligibility check
    const maskedId = identifier.length > 4 ? `****-${identifier.slice(-4)}` : identifier;

    return {
      verificationStatus: 'VERIFIED',
      beneficiaryStatus: 'ELIGIBLE_ACTIVE_CARD',
      schemeName: scheme || 'PM-JAY (Ayushman Bharat)',
      verifiedAt: new Date().toISOString(),
      source: 'DEMO_SANDBOX',
      message: `Verified under ${scheme} [Sandbox Mode]. Beneficiary record matched with National Health Authority Sandbox registry.`,
      beneficiaryDetails: {
        maskedName: 'R***** K****',
        cardStatus: 'Active PM-JAY Card',
        schemeType: 'Pradhan Mantri Jan Arogya Yojana',
        hospitalEligibilityNote:
          'Benefit eligibility depends on the official verification result and applicable scheme rules. Hospital admission desk must perform biometric e-KYC for package billing.',
      },
    };
  }

  async searchBeneficiary(identifier: string, scheme: string): Promise<BenefitVerificationResult> {
    const masked = identifier.length > 4 ? `****-${identifier.slice(-4)}` : identifier;
    return {
      verificationStatus: 'NEEDS_HOSPITAL_VERIFICATION',
      beneficiaryStatus: 'RECORD_FOUND_REQUIRES_BIOMETRIC',
      schemeName: scheme,
      verifiedAt: new Date().toISOString(),
      source: 'DEMO_SANDBOX',
      message: `Beneficiary record ${masked} found in demo directory. In-person biometric / hospital desk verification required.`,
    };
  }

  async getEligibilityStatus(beneficiaryId: string): Promise<EligibilityStatusResult> {
    return {
      beneficiaryId,
      isEligible: true,
      status: 'PRE_APPROVED_FOR_VERIFICATION',
      details: 'Active within current fiscal benefit period subject to scheme guidelines.',
    };
  }

  async getBenefitDetails(beneficiaryId: string): Promise<BenefitDetailsResult> {
    return {
      schemeName: 'Ayushman Bharat PM-JAY',
      coverageCategory: 'Secondary & Tertiary Care (Up to INR 5,00,000 per family/year)',
      empaneledHospitalNotice:
        'Entering Ayushman Bharat information does not confirm eligibility or guarantee free treatment. Benefits must be verified by the hospital or an authorized scheme system.',
    };
  }
}
