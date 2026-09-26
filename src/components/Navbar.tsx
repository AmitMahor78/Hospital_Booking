import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Languages,
  Shield,
  Stethoscope,
  Building2,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export const Navbar: React.FC = () => {
  const { user, logout, governmentApiMode, isGovernmentApiEnabled, quickDemoLogin } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Government Platform Indicator Bar */}
      <div className="bg-slate-900 text-white text-[11px] py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200 tracking-wide">
              {lang === 'hi'
                ? 'राष्ट्रीय डिजिटल स्वास्थ्य पहल — सरकारी अस्पताल ओपीडी कतार प्रबंधन'
                : 'National Digital Health Initiative — Government Hospital OPD Queue System'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Environment Provider Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-[11px] ${
                isGovernmentApiEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              <Shield className="w-3 h-3" />
              {isGovernmentApiEnabled
                ? 'Authorized Government Verification'
                : 'Demo/Sandbox Verification'}
            </span>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700">
              <Languages className="w-3 h-3 text-slate-400" />
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-1 rounded cursor-pointer ${
                  lang === 'en' ? 'font-bold text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-1 rounded cursor-pointer ${
                  lang === 'hi' ? 'font-bold text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  SWASTHYA<span className="text-emerald-700">QUEUE</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  OPD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                “Appointment se Consultation tak — Queue ko Simple Banayein.”
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/patient"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/patient')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('patientPortal')}
            </Link>

            <Link
              to="/patient/book"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/patient/book')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('bookAppointment')}
            </Link>

            <Link
              to="/patient/queue"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/patient/queue')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('liveQueue')}
            </Link>

            <Link
              to="/hospital-guide"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/hospital-guide')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('hospitalGuide')}
            </Link>

            <Link
              to="/patient/benefit-verification"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/patient/benefit-verification')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('benefitVerification')}
            </Link>

            <span className="text-slate-300 mx-1">|</span>

            <Link
              to="/staff"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/staff') || location.pathname.startsWith('/staff')
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('staffPortal')}
            </Link>

            <Link
              to="/doctor"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/doctor')
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('doctorPortal')}
            </Link>
          </nav>

          {/* User Profile / Quick Login */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900">{user.name}</span>
                  <span className="text-[10px] font-medium text-emerald-700 capitalize">
                    {user.role.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('login')}</span>
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/patient"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              {t('patientPortal')}
            </Link>
            <Link
              to="/patient/book"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              {t('bookAppointment')}
            </Link>
            <Link
              to="/patient/queue"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              {t('liveQueue')}
            </Link>
            <Link
              to="/hospital-guide"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              {t('hospitalGuide')}
            </Link>
            <Link
              to="/patient/benefit-verification"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              {t('benefitVerification')}
            </Link>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium block"
              >
                {t('staffPortal')}
              </Link>
              <Link
                to="/doctor"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium block"
              >
                {t('doctorPortal')}
              </Link>
            </div>
          </nav>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 rounded-lg font-medium"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-700 text-white font-medium text-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('login')}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
