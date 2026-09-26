import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Pause,
  MapPin,
  Calendar,
  RefreshCw,
  Coffee,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Doctor, Appointment, QueueToken, DoctorScheduleSlot } from '../../types/index.ts';

export const DoctorDashboard: React.FC = () => {
  const { user, token } = useAuth();

  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<DoctorScheduleSlot[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Appointment | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const doctorId = 'doc-1'; // Dr. Arjun Mehta
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDoctorData = async () => {
    setIsLoading(true);
    try {
      const [docRes, aptRes, queueRes, schedRes] = await Promise.all([
        fetch(`/api/doctors/${doctorId}`),
        fetch(`/api/appointments?doctorId=${doctorId}&date=${todayStr}`),
        fetch(`/api/queue/hosp-1?doctorId=${doctorId}&date=${todayStr}`),
        fetch(`/api/doctors/${doctorId}/availability?date=${todayStr}`),
      ]);

      const doc = await docRes.json();
      const apts = await aptRes.json();
      const queue = await queueRes.json();
      const sched = await schedRes.json();

      setDoctorProfile(doc);
      if (Array.isArray(apts)) {
        setAppointments(apts);
        // Find in-consultation or first checked-in patient
        const inConsult = apts.find((a) => a.status === 'IN_CONSULTATION');
        const nextWaiting = apts.find((a) => a.status === 'CHECKED_IN');
        setCurrentPatient(inConsult || nextWaiting || apts[0] || null);
      }
      if (queue.waitingList) setQueueTokens(queue.waitingList);
      if (sched.slots) setScheduleSlots(sched.slots);
    } catch (err) {
      console.error('Failed to load doctor dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [token]);

  // Update Availability Status (Available / Break / Unavailable)
  const handleUpdateStatus = async (status: 'AVAILABLE' | 'BREAK' | 'UNAVAILABLE') => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDoctorProfile(data.doctor);
      setFeedback(`Status updated to ${status}`);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  // Call Next Patient
  const handleCallNextPatient = async () => {
    try {
      const res = await fetch('/api/queue/hosp-1/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ doctorId, date: todayStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback(data.message);
      fetchDoctorData();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  // Complete Consultation
  const handleCompleteConsultation = async (tokenId?: string) => {
    if (!tokenId && currentPatient?.queueTokenId) {
      tokenId = currentPatient.queueTokenId;
    }
    if (!tokenId) {
      setFeedback('No active token selected for completion.');
      return;
    }

    try {
      const res = await fetch(`/api/queue/token/${tokenId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback('Consultation marked completed.');
      fetchDoctorData();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Doctor Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">
              <Stethoscope className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {doctorProfile?.name || 'Dr. Arjun Mehta'}
                </h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    doctorProfile?.status === 'AVAILABLE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : doctorProfile?.status === 'BREAK'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {doctorProfile?.status || 'AVAILABLE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                General Medicine • {doctorProfile?.qualification || 'MBBS, MD (Medicine)'}
              </p>
              <div className="flex items-center gap-3 text-xs text-emerald-400 font-semibold mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {doctorProfile?.floor || '1st Floor'} • {doctorProfile?.roomNumber || 'Room 20'}
                  </span>
                </span>
                <span>•</span>
                <span>OPD Block A</span>
              </div>
            </div>
          </div>

          {/* Quick Doctor Status Toggle */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => handleUpdateStatus('AVAILABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                doctorProfile?.status === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => handleUpdateStatus('BREAK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                doctorProfile?.status === 'BREAK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Break</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateStatus('UNAVAILABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                doctorProfile?.status === 'UNAVAILABLE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unavailable
            </button>
          </div>
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

      {/* Main Grid: Active Patient & Daily Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Patient Consultation Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border-2 border-emerald-600/40 p-6 sm:p-8 space-y-6 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Consultation Room Console
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Active Consultation Desk
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCallNextPatient}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Call Next Token</span>
              </button>
            </div>

            {currentPatient ? (
              <div className="space-y-5">
                {/* Doctor Patient View (Strict Privacy Compliance: No sensitive IDs or Aadhaar exposed) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                        Current Patient
                      </span>
                      <h3 className="text-xl font-black text-slate-900">
                        {currentPatient.patientName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Age: <strong>{currentPatient.patientAge} Years</strong> • Slot: <strong>{currentPatient.timeSlot}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                        Token Number
                      </span>
                      <span className="text-3xl font-black text-emerald-700 font-mono">
                        {currentPatient.queueTokenNumber || 'A-27'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block uppercase font-semibold">Visit Reason:</span>
                      <span className="font-medium text-slate-800">{currentPatient.visitReason || 'General OPD Follow-up'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-semibold">Appointment Ref:</span>
                      <span className="font-mono font-bold text-slate-800">{currentPatient.appointmentRef}</span>
                    </div>
                  </div>

                  {/* Main Health Concern / Current Condition */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">
                      Patient Health Concern / Reported Condition:
                    </span>
                    <p className="text-slate-700 italic">
                      “{currentPatient.currentCondition || 'Fever and weakness for two days.'}”
                    </p>
                  </div>

                  {/* Privacy compliance badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Data Privacy Protected: Government identifiers and Aadhaar are strictly unexposed on doctor terminal.</span>
                  </div>
                </div>

                {/* Consultation Complete Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500">
                    Finished clinical assessment and prescription?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCompleteConsultation()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Complete Consultation & Close Slip</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No active patient currently in consultation room.</p>
                <button
                  type="button"
                  onClick={handleCallNextPatient}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                >
                  Call Next Waiting Patient
                </button>
              </div>
            )}
          </div>

          {/* Today's Waiting List for Doctor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900">
              Patients in Queue for Dr. Arjun Mehta ({appointments.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Age</th>
                    <th className="py-2.5 px-3">Slot</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-black text-emerald-800">
                        {apt.queueTokenNumber || '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{apt.patientName}</td>
                      <td className="py-3 px-3 text-slate-500">{apt.patientAge} Yrs</td>
                      <td className="py-3 px-3 text-slate-600">{apt.timeSlot}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Daily OPD Time Schedule Slots */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Today&apos;s OPD Slots Schedule
              </h3>
              <p className="text-xs text-slate-500">{todayStr}</p>
            </div>

            <div className="space-y-2">
              {scheduleSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    slot.status === 'BOOKED'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950 font-bold'
                      : slot.status === 'BREAK'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold'
                  }`}
                >
                  <span className="font-mono">{slot.timeSlot}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200/40">
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
