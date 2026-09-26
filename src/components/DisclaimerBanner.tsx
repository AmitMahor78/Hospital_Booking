import React from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface Props {
  variant?: 'banner' | 'card' | 'compact';
  showAbhaVsPmjay?: boolean;
}

export const DisclaimerBanner: React.FC<Props> = ({ variant = 'banner', showAbhaVsPmjay = false }) => {
  const { t, lang } = useLanguage();

  if (variant === 'compact') {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block text-amber-950 mb-0.5">
            {lang === 'hi' ? 'महत्वपूर्ण सूचना' : 'Mandatory Scheme Notice'}:
          </span>
          <p>{t('ayushmanDisclaimer')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 text-sm text-amber-950 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <div>
            <h4 className="font-bold text-amber-950 text-sm tracking-wide flex items-center gap-2">
              <span>{lang === 'hi' ? 'आयुष्मान भारत एवं सरकारी योजना दिशानिर्देश' : 'Government Health Scheme Verification Notice'}</span>
              <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-medium">Official Directive</span>
            </h4>
            <p className="mt-1 text-amber-900 leading-relaxed font-medium">
              {t('ayushmanDisclaimer')}
            </p>
          </div>

          {showAbhaVsPmjay && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 grid md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  ABHA (Health ID)
                </span>
                <p className="text-slate-600 leading-relaxed">
                  14-digit digital identity for health records and longitudinal consent. It does <strong>NOT</strong> verify financial scheme eligibility or guarantee free treatment.
                </p>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PM-JAY (Ayushman Beneficiary)
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Specific beneficiary eligibility determined by NHA SECC criteria and verified through hospital kiosk e-KYC for empaneled packages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
