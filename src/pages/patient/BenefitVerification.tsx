import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Building,
  Smartphone,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DisclaimerBanner } from '../../components/DisclaimerBanner.tsx';

export const BenefitVerification: React.FC = () => {
  const { t, lang } = useLanguage();
  const { governmentApiMode, isGovernmentApiEnabled } = useAuth();

  const [scheme, setScheme] = useState('PM-JAY (Ayushman Bharat)');
  const [identifier, setIdentifier] = useState('PMJAY-9821430912');
  const [mobileHint, setMobileHint] = useState('9876543210');

  const [otpTxnId, setOtpTxnId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/benefits/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          scheme,
          mobileHint,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch verification OTP');

      setOtpTxnId(data.otpTxnId);
      setMaskedMobile(data.maskedMobile);

      // Check for demo OTP in sandbox response or direct demoOtp field
      const code = data.demoOtp || data.message?.match(/\b\d{6}\b/)?.[0] || '123456';
      setDemoOtpHint(code);
      setOtpValue(code); // prefill for easy sandbox testing
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/benefits/verification/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpTxnId: otpTxnId || 'tx-demo-default',
          otp: otpValue.trim(),
          identifier,
          scheme,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');

      setVerificationResult(data.result);
      if (data.result?.verificationStatus !== 'VERIFIED') {
        setError(data.result?.message || 'Verification could not be confirmed.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setOtpTxnId(null);
    setOtpValue('');
    setVerificationResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Check Government Health Scheme Benefits
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                Official Gateway
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pradhan Mantri Jan Arogya Yojana (PM-JAY) & State Government Health Schemes
            </p>
          </div>
        </div>

        {/* Mandated Explanation */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 leading-relaxed font-medium">
          “Benefit eligibility is determined through the authorized scheme verification process. Appointment booking does not automatically mean treatment is free.”
        </div>
      </div>

      {/* Prominently Displayed Mandatory Notice */}
      <DisclaimerBanner variant="banner" showAbhaVsPmjay={true} />

      {/* ABHA vs PM-JAY Clarity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Understanding ABHA vs PM-JAY Eligibility</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
            <span className="font-bold text-blue-950 text-sm block">ABHA (Digital Health Account)</span>
            <ul className="space-y-1.5 text-blue-900 list-disc list-inside">
              <li>Digital ID for securely storing health records, lab reports, and prescriptions.</li>
              <li>Available to every Indian citizen regardless of income or economic status.</li>
              <li><strong>Does NOT provide free medical treatment by itself.</strong></li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-950 text-sm block">PM-JAY (Ayushman Beneficiary)</span>
            <ul className="space-y-1.5 text-emerald-900 list-disc list-inside">
              <li>Public health assurance providing secondary and tertiary care hospital coverage.</li>
              <li>Based on socio-economic caste census (SECC) or eligible government category.</li>
              <li><strong>Eligibility requires official verification and e-KYC.</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Verification Action Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Official OTP Verification Process</h3>
            <p className="text-xs text-slate-500">
              Provider Mode:{' '}
              <strong className="text-emerald-700">
                {isGovernmentApiEnabled ? 'Authorized Government Verification' : 'Demo/Sandbox Provider'}
              </strong>
            </p>
          </div>
          {otpTxnId && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Start Over</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {!otpTxnId ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Health Scheme
                </label>
                <select
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="PM-JAY (Ayushman Bharat)">PM-JAY (Ayushman Bharat)</option>
                  <option value="State Health Beneficiary Scheme">State Health Scheme / Ration Card</option>
                  <option value="Central CGHS / ESIC">Central Beneficiary Scheme (CGHS/ESIC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Mobile Hint
                </label>
                <input
                  type="tel"
                  value={mobileHint}
                  onChange={(e) => setMobileHint(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Scheme Identifier / Card Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. PMJAY-1092837465 or NFSA Ration Card No"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Demo sample: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-bold">PMJAY-9821430912</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Requesting OTP...' : 'Send Scheme Verification OTP'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-purple-950 font-bold">
                <span>OTP Dispatched to {maskedMobile}</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono font-bold">
                  SANDBOX
                </span>
              </div>
              <p className="text-purple-800">
                Please enter the 6-digit verification code sent via the government gateway.
              </p>
              {demoOtpHint && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-purple-300 text-xs">
                  <span className="text-slate-600">Dispatched Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-purple-900 tracking-wider">
                      {demoOtpHint}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpValue(demoOtpHint)}
                      className="px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[11px] cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter Verification OTP
              </label>
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-bold tracking-widest text-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Universal test OTP: <strong>123456</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpValue('123456')}
                  className="text-purple-700 font-bold hover:underline"
                >
                  Use 123456
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !otpValue}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Verifying OTP...' : 'Verify Beneficiary Record'}</span>
            </button>
          </form>
        )}

        {/* Verification Result Display */}
        {verificationResult && (
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                verificationResult.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verificationResult.verificationStatus === 'VERIFIED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <span>Status: {verificationResult.verificationStatus}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                  {verificationResult.source}
                </span>
              </div>

              <p className="text-xs leading-relaxed">{verificationResult.message}</p>

              <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Verification Source:</span>
                  <span className="font-semibold text-slate-800">{verificationResult.source}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Verification Time:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Prompt Requirement: Neutral Language Reminder */}
            <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed">
              <strong>Official Notice:</strong> “Benefit eligibility depends on the official verification result and applicable scheme rules. Free treatment is subject to clinical admission package authorization by the hospital Ayushman Mitra desk.”
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
