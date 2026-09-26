import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Building,
  Navigation,
  Compass,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { HospitalLocation } from '../../types/index.ts';

export const HospitalGuide: React.FC = () => {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();

  const [activeFloor, setActiveFloor] = useState<string>('All Floors');
  const [locations, setLocations] = useState<HospitalLocation[]>([]);
  const [pharmacyData, setPharmacyData] = useState<any>(null);
  const [activeView, setActiveView] = useState<'directory' | 'pharmacy'>(
    searchParams.get('view') === 'pharmacy' ? 'pharmacy' : 'directory'
  );

  useEffect(() => {
    fetch('/api/hospitals/hosp-1/locations')
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error('Failed to load locations', err));

    fetch('/api/hospitals/hosp-1/pharmacy')
      .then((res) => res.json())
      .then((data) => setPharmacyData(data))
      .catch((err) => console.error('Failed to load pharmacy', err));
  }, []);

  const floors = ['All Floors', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];

  const filteredLocations =
    activeFloor === 'All Floors'
      ? locations
      : locations.filter((loc) => loc.floor === activeFloor);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Hospital Floor Guide & Wayfinding
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                AIIMS New Delhi — OPD Complex & Diagnostic Wing
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveView('directory')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'directory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Floor Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveView('pharmacy')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeView === 'pharmacy' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Pharmacy Route</span>
            </button>
          </div>
        </div>

        {/* Pharmacy Disclaimer Banner */}
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Hospital Notice:</strong> “This is ONLY navigation assistance to locate the medicine dispensing counter. SwasthyaQueue does not recommend medicines, alter doctor dosages, or issue prescriptions.”
          </p>
        </div>
      </div>

      {/* VIEW 1: DEDICATED PHARMACY STEP-BY-STEP ROUTE */}
      {activeView === 'pharmacy' && (
        <div className="bg-white rounded-2xl border-2 border-teal-600/40 p-6 sm:p-8 space-y-6 shadow-md">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
              Hospital Pharmacy Navigation
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Government Hospital Pharmacy (Free Medicine Counter)
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-semibold">
              <span className="text-purple-800 font-bold">2nd Floor • Room 12B</span>
              <span>•</span>
              <span className="text-slate-500">Operating: 08:30 AM - 04:30 PM</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Free Generic Dispensary</span>
            </div>
          </div>

          {/* Stepper Route */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Step-by-Step Walking Route from Main Gate
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
              {[
                { step: 'Entrance', title: 'Main Hospital Gate & Security Check', desc: 'Enter through Gate No. 2 (Front Porch). Proceed through physical screening.', color: 'bg-emerald-500' },
                { step: 'Reception', title: 'Ground Floor Central Atrium / Reception', desc: 'Cross the OPD waiting lounge towards the central lift bank.', color: 'bg-teal-500' },
                { step: 'Lift / Stairs', title: 'Take Elevator Bank B or Staircase', desc: 'Take elevator 3 or 4 to the 2nd Floor.', color: 'bg-blue-500' },
                { step: '2nd Floor', title: 'Exit Lift to 2nd Floor Corridor', desc: 'Follow the prominent Yellow floor directional stripe.', color: 'bg-indigo-500' },
                { step: 'Room 12B', title: 'Arrive at Room 12B — Central Pharmacy', desc: 'Present your doctor OPD consultation slip at Counter 1 to 4.', color: 'bg-rose-500' },
              ].map((r, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className={`w-5 h-5 rounded-full ${r.color} text-white text-[10px] font-bold flex items-center justify-center shrink-0 ring-4 ring-white mt-0.5`}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{r.step}: {r.title}</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-FLOOR DIRECTORY */}
      {activeView === 'directory' && (
        <div className="space-y-6">
          {/* Floor filter buttons */}
          <div className="flex flex-wrap gap-2">
            {floors.map((floor) => (
              <button
                key={floor}
                type="button"
                onClick={() => setActiveFloor(floor)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeFloor === floor
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {loc.category}
                  </span>
                  <span className="text-xs font-bold text-purple-800">
                    {loc.floor} • {loc.room}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{loc.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{loc.building}</p>
                </div>

                {loc.routeInstructions && loc.routeInstructions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Wayfinding Steps:
                    </span>
                    <ol className="text-xs text-slate-600 space-y-0.5 list-decimal list-inside">
                      {loc.routeInstructions.slice(0, 3).map((step, idx) => (
                        <li key={idx} className="line-clamp-1">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{loc.operatingHours}</span>
                  </span>
                  {loc.category === 'PHARMACY' && (
                    <button
                      type="button"
                      onClick={() => setActiveView('pharmacy')}
                      className="text-teal-700 font-bold hover:underline"
                    >
                      View Walking Path
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
