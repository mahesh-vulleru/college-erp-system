import React, { useState } from 'react';
import { Bus, MapPin, Users, Phone, ShieldCheck, Search, Plus, Filter, CheckCircle2 } from 'lucide-react';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';

export const TransportPage = () => {
  const [activeTab, setActiveTab] = useState('routes');
  const [searchQuery, setSearchQuery] = useState('');

  const routes = [
    { id: 'R-01', name: 'Campus to Central Railway Station', busNo: 'AP-16-TX-1001', driver: 'M. Ramesh', phone: '+91 98480 12345', capacity: '52/54', status: 'On Route', time: '07:30 AM – 08:30 AM' },
    { id: 'R-02', name: 'Campus to Hitech City / Ring Road', busNo: 'AP-16-TX-1002', driver: 'K. Srinivas', phone: '+91 98480 23456', capacity: '48/54', status: 'On Route', time: '07:15 AM – 08:35 AM' },
    { id: 'R-03', name: 'Campus to Gachibowli Circle', busNo: 'AP-16-TX-1003', driver: 'S. Venkat', phone: '+91 98480 34567', capacity: '54/54', status: 'Arrived', time: '07:45 AM – 08:40 AM' },
    { id: 'R-04', name: 'Campus to Secunderabad Junction', busNo: 'AP-16-TX-1004', driver: 'B. Raju', phone: '+91 98480 45678', capacity: '45/54', status: 'On Route', time: '07:10 AM – 08:45 AM' },
    { id: 'R-05', name: 'Campus to Dilsukhnagar Metro', busNo: 'AP-16-TX-1005', driver: 'P. Krishna', phone: '+91 98480 56789', capacity: '50/54', status: 'Maintenance', time: '07:30 AM – 08:40 AM' }
  ];

  const filteredRoutes = routes.filter(
    (r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.busNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DashboardHeaderBanner
        title="Campus Transport Management"
        subtitle="Live GPS fleet monitoring, institutional bus routes, driver rosters and student bus passes."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardKPICard title="Total Institutional Buses" value="28" icon={Bus} trend="+2 new" color="emerald" />
        <DashboardKPICard title="Active Daily Routes" value="34" icon={MapPin} trend="100% active" color="blue" />
        <DashboardKPICard title="Enrolled Students" value="1,420" icon={Users} trend="+8.4%" color="purple" />
        <DashboardKPICard title="Safety Compliance Score" value="99.2%" icon={ShieldCheck} trend="A+ Certified" color="emerald" />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'routes' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bus Routes ({routes.length})
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'passes' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Digital Passes (1,420)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search route or bus no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" /> Add Route
            </button>
          </div>
        </div>

        {/* Routes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Route ID</th>
                <th className="py-3 px-4">Route Name</th>
                <th className="py-3 px-4">Bus No</th>
                <th className="py-3 px-4">Driver & Contact</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{r.name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{r.busNo}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{r.driver}</div>
                    <div className="text-[11px] text-slate-400">{r.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{r.time}</td>
                  <td className="py-3 px-4 font-bold text-slate-700">{r.capacity}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'On Route'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Arrived'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
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

export default TransportPage;

