import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { DoctorStatus } from '../types.ts';

const router = Router();

// GET doctors
router.get('/', (req: Request, res: Response) => {
  const { hospitalId, departmentId } = req.query as {
    hospitalId?: string;
    departmentId?: string;
  };
  const doctors = dbStore.getDoctors(hospitalId, departmentId);
  res.json(doctors);
});

// GET doctor by id
router.get('/:id', (req: Request, res: Response) => {
  const doctor = dbStore.getDoctorById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  res.json(doctor);
});

// GET doctor schedule slots for a given date
router.get('/:id/availability', (req: Request, res: Response) => {
  const doctorId = req.params.id;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const doctor = dbStore.getDoctorById(doctorId);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const slots = dbStore.getDoctorSchedule(doctorId, date);
  res.json({
    doctorId,
    doctorName: doctor.name,
    doctorStatus: doctor.status,
    roomNumber: doctor.roomNumber,
    floor: doctor.floor,
    date,
    slots,
  });
});

// Update doctor availability status (Doctor or Staff)
router.post('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const doctorId = req.params.id;
  const { status } = req.body as { status: DoctorStatus };

  if (!['AVAILABLE', 'UNAVAILABLE', 'BREAK'].includes(status)) {
    return res.status(400).json({ error: 'Invalid doctor status' });
  }

  const updated = dbStore.updateDoctorStatus(doctorId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  dbStore.addAuditLog({
    userId: req.user?.userId,
    role: req.user?.role,
    action: 'DOCTOR_STATUS_UPDATED',
    resource: 'Doctor',
    resourceId: doctorId,
    status: 'SUCCESS',
    details: { newStatus: status },
  });

  res.json({ success: true, doctor: updated });
});

// Update doctor room / floor assignment (Staff or Doctor)
router.post('/:id/room', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const doctorId = req.params.id;
  const { roomNumber, floor, block } = req.body as {
    roomNumber: string;
    floor: string;
    block?: string;
  };

  if (!roomNumber || !floor) {
    return res.status(400).json({ error: 'Room number and floor are required' });
  }

  const updated = dbStore.updateDoctorRoomAndFloor(doctorId, roomNumber, floor, block);
  if (!updated) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  dbStore.addAuditLog({
    userId: req.user?.userId,
    role: req.user?.role,
    action: 'DOCTOR_ROOM_UPDATED',
    resource: 'Doctor',
    resourceId: doctorId,
    status: 'SUCCESS',
    details: { roomNumber, floor, block },
  });

  res.json({
    success: true,
    doctor: updated,
    message: 'Doctor room updated. Active patient appointment locations have been synchronized.',
  });
});

export default router;
