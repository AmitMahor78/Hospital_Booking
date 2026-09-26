export type Role = 'PATIENT' | 'DOCTOR' | 'STAFF' | 'BENEFIT_DESK' | 'ADMIN';

export type DoctorStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'BREAK';
export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BREAK';

export type AppointmentStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED';

export type QueueTokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'SKIPPED';

export type BenefitVerificationStatus =
  | 'NOT_VERIFIED'
  | 'VERIFICATION_PENDING'
  | 'OTP_SENT'
  | 'VERIFIED'
  | 'NOT_ELIGIBLE'
  | 'VERIFICATION_FAILED'
  | 'NEEDS_HOSPITAL_VERIFICATION'
  | 'UNAVAILABLE';

export type VerificationSource = 'DEMO_SANDBOX' | 'AUTHORIZED_GOVERNMENT_API';

export interface User {
  id: string;
  role: Role;
  name: string;
  email?: string;
  mobile?: string;
}

export interface Hospital {
  id: string;
  name: string;
  state: string;
  district: string;
  address: string;
  pinCode: string;
  contactPhone: string;
  facilities: string[];
  bedCount: number;
  active: boolean;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  description?: string;
  floor: string;
  block: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  hospitalId: string;
  departmentId: string;
  name: string;
  qualification: string;
  specialization: string;
  roomNumber: string;
  floor: string;
  block: string;
  status: DoctorStatus;
  avgConsultMin: number;
  availableDays: string[];
}

export interface DoctorScheduleSlot {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  status: SlotStatus;
}

export interface Appointment {
  id: string;
  appointmentRef: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  doctorRoom: string;
  doctorFloor: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  patientAge: number;
  date: string;
  timeSlot: string;
  visitReason?: string;
  currentCondition?: string;
  status: AppointmentStatus;
  benefitStatus: BenefitVerificationStatus;
  benefitVerificationId?: string;
  queueTokenId?: string;
  queueTokenNumber?: string;
  checkedInAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface QueueToken {
  id: string;
  tokenNumber: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  doctorName: string;
  roomNumber: string;
  floor: string;
  appointmentId: string;
  patientName: string;
  sequenceNumber: number;
  status: QueueTokenStatus;
  estimatedWaitMinutes: number;
  date: string;
  calledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface HospitalLocation {
  id: string;
  hospitalId: string;
  name: string;
  category: string;
  floor: string;
  room: string;
  building: string;
  routeInstructions: string[];
  operatingHours: string;
}

export interface BenefitVerificationRecord {
  id: string;
  patientId?: string;
  identifier: string;
  schemeName: string;
  verificationStatus: BenefitVerificationStatus;
  beneficiaryStatus?: string;
  verifiedAt?: string;
  source: VerificationSource;
  message: string;
  retryCount: number;
  lastAttemptAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  role?: Role;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  ipAddress?: string;
  details?: Record<string, any>;
}
