import React, { useState } from 'react';
import { BedDouble, Building2, Users, Utensils, ShieldCheck, Search, Plus, Phone } from 'lucide-react';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';

export const HostelPage = () => {
  const [activeTab, setActiveTab] = useState('blocks');

  const blocks = [
    { name: 'Kalam Block (Boys Hostel 1)', type: 'Boys', rooms: 120, capacity: '340/360', warden: 'Dr. S. K. Nair', phone: '+91 94401 11223', feePerSem: '₹45,000', status: 'Available (20)' },
    { name: 'Bhabha Block (Boys Hostel 2)', type: 'Boys', rooms: 100, capacity: '295/300', warden: 'Prof. R. V. Rao', phone: '+91 94401 22334', feePerSem: '₹45,000', status: 'Available (5)' },
    { name: 'Kalpana Block (Girls Hostel 1)', type: 'Girls', rooms: 150, capacity: '430/450', warden: 'Dr. Ananya Roy', phone: '+91 94401 33445', feePerSem: '₹48,000', status: 'Available (20)' },
    { name: 'Sarojini Block (Girls Hostel 2)', type: 'Girls', rooms: 80, capacity: '235/240', warden: 'Mrs. P. Vani', phone: '+91 94401 44556', feePerSem: '₹48,000', status: 'Available (5)' },
    { name: 'Visvesvaraya PG Wing', type: 'Co-ed / PG', rooms: 50, capacity: '90/100', warden: 'Dr. M. Chari', phone: '+91 94401 55667', feePerSem: '₹55,000', status: 'Available (10)' }
  ];

  return (
    <div className="space-y-6">
      <DashboardHeaderBanner
        title="Hostel & Residential Facilities"
        subtitle="Campus residential accommodation, warden supervision, mess menu schedule, and digital room allocations."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardKPICard title="Total Residential Blocks" value="5 Blocks" icon={Building2} trend="Fully Staffed" color="emerald" />
        <DashboardKPICard title="Total Capacity" value="1,450 Beds" icon={BedDouble} trend="95.8% Occupied" color="blue" />
        <DashboardKPICard title="Current Residents" value="1,390" icon={Users} trend="+45 enrolled" color="purple" />
        <DashboardKPICard title="CCTV & Guard Security" value="24 / 7" icon={ShieldCheck} trend="Biometric Gated" color="emerald" />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'blocks' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hostel Blocks (5)
            </button>
            <button
              onClick={() => setActiveTab('mess')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'mess' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mess Weekly Menu
            </button>
          </div>

          <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto">
            <Plus className="w-3.5 h-3.5" /> Allocate Room
          </button>
        </div>

        {/* Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((b, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all hover-card-elevate space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {b.type}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{b.name}</h4>
                </div>
                <span className="text-xs font-black text-emerald-700">{b.feePerSem}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">Occupancy</span>
                  <span className="font-bold text-slate-800">{b.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vacant</span>
                  <span className="font-bold text-emerald-600">{b.status}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Chief Warden</span>
                  <span className="font-semibold text-slate-800">{b.warden}</span>
                </div>
                <a href={`tel:${b.phone}`} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HostelPage;

