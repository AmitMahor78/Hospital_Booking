import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  User,
  Stethoscope,
  Info,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { DisclaimerBanner } from '../../components/DisclaimerBanner.tsx';
import { Hospital, Department, Doctor, DoctorScheduleSlot } from '../../types/index.ts';

export const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wizard Step (1 to 9)
  // Step 1: Hospital (State/District/Hospital)
  // Step 2: Department
  // Step 3: Doctor
  // Step 4: Date
  // Step 5: Time Slot
  // Step 6: Patient Information & Condition
  // Step 7: Benefit Verification (PM-JAY)
  // Step 8: Review
  // Step 9: Confirmation
  const initialStep = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Data collections
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedState, setSelectedState] = useState<string>('Delhi');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('New Delhi');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [scheduleSlots, setScheduleSlots] = useState<DoctorScheduleSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Patient Info
  const [patientName, setPatientName] = useState<string>(user?.name || 'Ramesh Kumar');
  const [patientMobile, setPatientMobile] = useState<string>(user?.mobile || '9876543210');
  const [patientAge, setPatientAge] = useState<string>('45');
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [visitReason, setVisitReason] = useState<string>('Regular OPD Consultation');
  const [currentCondition, setCurrentCondition] = useState<string>('Fever and weakness for two days.');

  // Benefit Verification
  const [schemeIdentifier, setSchemeIdentifier] = useState<string>('PMJAY-1092837465');
  const [schemeType, setSchemeType] = useState<string>('PM-JAY (Ayushman Bharat)');
  const [benefitOtpTxnId, setBenefitOtpTxnId] = useState<string | null>(null);
  const [benefitOtp, setBenefitOtp] = useState<string>('');
  const [benefitStatus, setBenefitStatus] = useState<string>('NOT_VERIFIED');
  const [benefitVerificationId, setBenefitVerificationId] = useState<string | null>(null);
  const [benefitMessage, setBenefitMessage] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);

  // Booking Result
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Hospitals
  useEffect(() => {
    fetch('/api/hospitals')
      .then((res) => res.json())
      .then((data: Hospital[]) => {
        setHospitals(data);
        const presetHospId = searchParams.get('hospitalId');
        if (presetHospId) {
          const match = data.find((h) => h.id === presetHospId);
          if (match) {
            setSelectedHospital(match);
            setSelectedState(match.state);
            setSelectedDistrict(match.district);
          }
        } else if (data.length > 0) {
          setSelectedHospital(data[0]);
        }
      })
      .catch((err) => console.error('Failed to load hospitals', err));
  }, []);

  // 2. Fetch Departments when Hospital changes
  useEffect(() => {
    if (selectedHospital) {
      fetch(`/api/hospitals/${selectedHospital.id}/departments`)
        .then((res) => res.json())
        .then((data: Department[]) => {
          setDepartments(data);
          if (data.length > 0 && !selectedDepartment) {
            setSelectedDepartment(data[0]);
          }
        })
        .catch((err) => console.error('Failed to load departments', err));
    }
  }, [selectedHospital]);

  // 3. Fetch Doctors when Hospital and Department change
  useEffect(() => {
    if (selectedHospital && selectedDepartment) {
      fetch(`/api/doctors?hospitalId=${selectedHospital.id}&departmentId=${selectedDepartment.id}`)
        .then((res) => res.json())
        .then((data: Doctor[]) => {
          setDoctors(data);
          if (data.length > 0) {
            setSelectedDoctor(data[0]);
          }
        })
        .catch((err) => console.error('Failed to load doctors', err));
    }
  }, [selectedHospital, selectedDepartment]);

  // 4. Fetch Doctor Schedule Slots when Doctor or Date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetch(`/api/doctors/${selectedDoctor.id}/availability?date=${selectedDate}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.slots) {
            setScheduleSlots(data.slots);
            const firstAvailable = data.slots.find((s: any) => s.status === 'AVAILABLE');
            if (firstAvailable) {
              setSelectedSlot(firstAvailable.timeSlot);
            }
          }
        })
        .catch((err) => console.error('Failed to load schedule', err));
    }
  }, [selectedDoctor, selectedDate]);

  // Filtered hospitals based on state/district
  const availableStates = Array.from(new Set(hospitals.map((h) => h.state)));
  const availableDistricts = Array.from(
    new Set(hospitals.filter((h) => h.state === selectedState).map((h) => h.district))
  );

  // Benefit verification OTP trigger
  const handleRequestBenefitOtp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/benefits/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: schemeIdentifier,
          scheme: schemeType,
          mobileHint: patientMobile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request verification OTP');

      setBenefitOtpTxnId(data.otpTxnId);
      setOtpSentNotice(data.message);
      // Pre-fill demo OTP code if present in message or demoOtp field
      const code = data.demoOtp || data.message?.match(/\b\d{6}\b/)?.[0] || '123456';
      setBenefitOtp(code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Benefit verification OTP verify
  const handleVerifyBenefitOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/benefits/verification/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpTxnId: benefitOtpTxnId || 'tx-demo-default',
          otp: (benefitOtp || '123456').trim(),
          identifier: schemeIdentifier,
          scheme: schemeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');

      if (data.result?.verificationStatus === 'VERIFIED') {
        setBenefitStatus('VERIFIED');
        setBenefitMessage(data.result.message);
      } else {
        setBenefitStatus(data.result?.verificationStatus || 'VERIFICATION_FAILED');
        setBenefitMessage(data.result?.message || 'Verification could not be completed.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Final Booking to Backend
  const handleFinalBooking = async () => {
    if (!selectedHospital || !selectedDepartment || !selectedDoctor || !selectedSlot) {
      setError('Please complete all previous booking selections.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        hospitalId: selectedHospital.id,
        departmentId: selectedDepartment.id,
        doctorId: selectedDoctor.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        patientName,
        patientMobile,
        patientAge: parseInt(patientAge, 10),
        visitReason,
        currentCondition,
        benefitStatus: benefitStatus === 'VERIFIED' ? 'VERIFIED' : 'NOT_VERIFIED',
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setBookingResult(data.appointment);
      setCurrentStep(9); // Confirmation step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              OPD Appointment Booking
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {currentStep === 9 ? 'Appointment Confirmed' : `Step ${currentStep} of 8: ${
                currentStep === 1 ? 'Select Hospital' :
                currentStep === 2 ? 'Select Department' :
                currentStep === 3 ? 'Select Doctor' :
                currentStep === 4 ? 'Select Date' :
                currentStep === 5 ? 'Select Time Slot' :
                currentStep === 6 ? 'Patient Information' :
                currentStep === 7 ? 'Benefit Verification' :
                'Review & Confirm'
              }`}
            </h1>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Government Hospital Outpatient Service
          </span>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-[10px] font-bold">
          {[
            '1. Hospital',
            '2. Dept',
            '3. Doctor',
            '4. Date',
            '5. Time',
            '6. Patient',
            '7. Benefits',
            '8. Review',
          ].map((title, idx) => (
            <div
              key={idx}
              className={`py-1.5 px-1 rounded-md transition-colors ${
                currentStep === idx + 1
                  ? 'bg-emerald-700 text-white font-black'
                  : currentStep > idx + 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {title}
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Scheme Disclaimer Notice */}
      <DisclaimerBanner variant="compact" />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT GOVERNMENT HOSPITAL */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Select State, District & Government Hospital</h2>
            <p className="text-xs text-slate-500">
              Government hospital data is loaded directly from backend services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  const firstHosp = hospitals.find((h) => h.state === e.target.value);
                  if (firstHosp) {
                    setSelectedDistrict(firstHosp.district);
                    setSelectedHospital(firstHosp);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  const hosp = hospitals.find((h) => h.state === selectedState && h.district === e.target.value);
                  if (hosp) setSelectedHospital(hosp);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {availableDistricts.map((dst) => (
                  <option key={dst} value={dst}>{dst}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">Choose Hospital</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitals
                .filter((h) => h.state === selectedState)
                .map((hosp) => (
                  <div
                    key={hosp.id}
                    onClick={() => setSelectedHospital(hosp)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedHospital?.id === hosp.id
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 text-sm">{hosp.name}</div>
                      {selectedHospital?.id === hosp.id && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hosp.address}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hosp.facilities.slice(0, 2).map((f, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!selectedHospital}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Select Department</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DEPARTMENT */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Select Clinical Department</h2>
            <p className="text-xs text-slate-500">
              Department locations and blocks at {selectedHospital?.name}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                onClick={() => setSelectedDepartment(dept)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedDepartment?.id === dept.id
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {dept.code}
                    </span>
                    {selectedDepartment?.id === dept.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{dept.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{dept.floor} • {dept.block}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!selectedDepartment}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Select Doctor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SELECT DOCTOR */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Select Specialist Doctor ({selectedDepartment?.name})
            </h2>
            <p className="text-xs text-slate-500">
              Live doctor availability, consulting room number and OPD floor are displayed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctor(doc)}
                className={`p-5 rounded-xl border-2 transition-all cursor-pointer space-y-3 ${
                  selectedDoctor?.id === doc.id
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{doc.name}</h3>
                      <p className="text-xs text-slate-500">{doc.qualification}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'BREAK'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  <strong>Specialization:</strong> {doc.specialization}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-purple-800 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{doc.floor} • {doc.roomNumber}</span>
                  </span>
                  <span className="text-slate-500">
                    ~{doc.avgConsultMin} mins/patient
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              disabled={!selectedDoctor}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Select Date</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SELECT DATE */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Select Appointment Date</h2>
            <p className="text-xs text-slate-500">
              Consulting OPD days for {selectedDoctor?.name}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateIso = d.toISOString().split('T')[0];
              const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
              const monthName = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
              const isSelected = selectedDate === dateIso;

              return (
                <div
                  key={offset}
                  onClick={() => setSelectedDate(dateIso)}
                  className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs uppercase text-slate-500 block">{dayName}</span>
                  <span className="text-lg font-bold text-slate-900 block mt-0.5">{monthName}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                    {offset === 0 ? 'Today (Live)' : 'Upcoming'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Select Time Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SELECT TIME SLOT */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Select Time Slot for {selectedDate}
            </h2>
            <p className="text-xs text-slate-500">
              Real-time slot availability checked directly against the hospital appointment engine.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {scheduleSlots.map((slot) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const isSelected = selectedSlot === slot.timeSlot;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedSlot(slot.timeSlot)}
                  className={`p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                      : isAvailable
                      ? 'border-slate-200 bg-white hover:border-emerald-400 text-slate-800 font-semibold'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                  }`}
                >
                  <span className="text-sm block">{slot.timeSlot}</span>
                  <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {slot.status}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              disabled={!selectedSlot}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Patient Information</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PATIENT INFORMATION & CONDITION (Requirement: Minimal data & Specific Helper Text) */}
      {currentStep === 6 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Patient Details & Health Concern</h2>
            <p className="text-xs text-slate-500">
              Only required information is stored for OPD token queue dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={patientMobile}
                onChange={(e) => setPatientMobile(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                min="1"
                max="120"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Visit Reason (Optional)
            </label>
            <input
              type="text"
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              placeholder="e.g. Regular OPD Consultation"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {/* Current Condition with Strict Prompt Helper Text */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Current Condition / Main Health Concern
            </label>
            <p className="text-xs text-amber-800 font-medium">
              “Briefly describe your main concern for appointment context. Do not enter unnecessary sensitive information.”
            </p>
            <textarea
              rows={2}
              value={currentCondition}
              onChange={(e) => setCurrentCondition(e.target.value)}
              placeholder="e.g. Fever and weakness for two days."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Notice: SwasthyaQueue does not provide diagnosis, prescription, or medical advice.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(7)}
              disabled={!patientName || !patientMobile || !patientAge}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Benefit Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: BENEFIT VERIFICATION (PM-JAY Scheme with Mandatory Disclaimers) */}
      {currentStep === 7 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Check Government Health Scheme Benefits</h2>
            <p className="text-xs text-slate-500">
              Benefit eligibility is determined through the authorized scheme verification process. Appointment booking does not automatically mean treatment is free.
            </p>
          </div>

          <DisclaimerBanner variant="banner" showAbhaVsPmjay={true} />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Type</label>
                <select
                  value={schemeType}
                  onChange={(e) => setSchemeType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="PM-JAY (Ayushman Bharat)">PM-JAY (Ayushman Bharat)</option>
                  <option value="State Health Scheme">State Health Scheme / Ration Card</option>
                  <option value="Central CGHS/ESIC">Central Government Health Beneficiary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Beneficiary Identifier (Card / Ration ID)
                </label>
                <input
                  type="text"
                  value={schemeIdentifier}
                  onChange={(e) => setSchemeIdentifier(e.target.value)}
                  placeholder="e.g. PMJAY-1092837465"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>

            {!benefitOtpTxnId ? (
              <button
                type="button"
                onClick={handleRequestBenefitOtp}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoading ? 'Sending Scheme OTP...' : 'Send Scheme Verification OTP'}</span>
              </button>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-purple-950 font-bold">
                  <span>Enter Scheme Verification OTP</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">
                    SANDBOX
                  </span>
                </div>

                {otpSentNotice && (
                  <div className="flex items-center justify-between bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-xs">
                    <span className="text-purple-900 line-clamp-1">{otpSentNotice}</span>
                    <button
                      type="button"
                      onClick={() => setBenefitOtp(otpSentNotice.match(/\b\d{6}\b/)?.[0] || '123456')}
                      className="px-2 py-0.5 rounded bg-purple-200 hover:bg-purple-300 text-purple-900 font-bold text-[10px] shrink-0 ml-2 cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={benefitOtp}
                      onChange={(e) => setBenefitOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className="w-48 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center tracking-widest focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyBenefitOtp}
                      disabled={isLoading || !benefitOtp}
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Beneficiary OTP'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Universal test code: <strong>123456</strong></span>
                    <button
                      type="button"
                      onClick={() => setBenefitOtp('123456')}
                      className="text-purple-700 font-bold hover:underline"
                    >
                      Use 123456
                    </button>
                  </p>
                </div>
              </div>
            )}

            {benefitStatus !== 'NOT_VERIFIED' && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  benefitStatus === 'VERIFIED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Scheme Status: {benefitStatus}</span>
                </div>
                {benefitMessage && <p className="text-xs">{benefitMessage}</p>}
                <p className="text-[11px] text-slate-500 pt-1">
                  Note: Final admission or procedure coverage is subject to physical hospital desk verification.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(8)}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Review Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: REVIEW DETAILS BEFORE CONFIRMATION */}
      {currentStep === 8 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Review Appointment Summary</h2>
            <p className="text-xs text-slate-500">
              Please double check your doctor, schedule slot, and hospital room details.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Hospital</span>
                <span className="font-bold text-slate-900 text-sm">{selectedHospital?.name}</span>
                <span className="text-slate-600 block">{selectedHospital?.address}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Department & Location</span>
                <span className="font-bold text-slate-900 text-sm">{selectedDepartment?.name}</span>
                <span className="text-purple-700 font-bold block mt-0.5">
                  {selectedDoctor?.floor} • {selectedDoctor?.roomNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Consulting Specialist</span>
                <span className="font-bold text-slate-900 text-sm">{selectedDoctor?.name}</span>
                <span className="text-slate-600 block">{selectedDoctor?.specialization}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Appointment Slot</span>
                <span className="font-bold text-emerald-800 text-sm">{selectedDate} • {selectedSlot}</span>
                <span className="text-slate-500 block">Please arrive 15 minutes before your time slot</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Patient</span>
                <span className="font-bold text-slate-900 text-sm">{patientName} ({patientAge} Yrs, {patientGender})</span>
                <span className="text-slate-600 block">Mobile: {patientMobile}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Scheme Benefit</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block mt-0.5 ${
                    benefitStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {benefitStatus}
                </span>
              </div>
            </div>

            {currentCondition && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold block uppercase">Reported Health Concern</span>
                <p className="text-slate-700 italic">“{currentCondition}”</p>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950">
            <strong>Mandatory Notice:</strong> Benefit verification status does not by itself guarantee free treatment or eligibility for every service. Official scheme rules apply upon clinical assessment.
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(7)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinalBooking}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isLoading ? 'Confirming Appointment...' : 'Confirm OPD Appointment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: CONFIRMATION SCREEN (Reference SWQ-2026-XXXXX) */}
      {currentStep === 9 && bookingResult && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600 p-6 sm:p-8 space-y-6 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              OPD Appointment Booked
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
              {bookingResult.appointmentRef}
            </h2>
            <p className="text-xs text-slate-500">
              Please save this appointment reference number for entry and check-in.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left max-w-xl mx-auto space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Hospital:</span>
              <span className="font-bold text-slate-900">{bookingResult.hospitalName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-slate-900">{bookingResult.departmentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-bold text-slate-900">{bookingResult.doctorName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Room & Floor:</span>
              <span className="font-bold text-purple-700">
                {bookingResult.doctorFloor} • {bookingResult.doctorRoom}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Schedule:</span>
              <span className="font-bold text-emerald-800">
                {bookingResult.date} at {bookingResult.timeSlot}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Benefit Verification:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  bookingResult.benefitStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {bookingResult.benefitStatus}
              </span>
            </div>
          </div>

          {/* Prompt requirement: Important disclaimer */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 max-w-xl mx-auto text-left leading-relaxed">
            <strong>Important Regulatory Notice:</strong> Benefit verification status does not by itself guarantee free treatment or eligibility for every service. Applicable scheme packages and clinical eligibility must be verified by the hospital desk.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/patient"
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors"
            >
              Go to Patient Portal
            </Link>
            <Link
              to="/hospital-guide"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              Hospital Floor Navigation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
