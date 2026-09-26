import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { Appointment, AppointmentStatus } from '../types.ts';

const router = Router();

// Helper to generate reference: SWQ-2026-XXXXX
function generateAppointmentRef(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SWQ-2026-${randomNum}`;
}

// POST Book appointment
router.post('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      hospitalId,
      departmentId,
      doctorId,
      date,
      timeSlot,
      patientName,
      patientMobile,
      patientAge,
      visitReason,
      currentCondition,
      benefitVerificationId,
      benefitStatus,
    } = req.body;

    if (!hospitalId || !departmentId || !doctorId || !date || !timeSlot || !patientName || !patientMobile || !patientAge) {
      return res.status(400).json({ error: 'Please provide all required appointment fields.' });
    }

    const hospital = dbStore.getHospitalById(hospitalId);
    if (!hospital) return res.status(404).json({ error: 'Selected hospital not found.' });

    const department = dbStore.getDepartmentById(departmentId);
    if (!department) return res.status(404).json({ error: 'Selected department not found.' });

    const doctor = dbStore.getDoctorById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Selected doctor not found.' });

    // Verify backend availability (Do not trust frontend alone)
    const scheduleSlots = dbStore.getDoctorSchedule(doctorId, date);
    const targetSlot = scheduleSlots.find((s) => s.timeSlot === timeSlot);
    if (targetSlot && targetSlot.status !== 'AVAILABLE') {
      return res.status(409).json({
        error: `Slot ${timeSlot} on ${date} is no longer available. Please select another slot.`,
      });
    }

    const appointmentRef = generateAppointmentRef();
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      appointmentRef,
      hospitalId,
      hospitalName: hospital.name,
      departmentId,
      departmentName: department.name,
      doctorId,
      doctorName: doctor.name,
      doctorRoom: doctor.roomNumber,
      doctorFloor: doctor.floor,
      patientId: req.user?.userId || `pat-${patientMobile}`,
      patientName: patientName.trim(),
      patientMobile: patientMobile.trim(),
      patientAge: Number(patientAge),
      date,
      timeSlot,
      visitReason: visitReason ? visitReason.trim() : undefined,
      currentCondition: currentCondition ? currentCondition.trim() : undefined,
      status: 'BOOKED',
      benefitStatus: benefitStatus || (benefitVerificationId ? 'VERIFIED' : 'NOT_VERIFIED'),
      benefitVerificationId: benefitVerificationId || undefined,
      createdAt: new Date().toISOString(),
    };

    const saved = dbStore.createAppointment(newAppointment);

    dbStore.addAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'PATIENT',
      action: 'APPOINTMENT_CREATED',
      resource: 'Appointment',
      resourceId: saved.id,
      status: 'SUCCESS',
      details: {
        appointmentRef,
        hospital: hospital.name,
        doctor: doctor.name,
        date,
        timeSlot,
      },
    });

    res.status(201).json({
      success: true,
      appointment: saved,
      disclaimer: 'Benefit verification status does not by itself guarantee free treatment or eligibility for every service. Official scheme rules and hospital clinical criteria apply.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to book appointment' });
  }
});

// GET appointments list
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { mobile, hospitalId, doctorId, departmentId, date, status } = req.query as {
    mobile?: string;
    hospitalId?: string;
    doctorId?: string;
    departmentId?: string;
    date?: string;
    status?: AppointmentStatus;
  };

  let appointments: Appointment[] = [];
  if (mobile) {
    appointments = dbStore.getAppointmentsByPatientMobile(mobile);
  } else {
    appointments = dbStore.getAppointments({
      hospitalId,
      doctorId,
      departmentId,
      date,
      status,
    });
  }

  res.json(appointments);
});

// GET single appointment
router.get('/:id', (req: Request, res: Response) => {
  const appointment = dbStore.getAppointmentById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  // Ensure current doctor room/floor is reflected
  const doc = dbStore.getDoctorById(appointment.doctorId);
  if (doc) {
    appointment.doctorRoom = doc.roomNumber;
    appointment.doctorFloor = doc.floor;
  }

  let queueToken;
  if (appointment.queueTokenId) {
    queueToken = dbStore.getQueueTokenById(appointment.queueTokenId);
  }

  res.json({
    appointment,
    queueToken,
    disclaimer: 'Benefit verification status does not by itself guarantee free treatment or eligibility for every service.',
  });
});

// POST Check-in appointment -> Generates live Queue Token (e.g. A-27)
router.post('/:id/check-in', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const appointmentId = req.params.id;
    const { token, appointment } = dbStore.generateQueueToken(appointmentId);

    dbStore.addAuditLog({
      userId: req.user?.userId,
      role: req.user?.role || 'PATIENT',
      action: 'QUEUE_TOKEN_GENERATED',
      resource: 'QueueToken',
      resourceId: token.id,
      status: 'SUCCESS',
      details: {
        appointmentRef: appointment.appointmentRef,
        tokenNumber: token.tokenNumber,
        doctor: token.doctorName,
        room: token.roomNumber,
      },
    });

    res.json({
      success: true,
      message: `Checked in successfully! Your token number is ${token.tokenNumber}.`,
      token,
      appointment,
      disclaimer: 'Waiting time is an estimate and may change based on clinical consultation durations.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to check in' });
  }
});

// POST Cancel appointment
router.post('/:id/cancel', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const appointmentId = req.params.id;
  const updated = dbStore.updateAppointmentStatus(appointmentId, 'CANCELLED');
  if (!updated) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  dbStore.addAuditLog({
    userId: req.user?.userId,
    role: req.user?.role,
    action: 'APPOINTMENT_MODIFIED',
    resource: 'Appointment',
    resourceId: appointmentId,
    status: 'SUCCESS',
    details: { change: 'CANCELLED' },
  });

  res.json({ success: true, message: 'Appointment cancelled.', appointment: updated });
});

export default router;
