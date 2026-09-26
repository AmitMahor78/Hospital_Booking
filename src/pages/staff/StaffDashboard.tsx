import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  Building,
  RefreshCw,
  Search,
  MapPin,
  AlertTriangle,
  Play,
  Check,
  Edit2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Appointment, QueueToken, Doctor, AuditLog } from '../../types/index.ts';

export const StaffDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'queue' | 'doctors' | 'audit'>('appointments');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit Room Modal State
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [newRoom, setNewRoom] = useState('');
  const [newFloor, setNewFloor] = useState('');

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, queueRes, docRes] = await Promise.all([
        fetch('/api/appointments?hospitalId=hosp-1'),
        fetch('/api/queue/hosp-1'),
        fetch('/api/doctors?hospitalId=hosp-1'),
      ]);

      const apts = await aptRes.json();
      const queue = await queueRes.json();
      const docs = await docRes.json();

      if (Array.isArray(apts)) setAppointments(apts);
      if (queue.waitingList) {
        setQueueTokens(queue.waitingList);
      }
      if (Array.isArray(docs)) setDoctors(docs);

      // Fetch audit logs if authorized
      if (token) {
        const auditRes = await fetch('/api/audit', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (auditRes.ok) {
          const logs = await auditRes.json();
          setAuditLogs(logs);
        }
      }
    } catch (err) {
      console.error('Failed to load staff data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [token]);

  // Check-In Patient Action
  const handleCheckIn = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback(`Patient checked in! Token generated: ${data.token.tokenNumber}`);
      fetchStaffData();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  // Call Next Token Action
  const handleCallNext = async (doctorId: string) => {
    try {
      const res = await fetch('/api/queue/hosp-1/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ doctorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback(data.message);
      fetchStaffData();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  // Update Doctor Status
  const handleDoctorStatusChange = async (doctorId: string, status: 'AVAILABLE' | 'UNAVAILABLE' | 'BREAK') => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update doctor status');

      fetchStaffData();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  // Update Doctor Room & Floor
  const handleSaveDoctorRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      const res = await fetch(`/api/doctors/${editingDoctor.id}/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          roomNumber: newRoom,
          floor: newFloor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback(`Doctor ${editingDoctor.name} updated to ${newRoom}, ${newFloor}. Linked patient appointments synchronized!`);
      setEditingDoctor(null);
      fetchStaffData();
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  // KPIs
  const totalAppointments = appointments.length;
  const checkedInPatients = appointments.filter((a) => a.status === 'CHECKED_IN').length;
  const inConsultation = appointments.filter((a) => a.status === 'IN_CONSULTATION').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const waitingCount = queueTokens.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
              Hospital Staff Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              OPD Registration & Queue Console
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              AIIMS Delhi • General Medicine & Allied Clinics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/staff/benefits"
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ayushman Desk</span>
            </Link>
            <button
              type="button"
              onClick={fetchStaffData}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6 Mandated KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {[
            { label: "Today's Appointments", value: totalAppointments, color: 'text-blue-400' },
            { label: 'Checked-in Patients', value: checkedInPatients, color: 'text-emerald-400' },
            { label: 'Waiting Patients', value: waitingCount, color: 'text-amber-400' },
            { label: 'In Consultation', value: inConsultation, color: 'text-purple-400' },
            { label: 'Completed Care', value: completedCount, color: 'text-teal-400' },
            { label: 'Benefit Requests', value: 3, color: 'text-rose-400' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block leading-tight">{kpi.label}</span>
              <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 text-xs font-bold">
        {[
          { id: 'appointments', label: 'Appointments Registry', icon: Calendar },
          { id: 'queue', label: 'Live Queue & Calling', icon: Clock },
          { id: 'doctors', label: 'Doctor Room & Availability', icon: Stethoscope },
          { id: 'audit', label: 'Security & Audit Logs', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: APPOINTMENTS REGISTRY */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Registered OPD Patients ({appointments.length})
            </h3>
            <span className="text-xs text-slate-500">
              Arriving patients can be checked-in to generate sequential token.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Age / Mobile</th>
                  <th className="py-2.5 px-3">Doctor</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Check-in Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{apt.appointmentRef}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{apt.patientName}</td>
                    <td className="py-3 px-3 text-slate-500">{apt.patientAge} Yrs • {apt.patientMobile}</td>
                    <td className="py-3 px-3 text-slate-700">{apt.doctorName}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{apt.timeSlot}</td>
                    <td className="py-3 px-3 text-purple-700 font-semibold">{apt.doctorRoom}</td>
                    <td className="py-3 px-3 font-black text-emerald-700">{apt.queueTokenNumber || '—'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {apt.status === 'BOOKED' ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(apt.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Check In & Token
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Checked In</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE QUEUE & CALLING */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Doctor Queue Dispatch Controls</h3>
              <p className="text-xs text-slate-500">
                Staff can trigger patient calling sequence on behalf of consulting doctors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{doc.name}</h4>
                    <span className="text-xs text-purple-800 font-semibold">{doc.roomNumber} ({doc.floor})</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {doc.status}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">OPD Block A</span>
                  <button
                    type="button"
                    onClick={() => handleCallNext(doc.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Call Next Patient</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOCTOR ROOM & AVAILABILITY (Requirement: Real-time room update sync) */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Doctor Room & Floor Management</h3>
              <p className="text-xs text-slate-500">
                When a doctor changes room, patient appointments and live queue tokens update automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.specialization}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDoctor(doc);
                      setNewRoom(doc.roomNumber);
                      setNewFloor(doc.floor);
                    }}
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Change Room</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Assigned Room:</span>
                    <strong className="text-purple-800 font-bold text-sm">{doc.roomNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Floor:</span>
                    <strong className="text-slate-800 font-bold text-sm">{doc.floor}</strong>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 pt-1 text-xs">
                  <span className="text-slate-500 font-medium mr-1">Status:</span>
                  {(['AVAILABLE', 'BREAK', 'UNAVAILABLE'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleDoctorStatusChange(doc.id, st)}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        doc.status === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Edit Room Modal */}
          {editingDoctor && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <h3 className="font-bold text-base text-slate-900">
                  Update Room for {editingDoctor.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Patient appointment locations will immediately update to this new room.
                </p>

                <form onSubmit={handleSaveDoctorRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      placeholder="e.g. Room 24"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Floor
                    </label>
                    <input
                      type="text"
                      value={newFloor}
                      onChange={(e) => setNewFloor(e.target.value)}
                      placeholder="e.g. 1st Floor"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingDoctor(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs"
                    >
                      Save & Sync
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS (Regulatory Traceability) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">System Security & Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable records of sensitive operations (OTP dispatches, token generation, logins). Secrets and raw OTP values are strictly excluded.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sanitized Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700">{log.resource}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[250px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
