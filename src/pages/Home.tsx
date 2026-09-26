import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Activity,
  UserCheck,
  CheckCircle2,
  Stethoscope,
  Building,
  Sparkles,
  PhoneCall,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import { Hospital } from '../types/index.ts';

export const Home: React.FC = () => {
  const { t, lang } = useLanguage();
  const { quickDemoLogin, governmentApiMode, isGovernmentApiEnabled } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('hosp-1');
  const [queueInfo, setQueueInfo] = useState<{
    currentServing: any;
    totalWaiting: number;
    disclaimer: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/hospitals')
      .then((res) => res.json())
      .then((data) => setHospitals(data))
      .catch((err) => console.error('Failed to fetch hospitals', err));

    fetch('/api/queue/hosp-1')
      .then((res) => res.json())
      .then((data) => setQueueInfo(data))
      .catch((err) => console.error('Failed to fetch queue', err));
  }, []);

  const handleRoleQuickStart = async (role: 'PATIENT' | 'DOCTOR' | 'STAFF' | 'BENEFIT_DESK') => {
    await quickDemoLogin(role);
    if (role === 'PATIENT') navigate('/patient');
    if (role === 'DOCTOR') navigate('/doctor');
    if (role === 'STAFF') navigate('/staff');
    if (role === 'BENEFIT_DESK') navigate('/staff/benefits');
  };

  return (
    <div className="min-h-screen bg-slate-50 space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-emerald-500/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Digital OPD Queue & Hospital Navigation Platform</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              SWASTHYA<span className="text-emerald-400">QUEUE</span>
            </h1>
            <p className="text-xl sm:text-2xl text-emerald-100 font-medium italic">
              “Appointment se Consultation tak — Queue ko Simple Banayein.”
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Skip endless crowded physical queues at government hospitals. Book doctor appointments, get real-time OPD token updates, verify Ayushman PM-JAY scheme eligibility, and follow step-by-step floor navigation to your doctor&apos;s room and hospital pharmacy.
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/patient/book"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:translate-y-[-1px]"
            >
              <Calendar className="w-4 h-4 stroke-[2.5]" />
              <span>{t('bookAppointment')}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <Link
              to="/patient/queue"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-semibold text-sm border border-slate-700 transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{t('liveQueue')}</span>
            </Link>

            <Link
              to="/hospital-guide"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-semibold text-sm border border-slate-700 transition-colors"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{t('hospitalGuide')}</span>
            </Link>

            <Link
              to="/patient/benefit-verification"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-semibold text-sm border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('benefitVerification')}</span>
            </Link>
          </div>

          {/* Live OPD Queue Ticker Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-lg">
                  {queueInfo?.currentServing?.tokenNumber || 'A-26'}
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    AIIMS Delhi • General Medicine OPD
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-emerald-300">
                      Now Calling: {queueInfo?.currentServing?.tokenNumber || 'A-26'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-medium">
                      Room 20 • 1st Floor
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block">Patients in Waiting Queue:</span>
                  <span className="text-base font-bold text-white">
                    {queueInfo?.totalWaiting ?? 2} Patients
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Average Wait Estimate:</span>
                  <span className="text-base font-bold text-amber-400">~8-15 Mins</span>
                </div>
                <Link
                  to="/patient/queue"
                  className="hidden sm:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <span>Full Screen Display</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Regulatory Ayushman Disclaimer Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <DisclaimerBanner variant="banner" showAbhaVsPmjay={true} />
      </section>

      {/* 7-Step End-to-End System Journey Flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How SwasthyaQueue Works
          </h2>
          <p className="text-sm text-slate-600">
            A seamless digital journey connecting the patient from home registration to the doctor&apos;s consultation desk.
          </p>
        </div>

        {/* Step Flowchart Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { step: '1', title: 'PATIENT', desc: 'Select Hospital & Dept', icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { step: '2', title: 'APPOINTMENT', desc: 'Book verified slot', icon: Calendar, color: 'text-teal-600 bg-teal-50 border-teal-200' },
            { step: '3', title: 'BENEFIT CHECK', desc: 'PM-JAY Scheme verify', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { step: '4', title: 'CHECK-IN', desc: 'Scan or click on arrival', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { step: '5', title: 'QUEUE TOKEN', desc: 'Unique token (e.g. A-27)', icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { step: '6', title: 'DOCTOR ROOM', desc: 'Room & floor wayfinding', icon: MapPin, color: 'text-purple-600 bg-purple-50 border-purple-200' },
            { step: '7', title: 'CONSULTATION', desc: 'OPD Care & Pharmacy', icon: Stethoscope, color: 'text-rose-600 bg-rose-50 border-rose-200' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${item.color} flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-xs transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/80 border border-slate-300/40">
                  STEP {item.step}
                </span>
                <item.icon className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 tracking-tight">{item.title}</h4>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 1-Click Interactive Demo Role Tester */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Instant Evaluation Sandbox</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Evaluate SwasthyaQueue with Demo Roles
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Experience the application immediately from any stakeholder perspective without entering credentials.
              </p>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
              <span className="block text-slate-200 font-semibold mb-0.5">Integration Status:</span>
              <span className="text-emerald-400 font-mono">
                {isGovernmentApiEnabled ? 'Authorized Government Gateway' : 'Demo/Sandbox Verification Provider'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient Demo */}
            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Patient Role</span>
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">Ramesh Kumar</span>
                </div>
                <p className="text-xs text-slate-400">
                  Book OPD appointment, view upcoming token A-27, check-in, and review PM-JAY verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleQuickStart('PATIENT')}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Patient Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Doctor Demo */}
            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Doctor Role</span>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded">Dr. Arjun Mehta</span>
                </div>
                <p className="text-xs text-slate-400">
                  Room 20 General Medicine. Call next token, set status (Available/Break), view patient concerns safely.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleQuickStart('DOCTOR')}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Doctor Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hospital Staff Demo */}
            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Hospital Staff</span>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded">OPD Counter</span>
                </div>
                <p className="text-xs text-slate-400">
                  Check-in arriving patients, assign doctor rooms, view all waiting tokens, audit logs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleQuickStart('STAFF')}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Staff Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Benefit Desk Demo */}
            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Ayushman Desk</span>
                  <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded">Ayushman Mitra</span>
                </div>
                <p className="text-xs text-slate-400">
                  Authorized verification workflow, retry OTPs, flag cases needing hospital desk biometric e-KYC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleQuickStart('BENEFIT_DESK')}
                className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Benefit Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Empaneled Government Hospitals Directory Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Empaneled Government Hospitals
            </h2>
            <p className="text-xs text-slate-600">
              Backend-powered directory of public hospitals with real departments, doctors, and facilities.
            </p>
          </div>
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>Book at any hospital</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.slice(0, 3).map((hosp) => (
            <div
              key={hosp.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {hosp.state} • {hosp.district}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {hosp.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{hosp.address}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {hosp.facilities.slice(0, 3).map((fac, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"
                  >
                    {fac}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Beds: <strong className="text-slate-800">{hosp.bedCount}</strong>
                </span>
                <Link
                  to={`/patient/book?hospitalId=${hosp.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Select Hospital</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hospital Wayfinding & Pharmacy Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Hospital Floor & Pharmacy Navigation
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Find Your Doctor&apos;s Room & Free Medicine Counter
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Navigate easily from hospital entrance to registration, 1st floor OPD clinics, 2nd floor Cardiology, and 2nd Floor Room 12B Central Pharmacy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              to="/hospital-guide"
              className="px-5 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs text-center transition-colors shadow-xs"
            >
              Explore Floor Directory
            </Link>
            <Link
              to="/hospital-guide?view=pharmacy"
              className="px-5 py-3 rounded-xl bg-white hover:bg-teal-50 border border-teal-300 text-teal-900 font-semibold text-xs text-center transition-colors"
            >
              Pharmacy Route (Room 12B)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
