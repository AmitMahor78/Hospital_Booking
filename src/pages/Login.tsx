import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Stethoscope,
  Building2,
  ShieldCheck,
  Smartphone,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Role } from '../types/index.ts';

export const Login: React.FC = () => {
  const { loginAsPatient, loginWithCredentials } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = (searchParams.get('role')?.toUpperCase() as Role) || 'PATIENT';
  const [activeTab, setActiveTab] = useState<Role>(initialRole);

  // Patient Login State
  const [patientMobile, setPatientMobile] = useState('9876543210');
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientOtp, setPatientOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  // Staff / Doctor / Benefit Desk State
  const [email, setEmail] = useState('dr.mehta@hospital.gov.in');
  const [password, setPassword] = useState('doctor123');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTabChange = (role: Role) => {
    setActiveTab(role);
    setError(null);
    setSuccessMsg(null);
    setOtpSent(false);

    if (role === 'PATIENT') {
      setPatientMobile('9876543210');
      setPatientName('Ramesh Kumar');
    } else if (role === 'DOCTOR') {
      setEmail('dr.mehta@hospital.gov.in');
      setPassword('doctor123');
    } else if (role === 'STAFF') {
      setEmail('staff@hospital.gov.in');
      setPassword('staff123');
    } else if (role === 'BENEFIT_DESK') {
      setEmail('ayushman.desk@hospital.gov.in');
      setPassword('ayushman123');
    }
  };

  // Patient OTP dispatch
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: patientMobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
      setDemoCodeHint(data.demoOtp || '123456');
      setPatientOtp(data.demoOtp || '123456'); // Pre-fill sandbox OTP for frictionless testing
      setSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Patient OTP verify
  const handleVerifyPatientOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginAsPatient(patientMobile, patientOtp, patientName);
      navigate('/patient');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Staff / Doctor / Benefit Desk login
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginWithCredentials(email, password);
      if (activeTab === 'DOCTOR') navigate('/doctor');
      else if (activeTab === 'STAFF') navigate('/staff');
      else if (activeTab === 'BENEFIT_DESK') navigate('/staff/benefits');
      else navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SwasthyaQueue Portal Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Secure role-based portal for patients, medical officers, OPD registration desk, and scheme counselors.
          </p>
        </div>

        {/* Critical Distinction Notice (Requirement: Distinguish Application Login from Government Benefit Verification) */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block text-blue-950 mb-0.5">
              Important System Distinction:
            </span>
            <p className="leading-relaxed">
              <strong>Application Login</strong> authenticates you into SwasthyaQueue to manage appointments and queue tokens. This is <strong>NOT</strong> the Government Benefit Verification system. You will verify your Ayushman / PM-JAY scheme card separately during booking.
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Role Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            {[
              { role: 'PATIENT' as Role, label: 'Patient', icon: User },
              { role: 'DOCTOR' as Role, label: 'Doctor', icon: Stethoscope },
              { role: 'STAFF' as Role, label: 'OPD Staff', icon: Building2 },
              { role: 'BENEFIT_DESK' as Role, label: 'Benefit Desk', icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.role}
                type="button"
                onClick={() => handleTabChange(tab.role)}
                className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === tab.role
                    ? 'bg-white text-emerald-800 border-emerald-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Error Notification */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: PATIENT LOGIN (Mobile + OTP) */}
            {activeTab === 'PATIENT' && (
              <div className="space-y-5">
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <strong>Patient Fast-Login:</strong> Enter 10-digit mobile number to receive OTP. No password required.
                </div>

                {!otpSent ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number (10 digits)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={patientMobile}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                            else if (val.length === 11 && val.startsWith('0')) val = val.slice(1);
                            else if (val.length > 10) val = val.slice(-10);
                            setPatientMobile(val);
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                          required
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Enter 10-digit number. E.g. <span className="font-semibold text-slate-600">9876543210</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>{isLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPatientMobile('9876543210');
                          setPatientName('Ramesh Kumar');
                          setPatientOtp('123456');
                          setOtpSent(true);
                          setDemoCodeHint('123456');
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Instant Demo Fill (OTP: 123456)
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPatientOtp} className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-950 font-semibold">
                        <span>OTP dispatched to +91 {patientMobile}</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                          SANDBOX ACTIVE
                        </span>
                      </div>

                      {demoCodeHint && (
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-300 text-xs">
                          <span className="text-slate-600">Testing Code:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-black text-emerald-800 tracking-wider">
                              {demoCodeHint}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPatientOtp(demoCodeHint)}
                              className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] cursor-pointer"
                            >
                              Auto-fill
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Enter 6-Digit Login OTP
                      </label>
                      <input
                        type="text"
                        value={patientOtp}
                        onChange={(e) => setPatientOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Universal sandbox test code: <strong>123456</strong></span>
                        <button
                          type="button"
                          onClick={() => setPatientOtp('123456')}
                          className="text-emerald-700 font-bold hover:underline"
                        >
                          Use 123456
                        </button>
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setError(null);
                        }}
                        className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Change Mobile
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !patientOtp}
                        className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? 'Verifying...' : 'Verify OTP & Enter Patient Portal'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2, 3, 4: DOCTOR / STAFF / BENEFIT DESK LOGIN (Email + Password) */}
            {activeTab !== 'PATIENT' && (
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  Authorized hospital credential login for {activeTab.replace('_', ' ')}.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isLoading ? 'Authenticating...' : `Sign In as ${activeTab.replace('_', ' ')}`}
                  </span>
                </button>
              </form>
            )}

            {/* Quick Demo Pre-fill helper banner */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Demo sandbox active. Pre-filled accounts ready for one-click testing.</span>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'PATIENT') {
                    setPatientMobile('9876543210');
                    setPatientName('Ramesh Kumar');
                    setPatientOtp('123456');
                    setOtpSent(true);
                  }
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Reset Demo Fill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
