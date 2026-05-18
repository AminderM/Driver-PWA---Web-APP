import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const TruckScreen = ({ onBack }) => {
  const { api, theme } = useDriverApp();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  const bg   = isDark ? 'bg-black'  : 'bg-white';
  const text = isDark ? 'text-white' : 'text-black';
  const sub  = isDark ? 'text-white/60' : 'text-black/60';
  const card = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]';
  const border = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';

  useEffect(() => {
    api('/truck')
      .then(data => setTruck(data))
      .catch(() => setTruck(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const Field = ({ label, value, mono }) => value ? (
    <div>
      <p className={`text-xs mb-0.5 ${sub}`}>{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''} ${text}`}>{value}</p>
    </div>
  ) : null;

  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <div className={`px-4 py-4 flex items-center gap-3 border-b ${border}`}>
        <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center ${text}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>MY TRUCK</h1>
          <p className={`text-sm ${sub}`}>Vehicle & insurance details</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Vehicle */}
        <div className={`border p-4 space-y-3 ${card}`}>
          <p className={`text-xs tracking-wider ${sub}`}>VEHICLE</p>
          <Field label="Unit Number" value={truck?.truck_unit_number} mono />
          {(truck?.truck_year || truck?.truck_make || truck?.truck_model) && (
            <div>
              <p className={`text-xs mb-0.5 ${sub}`}>Vehicle</p>
              <p className={`text-sm ${text}`}>
                {[truck.truck_year, truck.truck_make, truck.truck_model].filter(Boolean).join(' ')}
              </p>
            </div>
          )}
          <Field label="VIN" value={truck?.truck_vin} mono />
          {truck?.plate_number && (
            <div>
              <p className={`text-xs mb-0.5 ${sub}`}>Plate</p>
              <p className={`text-sm ${text}`}>
                {truck.plate_number}{truck.plate_province ? ` · ${truck.plate_province}` : ''}
              </p>
            </div>
          )}
          <Field label="CVOR Number" value={truck?.cvor_number} mono />
          {!truck && <p className={`text-sm ${sub}`}>No vehicle info on file.</p>}
        </div>

        {/* Insurance */}
        <div className={`border p-4 space-y-3 ${card}`}>
          <p className={`text-xs tracking-wider ${sub}`}>INSURANCE</p>
          <Field label="Cargo Insurance #" value={truck?.cargo_insurance_number} mono />
          {truck?.cargo_insurance_expiry && (
            <div>
              <p className={`text-xs mb-0.5 ${sub}`}>Cargo Expiry</p>
              <p className={`text-sm ${text}`}>{new Date(truck.cargo_insurance_expiry).toLocaleDateString()}</p>
            </div>
          )}
          <Field label="Liability Insurance #" value={truck?.liability_insurance_number} mono />
          {truck?.liability_insurance_expiry && (
            <div>
              <p className={`text-xs mb-0.5 ${sub}`}>Liability Expiry</p>
              <p className={`text-sm ${text}`}>{new Date(truck.liability_insurance_expiry).toLocaleDateString()}</p>
            </div>
          )}
          {!truck?.cargo_insurance_number && !truck?.liability_insurance_number && (
            <p className={`text-sm ${sub}`}>No insurance info on file.</p>
          )}
        </div>

        {/* Lease */}
        {truck?.lease_agreement_number && (
          <div className={`border p-4 space-y-3 ${card}`}>
            <p className={`text-xs tracking-wider ${sub}`}>LEASE</p>
            <Field label="Lease Agreement #" value={truck.lease_agreement_number} mono />
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckScreen;
