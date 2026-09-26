import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Activity,
  User,
  Volume2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { QueueToken } from '../../types/index.ts';

export const LiveQueue: React.FC = () => {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();

  const [hospitalId, setHospitalId] = useState('hosp-1');
  const [tokenSearch, setTokenSearch] = useState(searchParams.get('token') || 'A-27');
  const [queueData, setQueueData] = useState<any>(null);
  const [patientTokenData, setPatientTokenData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chimeTriggered, setChimeTriggered] = useState(false);

  const fetchQueue = () => {
    setIsLoading(true);
    fetch(`/api/queue/${hospitalId}`)
      .then((res) => res.json())
      .then((data) => {
        setQueueData(data);
      })
      .catch((err) => setError('Could not load hospital queue'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQueue();
    // Auto refresh every 20 seconds
    const interval = setInterval(fetchQueue, 20000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  // Search specific token
  const handleSearchToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenSearch.trim()) return;

    setError(null);
    // Find in current queue or fetch
    if (queueData) {
      const match = queueData.waitingList?.find(
        (t: any) => t.tokenNumber.toUpperCase() === tokenSearch.trim().toUpperCase()
      );
      if (match) {
        setPatientTokenData(match);
      } else if (queueData.currentServing?.tokenNumber.toUpperCase() === tokenSearch.trim().toUpperCase()) {
        setPatientTokenData({
          ...queueData.currentServing,
          patientsAhead: 0,
          estimatedWaitMinutes: 0,
        });
      } else {
        setError(`Token ${tokenSearch} not currently in active queue. Please check at OPD registration desk.`);
      }
    }
  };

  const playChime = () => {
    setChimeTriggered(true);
    setTimeout(() => setChimeTriggered(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live OPD Token Display</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Outpatient Queue Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              AIIMS Delhi — General Medicine OPD (Block A)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playChime}
              className={`p-2.5 rounded-xl border border-slate-700 transition-colors ${
                chimeTriggered ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Test Token Chime Sound"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={fetchQueue}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Current Calling Token Billboard */}
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-800 border-2 border-emerald-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 text-slate-950 flex flex-col items-center justify-center font-black text-3xl shadow-lg shadow-emerald-500/30">
              <span>{queueData?.currentServing?.tokenNumber || 'A-26'}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 mt-[-4px]">
                NOW IN
              </span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                Doctor Consultation In Progress
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {queueData?.currentServing?.doctorName || 'Dr. Arjun Mehta'}
              </h2>
              <span className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {queueData?.currentServing?.floor || '1st Floor'} • {queueData?.currentServing?.roomNumber || 'Room 20'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block">Waiting Ahead:</span>
              <span className="text-2xl font-extrabold text-white">
                {queueData?.totalWaiting ?? 2}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Est. Wait/Patient:</span>
              <span className="text-2xl font-extrabold text-amber-400">~8 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium text-center">
        “Waiting time is an estimate and may change based on clinical consultation durations.”
      </div>

      {/* Token Search Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900">
          Track Your Specific Token
        </h3>

        <form onSubmit={handleSearchToken} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              placeholder="e.g. A-27"
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Check Status
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Patient Personal Token Card */}
        {patientTokenData && (
          <div className="mt-4 p-5 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                  Your OPD Token
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {patientTokenData.tokenNumber}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
                {patientTokenData.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-emerald-200">
              <div>
                <span className="text-slate-500 block">Patients Ahead:</span>
                <span className="font-extrabold text-base text-slate-900">
                  {patientTokenData.patientsAhead}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Wait:</span>
                <span className="font-extrabold text-base text-amber-700">
                  ~{patientTokenData.estimatedWaitMinutes} Mins
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Consulting Room:</span>
                <span className="font-bold text-base text-purple-800">
                  {patientTokenData.roomNumber || 'Room 20'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Floor:</span>
                <span className="font-bold text-base text-slate-900">
                  {patientTokenData.floor || '1st Floor'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Public Live Waiting Queue List (Sanitized: Shows Token, Status, Room - No Sensitive Medical Data) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Current Waiting Queue
            </h3>
            <p className="text-xs text-slate-500">
              Tokens are called sequentially by the consulting medical officer.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {queueData?.waitingList?.length || 0} In Queue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Token No</th>
                <th className="py-2.5 px-3">Doctor</th>
                <th className="py-2.5 px-3">Room / Floor</th>
                <th className="py-2.5 px-3">Estimated Wait</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queueData?.waitingList?.map((t: any, idx: number) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-500">#{idx + 1}</td>
                  <td className="py-3 px-3 font-black text-sm text-emerald-800 font-mono">
                    {t.tokenNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-900 font-medium">{t.doctorName}</td>
                  <td className="py-3 px-3 text-purple-700 font-semibold">{t.roomNumber} ({t.floor})</td>
                  <td className="py-3 px-3 text-amber-700 font-medium">~{t.estimatedWaitMinutes} Mins</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
