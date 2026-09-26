import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET Audit Logs (Restricted to Staff, Benefit Desk, Doctor, Admin)
router.get(
  '/',
  requireAuth,
  requireRoles(['STAFF', 'BENEFIT_DESK', 'ADMIN', 'DOCTOR']),
  (req: AuthenticatedRequest, res: Response) => {
    const limit = Number(req.query.limit) || 100;
    const logs = dbStore.getAuditLogs(limit);
    res.json(logs);
  }
);

export default router;
