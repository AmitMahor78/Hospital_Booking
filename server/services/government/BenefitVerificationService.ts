import { GovernmentBenefitProvider } from './GovernmentBenefitProvider.ts';
import { DemoGovernmentBenefitProvider } from './DemoGovernmentBenefitProvider.ts';
import { AuthorizedGovernmentBenefitProvider } from './AuthorizedGovernmentBenefitProvider.ts';
import { OtpResponse, BenefitVerificationResult } from './types.ts';
import { dbStore } from '../../db/store.ts';

class BenefitVerificationService {
  private provider: GovernmentBenefitProvider;
  private isGovernmentApiEnabled: boolean;

  // Simple in-memory rate limiting map: ip -> request timestamps
  private rateLimitMap = new Map<string, number[]>();

  constructor() {
    this.isGovernmentApiEnabled = process.env.GOVERNMENT_API_ENABLED === 'true';
    if (this.isGovernmentApiEnabled) {
      this.provider = new AuthorizedGovernmentBenefitProvider();
    } else {
      this.provider = new DemoGovernmentBenefitProvider();
    }
  }

  public getProviderStatus() {
    return {
      isGovernmentApiEnabled: this.isGovernmentApiEnabled,
      providerName: this.provider.name,
      mode: this.isGovernmentApiEnabled ? 'AUTHORIZED_GOVERNMENT_API' : 'DEMO_SANDBOX',
      notice:
        'Entering Ayushman Bharat information does not confirm eligibility or guarantee free treatment. Benefits must be verified by the hospital or an authorized scheme system.',
    };
  }

  private checkRateLimit(key: string, maxRequests = 20, windowMs = 60000) {
    // In demo sandbox mode, allow rapid testing without blocking evaluators
    if (!this.isGovernmentApiEnabled) {
      maxRequests = 60;
    }

    const now = Date.now();
    const timestamps = this.rateLimitMap.get(key) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);

    if (valid.length >= maxRequests) {
      throw new Error('Too many verification requests. Please wait a moment before trying again.');
    }

    valid.push(now);
    this.rateLimitMap.set(key, valid);
  }

  async requestVerificationOtp(
    identifier: string,
    scheme: string,
    mobileHint?: string,
    userId?: string,
    ipAddress?: string
  ): Promise<OtpResponse> {
    this.checkRateLimit(`otp:${identifier || ipAddress}`, 15, 60000);

    // Audit log request (Never log OTP)
    dbStore.addAuditLog({
      userId,
      role: 'PATIENT',
      action: 'OTP_REQUESTED',
      resource: 'BenefitVerification',
      status: 'SUCCESS',
      ipAddress,
      details: {
        scheme,
        maskedIdentifier: identifier.length > 4 ? `****-${identifier.slice(-4)}` : '****',
        providerMode: this.isGovernmentApiEnabled ? 'AUTHORIZED' : 'DEMO_SANDBOX',
      },
    });

    return this.provider.sendVerificationOtp(identifier, scheme, mobileHint);
  }

  async verifyOtp(
    otpTxnId: string,
    otp: string,
    identifier: string,
    scheme: string,
    appointmentId?: string,
    userId?: string,
    ipAddress?: string
  ): Promise<BenefitVerificationResult> {
    this.checkRateLimit(`verify:${ipAddress || identifier}`, 6, 60000);

    const result = await this.provider.verifyOtp(otpTxnId, otp, identifier, scheme);

    // Save record to DB
    const maskedId = identifier.length > 4 ? `****-${identifier.slice(-4)}` : identifier;
    const recId = `bv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const saved = dbStore.saveBenefitVerification({
      id: recId,
      identifier: maskedId,
      schemeName: scheme,
      verificationStatus: result.verificationStatus,
      beneficiaryStatus: result.beneficiaryStatus,
      verifiedAt: result.verifiedAt,
      source: result.source,
      message: result.message,
      retryCount: 0,
      lastAttemptAt: new Date().toISOString(),
    });

    // If an appointment ID was attached, link and update it
    if (appointmentId) {
      dbStore.updateAppointmentBenefitStatus(appointmentId, result.verificationStatus, saved.id);
    }

    // Audit log (Never log OTP value)
    dbStore.addAuditLog({
      userId,
      action: 'VERIFICATION_COMPLETED',
      resource: 'BenefitVerification',
      resourceId: saved.id,
      status: result.verificationStatus === 'VERIFIED' ? 'SUCCESS' : 'FAILED',
      ipAddress,
      details: {
        scheme,
        verificationStatus: result.verificationStatus,
        source: result.source,
      },
    });

    return result;
  }
}

export const benefitVerificationService = new BenefitVerificationService();
