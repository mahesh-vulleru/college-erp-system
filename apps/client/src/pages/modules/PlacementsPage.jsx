import React, { useState } from 'react';
import { Briefcase, Award, TrendingUp, Users, Building, Calendar, Search, Plus, ExternalLink, CheckCircle } from 'lucide-react';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard';

export const PlacementsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const placementDrives = [
    { company: 'Google India', role: 'Software Development Engineer', ctc: '₹44.5 LPA', date: 'Nov 18, 2026', eligibility: 'CGPA >= 8.5 (CSE/ECE/IT)', status: 'Registrations Open', applications: 184 },
    { company: 'Microsoft IDC', role: 'Full Stack Engineer', ctc: '₹42.0 LPA', date: 'Nov 22, 2026', eligibility: 'CGPA >= 8.0 (All Circuits)', status: 'Registrations Open', applications: 210 },
    { company: 'Amazon Web Services', role: 'Cloud Support Associate', ctc: '₹28.0 LPA', date: 'Dec 02, 2026', eligibility: 'CGPA >= 7.5 (All Branches)', status: 'Upcoming', applications: 340 },
    { company: 'Oracle Systems', role: 'Database Core Engineer', ctc: '₹22.5 LPA', date: 'Dec 10, 2026', eligibility: 'CGPA >= 7.0 (CSE/IT)', status: 'Upcoming', applications: 156 },
    { company: 'Tata Consultancy Services', role: 'Digital & Ninja Innovator', ctc: '₹9.0 – 12.0 LPA', date: 'Dec 15, 2026', eligibility: 'CGPA >= 6.5 (All B.Tech)', status: 'Upcoming', applications: 620 }
  ];

  const filteredDrives = placementDrives.filter(
    (d) => d.company.toLowerCase().includes(searchQuery.toLowerCase()) || d.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DashboardHeaderBanner
        title="Training & Campus Placement Cell"
        subtitle="Corporate recruitment drives, campus eligibility screening, CTC analytics, and offer letter tracking."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardKPICard title="Highest Annual Package" value="₹44.5 LPA" icon={Award} trend="New Campus Record" color="emerald" />
        <DashboardKPICard title="Average Package" value="₹8.6 LPA" icon={TrendingUp} trend="+14.2% YoY" color="blue" />
        <DashboardKPICard title="Total Placement Offers" value="984 Offers" icon={Briefcase} trend="88.4% Batch Placed" color="purple" />
        <DashboardKPICard title="Visiting Corporate Partners" value="140+ MNCs" icon={Building} trend="Tier 1 Recruiters" color="emerald" />
      </div>

      {/* Drives Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active & Upcoming Placement Drives</h3>
            <p className="text-xs text-slate-500">Graduating Batch 2026 – 2027</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search company or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" /> Post Drive
            </button>
          </div>
        </div>

        {/* Drives Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Recruiting Company</th>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Offered Package</th>
                <th className="py-3 px-4">Eligibility Criteria</th>
                <th className="py-3 px-4">Drive Date</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrives.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                      {d.company.charAt(0)}
                    </span>
                    {d.company}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{d.role}</td>
                  <td className="py-3 px-4 font-black text-emerald-700">{d.ctc}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{d.eligibility}</td>
                  <td className="py-3 px-4 text-slate-700 font-bold">{d.date}</td>
                  <td className="py-3 px-4 text-slate-700 font-bold">{d.applications} applicants</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      d.status === 'Registrations Open'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {d.status}
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

export default PlacementsPage;

