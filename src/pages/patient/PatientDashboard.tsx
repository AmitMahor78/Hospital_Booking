import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  PlusCircle,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { DisclaimerBanner } from '../../components/DisclaimerBanner.tsx';
import { Appointment } from '../../types/index.ts';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAppointments = () => {
    setIsLoading(true);
    const mobile = user?.mobile || '9876543210';
    fetch(`/api/appointments?mobile=${encodeURIComponent(mobile)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch((err) => console.error('Failed to load appointments', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleCheckIn = async (appointmentId: string) => {
    setCheckInLoading(appointmentId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in');

      setFeedback(`Checked in successfully! Generated Queue Token: ${data.token.tokenNumber}`);
      fetchAppointments();
    } catch (err: any) {
      setFeedback(err.message || 'Error checking in');
    } finally {
      setCheckInLoading(null);
    }
  };

  // Select primary upcoming appointment (first BOOKED or CHECKED_IN)
  const upcomingAppointment = appointments.find(
    (a) => a.status === 'BOOKED' || a.status === 'CHECKED_IN' || a.status === 'IN_CONSULTATION'
  ) || appointments[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 space-y-8 max-w-7xl mx-auto">
      {/* Patient Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-extrabold text-xl">
            {user?.name?.charAt(0) || 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {user ? `Namaste, ${user.name}` : 'Patient Portal'}
              </h1>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Active Patient
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered Mobile: <strong className="text-slate-700">{user?.mobile || '9876543210'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAppointments}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh Appointments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New OPD Slot</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mandatory Scheme Notice Banner */}
      <DisclaimerBanner variant="banner" showAbhaVsPmjay={false} />

      {/* Quick Tiles Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: t('bookAppointment'), to: '/patient/book', icon: Calendar, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { title: t('myAppointments'), to: '#my-appointments', icon: CheckCircle2, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { title: t('liveQueue'), to: '/patient/queue', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { title: t('doctorAvailability'), to: '/patient/book?step=3', icon: User, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
          { title: t('hospitalGuide'), to: '/hospital-guide', icon: MapPin, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
          { title: t('benefitVerification'), to: '/patient/benefit-verification', icon: ShieldCheck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
        ].map((tile, i) => (
          <Link
            key={i}
            to={tile.to}
            className={`p-3.5 rounded-xl border ${tile.color} flex flex-col justify-between space-y-2 hover:shadow-xs transition-all hover:scale-[1.02]`}
          >
            <tile.icon className="w-5 h-5 shrink-0" />
            <span className="font-bold text-xs text-slate-900 leading-tight">
              {tile.title}
            </span>
          </Link>
        ))}
      </div>

      {/* Primary Upcoming Appointment Card */}
      {upcomingAppointment ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Upcoming Appointment
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Ref: {upcomingAppointment.appointmentRef}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  upcomingAppointment.status === 'CHECKED_IN'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : upcomingAppointment.status === 'IN_CONSULTATION'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                Status: {upcomingAppointment.status}
              </span>
            </div>
          </div>

          {/* Appointment Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Doctor</span>
              <span className="font-bold text-slate-900 text-sm">{upcomingAppointment.doctorName}</span>
              <span className="text-xs text-emerald-700 block mt-0.5">{upcomingAppointment.departmentName}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Schedule Slot</span>
              <span className="font-bold text-slate-900 text-sm">{upcomingAppointment.date}</span>
              <span className="text-xs text-slate-600 block mt-0.5">{upcomingAppointment.timeSlot}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Doctor Location</span>
              <span className="font-bold text-slate-900 text-sm">{upcomingAppointment.doctorFloor}</span>
              <span className="text-xs font-semibold text-purple-700 block mt-0.5">{upcomingAppointment.doctorRoom}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Queue Token</span>
              {upcomingAppointment.queueTokenNumber ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-emerald-700">
                    {upcomingAppointment.queueTokenNumber}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    ACTIVE
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 block mt-1">Check-in at hospital to get token</span>
              )}
            </div>
          </div>

          {/* Patient Complaint / Condition Summary */}
          {upcomingAppointment.currentCondition && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Reported Condition / Main Health Concern:</span>
              <p className="text-slate-600 italic">“{upcomingAppointment.currentCondition}”</p>
            </div>
          )}

          {/* Scheme Benefit Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Government Scheme Verification:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  upcomingAppointment.benefitStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {upcomingAppointment.benefitStatus}
              </span>
            </div>

            {/* Check-In CTA */}
            {upcomingAppointment.status === 'BOOKED' ? (
              <button
                type="button"
                onClick={() => handleCheckIn(upcomingAppointment.id)}
                disabled={checkInLoading === upcomingAppointment.id}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {checkInLoading === upcomingAppointment.id
                    ? 'Generating Queue Token...'
                    : 'Check-In on Arrival (Generate Token)'}
                </span>
              </button>
            ) : (
              <Link
                to={`/patient/queue?appointmentId=${upcomingAppointment.id}`}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Track Live Queue Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">No active appointments found</h3>
            <p className="text-xs text-slate-500 mt-1">Book an appointment at your nearest government hospital OPD.</p>
          </div>
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
          >
            <span>Book First Appointment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Full Appointment History Table */}
      <div id="my-appointments" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          All My Appointments ({appointments.length})
        </h3>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No appointment records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Hospital</th>
                  <th className="py-3 px-3">Doctor</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Room / Floor</th>
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{apt.appointmentRef}</td>
                    <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate">{apt.hospitalName}</td>
                    <td className="py-3 px-3 text-slate-900 font-medium">{apt.doctorName}</td>
                    <td className="py-3 px-3 text-slate-600">{apt.date} • {apt.timeSlot}</td>
                    <td className="py-3 px-3 text-purple-800 font-semibold">{apt.doctorRoom} ({apt.doctorFloor})</td>
                    <td className="py-3 px-3 font-black text-emerald-700">{apt.queueTokenNumber || '—'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {apt.status === 'BOOKED' ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(apt.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] cursor-pointer hover:bg-emerald-800"
                        >
                          Check In
                        </button>
                      ) : (
                        <Link
                          to={`/patient/queue?appointmentId=${apt.id}`}
                          className="text-emerald-700 font-bold hover:underline"
                        >
                          View Queue
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
