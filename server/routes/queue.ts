import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { QueueTokenStatus } from '../types.ts';

const router = Router();

// GET Hospital Queue status (Public display / OPD Ticker)
// Queue security: Does not expose unnecessary medical details
router.get('/:hospitalId', (req: Request, res: Response) => {
  const hospitalId = req.params.hospitalId;
  const { doctorId, departmentId, date } = req.query as {
    doctorId?: string;
    departmentId?: string;
    date?: string;
  };

  const today = date || new Date().toISOString().split('T')[0];
  const allTokens = dbStore.getQueueTokens({
    hospitalId,
    doctorId,
    departmentId,
    date: today,
  });

  const activeToken = allTokens.find(
    (t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION'
  );
  const waitingTokens = allTokens
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const completedTokens = allTokens.filter((t) => t.status === 'COMPLETED');

  // Sanitized public token view
  const publicWaiting = waitingTokens.map((t, idx) => ({
    id: t.id,
    tokenNumber: t.tokenNumber,
    roomNumber: t.roomNumber,
    floor: t.floor,
    doctorName: t.doctorName,
    sequenceNumber: t.sequenceNumber,
    status: t.status,
    patientsAhead: idx,
    estimatedWaitMinutes: Math.max(5, (idx + 1) * 8),
  }));

  res.json({
    hospitalId,
    date: today,
    currentServing: activeToken
      ? {
          id: activeToken.id,
          tokenNumber: activeToken.tokenNumber,
          roomNumber: activeToken.roomNumber,
          floor: activeToken.floor,
          doctorName: activeToken.doctorName,
          status: activeToken.status,
        }
      : null,
    totalWaiting: waitingTokens.length,
    totalCompleted: completedTokens.length,
    waitingList: publicWaiting,
    disclaimer: 'Waiting time is an estimate and may change based on clinical consultation durations.',
  });
});

// GET Patient's specific token status & estimated wait
router.get('/token/:id', (req: Request, res: Response) => {
  const token = dbStore.getQueueTokenById(req.params.id);
  if (!token) {
    return res.status(404).json({ error: 'Queue token not found' });
  }

  // Ensure current room & floor
  const doc = dbStore.getDoctorById(token.doctorId);
  if (doc) {
    token.roomNumber = doc.roomNumber;
    token.floor = doc.floor;
  }

  const allWaiting = dbStore
    .getQueueTokens({
      hospitalId: token.hospitalId,
      doctorId: token.doctorId,
      date: token.date,
      status: 'WAITING',
    })
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const tokenIndex = allWaiting.findIndex((t) => t.id === token.id);
  const patientsAhead = tokenIndex >= 0 ? tokenIndex : 0;
  const avgMin = doc?.avgConsultMin || 10;
  const estimatedWaitMinutes = Math.max(5, (patientsAhead + 1) * avgMin);

  const currentlyServing = dbStore
    .getQueueTokens({
      hospitalId: token.hospitalId,
      doctorId: token.doctorId,
      date: token.date,
    })
    .find((t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');

  res.json({
    token,
    patientsAhead,
    estimatedWaitMinutes,
    currentlyServing: currentlyServing
      ? {
          tokenNumber: currentlyServing.tokenNumber,
          status: currentlyServing.status,
          roomNumber: currentlyServing.roomNumber,
        }
      : null,
    disclaimer: 'Waiting time is an estimate and may change.',
  });
});

// POST Call next patient (Staff or Doctor)
router.post('/:hospitalId/call-next', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const hospitalId = req.params.hospitalId;
  const { doctorId, date } = req.body as { doctorId: string; date?: string };

  if (!doctorId) {
    return res.status(400).json({ error: 'Doctor ID is required to call next patient' });
  }

  const today = date || new Date().toISOString().split('T')[0];
  const calledToken = dbStore.callNextQueueToken(hospitalId, doctorId, today);

  if (!calledToken) {
    return res.status(200).json({
      success: false,
      message: 'No more waiting patients in queue for this doctor today.',
    });
  }

  dbStore.addAuditLog({
    userId: req.user?.userId,
    role: req.user?.role,
    action: 'QUEUE_PATIENT_CALLED',
    resource: 'QueueToken',
    resourceId: calledToken.id,
    status: 'SUCCESS',
    details: {
      tokenNumber: calledToken.tokenNumber,
      doctorId,
      roomNumber: calledToken.roomNumber,
    },
  });

  res.json({
    success: true,
    message: `Now calling token ${calledToken.tokenNumber} to ${calledToken.roomNumber}!`,
    token: calledToken,
  });
});

// POST Update token status (IN_CONSULTATION, COMPLETED, SKIPPED)
router.post('/token/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const tokenId = req.params.id;
  const { status } = req.body as { status: QueueTokenStatus };

  if (!['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid queue token status' });
  }

  const updated = dbStore.updateQueueTokenStatus(tokenId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Token not found' });
  }

  dbStore.addAuditLog({
    userId: req.user?.userId,
    role: req.user?.role,
    action: `QUEUE_TOKEN_${status}`,
    resource: 'QueueToken',
    resourceId: tokenId,
    status: 'SUCCESS',
    details: { tokenNumber: updated.tokenNumber, status },
  });

  res.json({ success: true, token: updated });
});

export default router;
