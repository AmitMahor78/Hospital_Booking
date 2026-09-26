import { Router, Request, Response } from 'express';
import { benefitVerificationService } from '../services/government/BenefitVerificationService.ts';
import { dbStore } from '../db/store.ts';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET Gateway & Provider status
router.get('/status', (_req: Request, res: Response) => {
  const status = benefitVerificationService.getProviderStatus();
  res.json({
    ...status,
    schemesSupported: [
      { id: 'PM-JAY', name: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)' },
      { id: 'STATE_SCHEME', name: 'State Government Health Scheme / Ration Card Benefit' },
      { id: 'ESIC_CGHS', name: 'Central / State Beneficiary Health Card' },
    ],
    guidance: {
      abhaVsPmjay:
        'ABHA (Ayushman Bharat Health Account) is a 14-digit digital health identity for linking health records. PM-JAY is the health insurance/benefit scheme with designated beneficiary eligibility criteria. Having an ABHA card does NOT automatically grant PM-JAY financial coverage.',
      eligibilityDisclaimer:
        'Entering Ayushman Bharat information does not confirm eligibility or guarantee free treatment. Benefits must be verified by the hospital or an authorized scheme system.',
    },
  });
});

// POST Initiate Scheme Verification (OTP dispatch)
router.post('/verification/start', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier, scheme, mobileHint } = req.body;
    if (!identifier || !scheme) {
      return res.status(400).json({ error: 'Scheme identifier and scheme type are required.' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const otpResult = await benefitVerificationService.requestVerificationOtp(
      identifier,
      scheme,
      mobileHint,
      req.user?.userId,
      clientIp
    );

    res.json({
      success: true,
      ...otpResult,
      disclaimer:
        'Entering Ayushman Bharat information does not confirm eligibility or guarantee free treatment. Benefits must be verified by the hospital or an authorized scheme system.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Verification request failed' });
  }
});

// POST Verify Scheme OTP
router.post('/verification/otp', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { otpTxnId, otp, identifier, scheme, appointmentId } = req.body;
    if (!otpTxnId || !otp || !identifier || !scheme) {
      return res.status(400).json({ error: 'Missing OTP verification parameters.' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const result = await benefitVerificationService.verifyOtp(
      otpTxnId,
      otp,
      identifier,
      scheme,
      appointmentId,
      req.user?.userId,
      clientIp
    );

    res.json({
      success: result.verificationStatus === 'VERIFIED',
      result,
      disclaimer:
        'Benefit eligibility depends on the official verification result and applicable scheme rules. Appointment booking does not automatically mean treatment is free.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'OTP verification failed' });
  }
});

// GET single verification record
router.get('/verification/:id', (req: Request, res: Response) => {
  const record = dbStore.getBenefitVerification(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Benefit verification record not found' });
  }
  res.json({
    record,
    disclaimer:
      'Entering Ayushman Bharat information does not confirm eligibility or guarantee free treatment. Benefits must be verified by the hospital or an authorized scheme system.',
  });
});

// GET all benefit requests (Staff / Benefit Desk)
router.get('/list', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const verifications = dbStore.listBenefitVerifications();
  res.json(verifications);
});

// POST Mark as "Needs Hospital Verification"
// Strictly complies with: "Do not allow staff to manually claim eligibility unless the authorized system/process permits it."
router.post('/:id/mark-hospital-verification', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const record = dbStore.getBenefitVerification(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Verification record not found' });
  }

  record.verificationStatus = 'NEEDS_HOSPITAL_VERIFICATION';
  record.message = 'Flagged for manual physical document check at Ayushman Mitra Hospital Kiosk.';
  record.lastAttemptAt = new Date().toISOString();

  dbStore.saveBenefitVerification(record);

  dbStore.addAuditLog({
    userId: req.user?.userId,
    role: req.user?.role,
    action: 'FLAGGED_NEEDS_HOSPITAL_VERIFICATION',
    resource: 'BenefitVerification',
    resourceId: record.id,
    status: 'SUCCESS',
  });

  res.json({
    success: true,
    message: 'Verification status updated to Needs Hospital Verification.',
    record,
  });
});

export default router;
