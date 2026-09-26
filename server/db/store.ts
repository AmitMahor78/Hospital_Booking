import {
  User,
  Hospital,
  Department,
  Doctor,
  DoctorScheduleSlot,
  Appointment,
  QueueToken,
  HospitalLocation,
  BenefitVerificationRecord,
  AuditLog,
  DoctorStatus,
  QueueTokenStatus,
  AppointmentStatus,
  BenefitVerificationStatus,
} from '../types.ts';
import {
  SEED_USERS,
  SEED_HOSPITALS,
  SEED_DEPARTMENTS,
  SEED_DOCTORS,
  SEED_LOCATIONS,
  INITIAL_APPOINTMENTS,
  INITIAL_QUEUE_TOKENS,
} from './seedData.ts';

class DataStore {
  private users: User[] = [...SEED_USERS];
  private hospitals: Hospital[] = [...SEED_HOSPITALS];
  private departments: Department[] = [...SEED_DEPARTMENTS];
  private doctors: Doctor[] = [...SEED_DOCTORS];
  private appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
  private queueTokens: QueueToken[] = [...INITIAL_QUEUE_TOKENS];
  private locations: HospitalLocation[] = [...SEED_LOCATIONS];
  private verifications: BenefitVerificationRecord[] = [
    {
      id: 'bv-1',
      patientId: 'pat-1',
      identifier: 'PMJAY-****-9821',
      schemeName: 'PM-JAY (Ayushman Bharat)',
      verificationStatus: 'VERIFIED',
      beneficiaryStatus: 'ELIGIBLE_ACTIVE_CARD',
      verifiedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      source: 'DEMO_SANDBOX',
      message: 'Verified via Sandbox Scheme Gateway. Card valid for empaneled secondary/tertiary hospital care subject to clinical admission packages.',
      retryCount: 0,
      lastAttemptAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ];
  private auditLogs: AuditLog[] = [];
  private tokenCounters: Map<string, number> = new Map(); // key: hospitalId:deptId:docId:date -> number

  constructor() {
    this.tokenCounters.set('hosp-1:dept-1:doc-1:' + new Date().toISOString().split('T')[0], 28);
  }

  // User Methods
  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByMobile(mobile: string): User | undefined {
    return this.users.find((u) => u.mobile === mobile);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.users.push(user);
    return user;
  }

  // Hospital Methods
  getHospitals(state?: string, district?: string): Hospital[] {
    return this.hospitals.filter((h) => {
      if (state && h.state.toLowerCase() !== state.toLowerCase()) return false;
      if (district && h.district.toLowerCase() !== district.toLowerCase()) return false;
      return true;
    });
  }

  getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  // Department Methods
  getDepartments(hospitalId: string): Department[] {
    return this.departments.filter((d) => d.hospitalId === hospitalId);
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments.find((d) => d.id === id);
  }

  // Doctor Methods
  getDoctors(hospitalId?: string, departmentId?: string): Doctor[] {
    return this.doctors.filter((d) => {
      if (hospitalId && d.hospitalId !== hospitalId) return false;
      if (departmentId && d.departmentId !== departmentId) return false;
      return true;
    });
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.doctors.find((d) => d.id === id);
  }

  getDoctorByUserId(userId: string): Doctor | undefined {
    return this.doctors.find((d) => d.userId === userId);
  }

  updateDoctorStatus(doctorId: string, status: DoctorStatus): Doctor | undefined {
    const doc = this.doctors.find((d) => d.id === doctorId);
    if (doc) {
      doc.status = status;
    }
    return doc;
  }

  updateDoctorRoomAndFloor(doctorId: string, room: string, floor: string, block?: string): Doctor | undefined {
    const doc = this.doctors.find((d) => d.id === doctorId);
    if (doc) {
      doc.roomNumber = room;
      doc.floor = floor;
      if (block) doc.block = block;

      // Real-time synchronization: Update doctor's active appointments location
      this.appointments.forEach((apt) => {
        if (apt.doctorId === doctorId && (apt.status === 'BOOKED' || apt.status === 'CHECKED_IN')) {
          apt.doctorRoom = room;
          apt.doctorFloor = floor;
        }
      });

      // Also update any active queue tokens
      this.queueTokens.forEach((tk) => {
        if (tk.doctorId === doctorId && (tk.status === 'WAITING' || tk.status === 'CALLED')) {
          tk.roomNumber = room;
          tk.floor = floor;
        }
      });
    }
    return doc;
  }

  // Doctor Schedule Slots
  getDoctorSchedule(doctorId: string, date: string): DoctorScheduleSlot[] {
    const standardSlots = [
      '09:00 AM',
      '09:30 AM',
      '10:00 AM',
      '10:30 AM',
      '11:00 AM',
      '11:30 AM',
      '12:00 PM',
      '12:30 PM',
      '02:00 PM',
      '02:30 PM',
      '03:00 PM',
    ];

    const bookedAppointments = this.appointments.filter(
      (a) => a.doctorId === doctorId && a.date === date && a.status !== 'CANCELLED'
    );
    const bookedTimeSlots = new Set(bookedAppointments.map((a) => a.timeSlot));

    const doctor = this.getDoctorById(doctorId);
    const isDocOnBreak = doctor?.status === 'BREAK';
    const isDocUnavailable = doctor?.status === 'UNAVAILABLE';

    return standardSlots.map((time, idx) => {
      let status: 'AVAILABLE' | 'BOOKED' | 'BREAK' = 'AVAILABLE';
      if (bookedTimeSlots.has(time)) {
        status = 'BOOKED';
      } else if (isDocUnavailable) {
        status = 'BREAK';
      } else if (isDocOnBreak && idx === 0) {
        status = 'BREAK';
      } else if (time === '11:30 AM') {
        // Sample standard OPD recess slot
        status = 'BREAK';
      }

      return {
        id: `slot-${doctorId}-${date}-${idx}`,
        doctorId,
        date,
        timeSlot: time,
        status,
      };
    });
  }

  // Appointment Methods
  createAppointment(apt: Appointment): Appointment {
    this.appointments.unshift(apt);
    return apt;
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id || a.appointmentRef === id);
  }

  getAppointmentsByPatientMobile(mobile: string): Appointment[] {
    return this.appointments.filter((a) => a.patientMobile === mobile);
  }

  getAppointments(filters: {
    hospitalId?: string;
    departmentId?: string;
    doctorId?: string;
    date?: string;
    status?: AppointmentStatus;
  }): Appointment[] {
    return this.appointments.filter((a) => {
      if (filters.hospitalId && a.hospitalId !== filters.hospitalId) return false;
      if (filters.departmentId && a.departmentId !== filters.departmentId) return false;
      if (filters.doctorId && a.doctorId !== filters.doctorId) return false;
      if (filters.date && a.date !== filters.date) return false;
      if (filters.status && a.status !== filters.status) return false;
      return true;
    });
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment | undefined {
    const apt = this.getAppointmentById(id);
    if (apt) {
      apt.status = status;
      if (status === 'CHECKED_IN') {
        apt.checkedInAt = new Date().toISOString();
      } else if (status === 'COMPLETED') {
        apt.completedAt = new Date().toISOString();
      }
    }
    return apt;
  }

  updateAppointmentBenefitStatus(
    id: string,
    status: BenefitVerificationStatus,
    verificationId?: string
  ): Appointment | undefined {
    const apt = this.getAppointmentById(id);
    if (apt) {
      apt.benefitStatus = status;
      if (verificationId) {
        apt.benefitVerificationId = verificationId;
      }
    }
    return apt;
  }

  // Queue Methods
  generateQueueToken(appointmentId: string): { token: QueueToken; appointment: Appointment } {
    const apt = this.getAppointmentById(appointmentId);
    if (!apt) {
      throw new Error('Appointment not found');
    }

    if (apt.queueTokenId) {
      const existing = this.queueTokens.find((t) => t.id === apt.queueTokenId);
      if (existing) {
        return { token: existing, appointment: apt };
      }
    }

    const today = apt.date || new Date().toISOString().split('T')[0];
    const key = `${apt.hospitalId}:${apt.departmentId}:${apt.doctorId}:${today}`;
    const currentSeq = (this.tokenCounters.get(key) || 0) + 1;
    this.tokenCounters.set(key, currentSeq);

    const doc = this.getDoctorById(apt.doctorId);
    const room = doc?.roomNumber || apt.doctorRoom;
    const floor = doc?.floor || apt.doctorFloor;

    // Token letter based on department
    const dept = this.getDepartmentById(apt.departmentId);
    const prefix = dept?.code ? dept.code.charAt(0).toUpperCase() : 'A';
    const tokenNumber = `${prefix}-${currentSeq}`;

    // Count how many are waiting ahead
    const waitingAhead = this.queueTokens.filter(
      (t) =>
        t.hospitalId === apt.hospitalId &&
        t.doctorId === apt.doctorId &&
        t.date === today &&
        t.status === 'WAITING'
    ).length;

    const avgMin = doc?.avgConsultMin || 10;
    const estimatedWaitMinutes = Math.max(5, waitingAhead * avgMin);

    const token: QueueToken = {
      id: `tk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tokenNumber,
      hospitalId: apt.hospitalId,
      departmentId: apt.departmentId,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      roomNumber: room,
      floor,
      appointmentId: apt.id,
      patientName: apt.patientName,
      sequenceNumber: currentSeq,
      status: 'WAITING',
      estimatedWaitMinutes,
      date: today,
      createdAt: new Date().toISOString(),
    };

    this.queueTokens.push(token);

    // Update appointment
    apt.status = 'CHECKED_IN';
    apt.checkedInAt = new Date().toISOString();
    apt.queueTokenId = token.id;
    apt.queueTokenNumber = token.tokenNumber;

    return { token, appointment: apt };
  }

  getQueueTokens(filters: {
    hospitalId?: string;
    departmentId?: string;
    doctorId?: string;
    date?: string;
    status?: QueueTokenStatus;
  }): QueueToken[] {
    return this.queueTokens.filter((t) => {
      if (filters.hospitalId && t.hospitalId !== filters.hospitalId) return false;
      if (filters.departmentId && t.departmentId !== filters.departmentId) return false;
      if (filters.doctorId && t.doctorId !== filters.doctorId) return false;
      if (filters.date && t.date !== filters.date) return false;
      if (filters.status && t.status !== filters.status) return false;
      return true;
    });
  }

  getQueueTokenById(id: string): QueueToken | undefined {
    return this.queueTokens.find((t) => t.id === id);
  }

  getQueueTokenByAppointmentId(appointmentId: string): QueueToken | undefined {
    return this.queueTokens.find((t) => t.appointmentId === appointmentId);
  }

  updateQueueTokenStatus(tokenId: string, status: QueueTokenStatus): QueueToken | undefined {
    const token = this.getQueueTokenById(tokenId);
    if (token) {
      token.status = status;
      if (status === 'CALLED') {
        token.calledAt = new Date().toISOString();
      } else if (status === 'COMPLETED') {
        token.completedAt = new Date().toISOString();
      }

      // Sync linked appointment
      const apt = this.getAppointmentById(token.appointmentId);
      if (apt) {
        if (status === 'IN_CONSULTATION') apt.status = 'IN_CONSULTATION';
        if (status === 'COMPLETED') {
          apt.status = 'COMPLETED';
          apt.completedAt = new Date().toISOString();
        }
      }
    }
    return token;
  }

  callNextQueueToken(hospitalId: string, doctorId: string, date: string): QueueToken | undefined {
    // Current in consultation can be moved to COMPLETED
    const currentInConsult = this.queueTokens.find(
      (t) => t.hospitalId === hospitalId && t.doctorId === doctorId && t.date === date && (t.status === 'CALLED' || t.status === 'IN_CONSULTATION')
    );
    if (currentInConsult) {
      currentInConsult.status = 'COMPLETED';
      currentInConsult.completedAt = new Date().toISOString();
      const apt = this.getAppointmentById(currentInConsult.appointmentId);
      if (apt) apt.status = 'COMPLETED';
    }

    // Find next WAITING token
    const nextWaiting = this.queueTokens
      .filter((t) => t.hospitalId === hospitalId && t.doctorId === doctorId && t.date === date && t.status === 'WAITING')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)[0];

    if (nextWaiting) {
      nextWaiting.status = 'CALLED';
      nextWaiting.calledAt = new Date().toISOString();
      const apt = this.getAppointmentById(nextWaiting.appointmentId);
      if (apt) apt.status = 'IN_CONSULTATION';
      return nextWaiting;
    }

    return undefined;
  }

  // Hospital Locations & Wayfinding
  getLocations(hospitalId: string): HospitalLocation[] {
    return this.locations.filter((l) => l.hospitalId === hospitalId);
  }

  getPharmacyLocation(hospitalId: string): HospitalLocation | undefined {
    return this.locations.find((l) => l.hospitalId === hospitalId && l.category === 'PHARMACY');
  }

  // Benefit Verifications
  saveBenefitVerification(rec: BenefitVerificationRecord): BenefitVerificationRecord {
    const existingIndex = this.verifications.findIndex((v) => v.id === rec.id);
    if (existingIndex >= 0) {
      this.verifications[existingIndex] = rec;
    } else {
      this.verifications.unshift(rec);
    }
    return rec;
  }

  getBenefitVerification(id: string): BenefitVerificationRecord | undefined {
    return this.verifications.find((v) => v.id === id);
  }

  listBenefitVerifications(): BenefitVerificationRecord[] {
    return this.verifications;
  }

  // Audit Logs (Never logs OTP or secrets)
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  getAuditLogs(limit = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }
}

export const dbStore = new DataStore();
