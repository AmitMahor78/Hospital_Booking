import crypto from 'crypto';
import { User, Role } from '../types.ts';
import { dbStore } from '../db/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'swasthyaqueue_dev_jwt_secret_change_in_prod';

export interface JwtPayload {
  userId: string;
  role: Role;
  name: string;
  mobile?: string;
  email?: string;
  exp: number;
}

export class AuthService {
  // Sign JWT using native Node.js crypto
  static signToken(user: User): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
    const payload = Buffer.from(
      JSON.stringify({
        userId: user.id,
        role: user.role,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        exp,
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  // Verify JWT
  static verifyToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtPayload;
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // Patient Login (Mobile + OTP)
  // Stores pending OTP in memory with 10-minute expiry
  private static patientOtpStore = new Map<string, { otp: string; expiresAt: number }>();

  // Normalizes Indian mobile number by removing non-digits, country code +91 or leading 0
  static normalizeMobile(mobile: string): string {
    let digits = String(mobile || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    } else if (digits.length > 10) {
      digits = digits.slice(-10);
    }
    return digits;
  }

  static requestPatientOtp(mobile: string): { message: string; demoOtp: string } {
    const cleanMobile = this.normalizeMobile(mobile);
    if (!/^\d{10}$/.test(cleanMobile)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.patientOtpStore.set(cleanMobile, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    dbStore.addAuditLog({
      action: 'PATIENT_LOGIN_OTP_SENT',
      resource: 'User',
      status: 'SUCCESS',
      details: { maskedMobile: `${cleanMobile.slice(0, 2)}******${cleanMobile.slice(-2)}` },
    });

    return {
      message: `Login OTP dispatched to mobile +91 ${cleanMobile.slice(0, 2)}******${cleanMobile.slice(-2)}. Sandbox code: ${otp}`,
      demoOtp: otp,
    };
  }

  static verifyPatientOtp(mobile: string, otp: string, name?: string): { user: User; token: string } {
    const cleanMobile = this.normalizeMobile(mobile);
    if (!/^\d{10}$/.test(cleanMobile)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    const cleanOtp = String(otp || '').trim();
    const session = this.patientOtpStore.get(cleanMobile);

    // Accept session OTP, or universal test codes '123456' / '000000'
    const isSessionValid = session && session.otp === cleanOtp && Date.now() < session.expiresAt;
    const isUniversalDemo = cleanOtp === '123456' || cleanOtp === '000000' || (session && session.otp === cleanOtp);

    if (!isSessionValid && !isUniversalDemo) {
      throw new Error('Invalid or expired login OTP. For sandbox testing, use 123456 or the code shown.');
    }

    this.patientOtpStore.delete(cleanMobile);

    let user = dbStore.getUserByMobile(cleanMobile);
    if (!user) {
      user = dbStore.createUser({
        id: `pat-user-${Date.now()}`,
        role: 'PATIENT',
        name: name || 'Ramesh Kumar (Patient)',
        mobile: cleanMobile,
        createdAt: new Date().toISOString(),
      });
    }

    const token = this.signToken(user);
    dbStore.addAuditLog({
      userId: user.id,
      role: 'PATIENT',
      action: 'PATIENT_LOGGED_IN',
      resource: 'User',
      status: 'SUCCESS',
    });

    return { user, token };
  }

  // Doctor / Staff / Benefit Desk Login (Email + Password)
  static loginStaffOrDoctor(
    email: string,
    password: string
  ): { user: User; token: string } {
    const user = dbStore.getUserByEmail(email);
    if (!user || !user.passwordHash || user.passwordHash !== password) {
      dbStore.addAuditLog({
        action: 'STAFF_LOGIN_FAILED',
        resource: 'User',
        status: 'DENIED',
        details: { emailAttempt: email },
      });
      throw new Error('Invalid staff/doctor credentials. Please check your email and password.');
    }

    const token = this.signToken(user);
    dbStore.addAuditLog({
      userId: user.id,
      role: user.role,
      action: 'STAFF_LOGGED_IN',
      resource: 'User',
      status: 'SUCCESS',
    });

    return { user, token };
  }
}
