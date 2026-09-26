import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Building,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DisclaimerBanner } from '../../components/DisclaimerBanner.tsx';
import { BenefitVerificationRecord } from '../../types/index.ts';

export const BenefitDesk: React.FC = () => {
  const { token, isGovernmentApiEnabled } = useAuth();
  const [verifications, setVerifications] = useState<BenefitVerificationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BenefitVerificationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchVerifications = () => {
    setIsLoading(true);
    fetch('/api/benefits/list', {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setVerifications(data);
      })
      .catch((err) => console.error('Failed to load verifications', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, [token]);

  // Mark Needs Hospital Verification Action
  const handleMarkNeedsHospitalVerification = async (id: string) => {
    try {
      const res = await fetch(`/api/benefits/${id}/mark-hospital-verification`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback('Status updated: Record marked for physical hospital desk verification.');
      fetchVerifications();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/staff"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Back to Staff Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                Ayushman Mitra Help Desk
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight mt-1">
                Government Scheme Verification Console
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized scheme verification and biometric e-KYC hospital desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-purple-300">
              Gateway: {isGovernmentApiEnabled ? 'Authorized Live' : 'Demo/Sandbox'}
            </span>
            <button
              type="button"
              onClick={fetchVerifications}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Strict Regulatory Notice */}
        <div className="p-3 bg-purple-950/60 border border-purple-800/80 rounded-xl text-xs text-purple-200">
          <strong>Staff Protocol:</strong> In accordance with National Health Authority regulations, hospital staff cannot manually claim eligibility unless the authorized scheme system/biometric process confirms the beneficiary.
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Mandatory Regulatory Notice Banner */}
      <DisclaimerBanner variant="banner" showAbhaVsPmjay={true} />

      {/* Main Table: Authorized Verification Workflow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900">
            Beneficiary Verification Requests ({verifications.length})
          </h3>
          <span className="text-xs text-slate-500">
            Official NHA gateway records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Patient Masked ID</th>
                <th className="py-2.5 px-3">Scheme Name</th>
                <th className="py-2.5 px-3">Verification Status</th>
                <th className="py-2.5 px-3">Submitted At</th>
                <th className="py-2.5 px-3">Gateway Source</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verifications.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {rec.identifier}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {rec.schemeName}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.verificationStatus === 'NEEDS_HOSPITAL_VERIFICATION'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(rec.lastAttemptAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {rec.source}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(rec)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                    >
                      View Verification
                    </button>
                    {rec.verificationStatus !== 'NEEDS_HOSPITAL_VERIFICATION' && (
                      <button
                        type="button"
                        onClick={() => handleMarkNeedsHospitalVerification(rec.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer"
                      >
                        Mark Needs Hospital Verification
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Official Verification Record Details
              </h3>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                {selectedRecord.id}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary ID:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedRecord.identifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheme:</span>
                <span className="font-bold text-slate-900">{selectedRecord.schemeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-800">{selectedRecord.verificationStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source Gateway:</span>
                <span className="font-bold text-slate-800">{selectedRecord.source}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Gateway Message:</span>
                <p className="text-slate-700 italic mt-0.5">{selectedRecord.message}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
