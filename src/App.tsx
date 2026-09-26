/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { Home } from './pages/Home.tsx';
import { Login } from './pages/Login.tsx';
import { PatientDashboard } from './pages/patient/PatientDashboard.tsx';
import { BookAppointment } from './pages/patient/BookAppointment.tsx';
import { LiveQueue } from './pages/patient/LiveQueue.tsx';
import { BenefitVerification } from './pages/patient/BenefitVerification.tsx';
import { HospitalGuide } from './pages/patient/HospitalGuide.tsx';
import { StaffDashboard } from './pages/staff/StaffDashboard.tsx';
import { BenefitDesk } from './pages/staff/BenefitDesk.tsx';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.tsx';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/patient/book" element={<BookAppointment />} />
                <Route path="/patient/queue" element={<LiveQueue />} />
                <Route path="/patient/benefit-verification" element={<BenefitVerification />} />
                <Route path="/hospital-guide" element={<HospitalGuide />} />
                <Route path="/staff" element={<StaffDashboard />} />
                <Route path="/staff/benefits" element={<BenefitDesk />} />
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
