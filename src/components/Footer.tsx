import React from 'react';
import { Phone, Shield, ExternalLink, Activity, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export const Footer: React.FC = () => {
  const { t, lang } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 text-sm border-t border-slate-800 mt-16">
      {/* Emergency Helplines Ribbon */}
      <div className="bg-slate-950 py-3 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>National Emergency & Citizen Health Helplines:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Ambulance: <strong className="text-white font-bold">108</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Health Information: <strong className="text-white font-bold">104</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Ayushman PM-JAY Toll-free: <strong className="text-white font-bold">14555</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                SWASTHYA<span className="text-emerald-400">QUEUE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              “Appointment se Consultation tak — Queue ko Simple Banayein.”
              A digital appointment booking, real-time queue tokens, doctor availability, and hospital floor navigation system tailored for government hospital OPDs in India.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Government API Architecture:</strong> Seamlessly switches between secure Demo/Sandbox simulations and official Authorized Government Gateways via backend environment variables without changing frontend code.
                </p>
              </div>
            </div>
          </div>

          {/* Quick OPD Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Patient Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/patient/book" className="hover:text-emerald-400 transition-colors">
                  OPD Slot Booking
                </a>
              </li>
              <li>
                <a href="/patient/queue" className="hover:text-emerald-400 transition-colors">
                  Live Queue Token Tracking
                </a>
              </li>
              <li>
                <a href="/hospital-guide" className="hover:text-emerald-400 transition-colors">
                  Hospital Floor & Pharmacy Guide
                </a>
              </li>
              <li>
                <a href="/patient/benefit-verification" className="hover:text-emerald-400 transition-colors">
                  Scheme Benefit Check (PM-JAY)
                </a>
              </li>
            </ul>
          </div>

          {/* Hospital Staff & Providers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Hospital Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/staff" className="hover:text-emerald-400 transition-colors">
                  OPD Registration & Token Counter
                </a>
              </li>
              <li>
                <a href="/staff/benefits" className="hover:text-emerald-400 transition-colors">
                  Ayushman Mitra Verification Desk
                </a>
              </li>
              <li>
                <a href="/doctor" className="hover:text-emerald-400 transition-colors">
                  Doctor Consultation Room & Queue
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-emerald-400 transition-colors">
                  Staff Role Authentication
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimers */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-slate-300">Mandatory Regulatory Notice:</strong> {t('ayushmanDisclaimer')}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-slate-400">
            <span>© 2026 SwasthyaQueue Platform. Designed for Indian Public Health Ecosystem.</span>
            <span>Privacy Compliant • Minimal Data Collection • ISO/IEC 27001 Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
