import React from 'react';
import { Calendar } from 'lucide-react';
import CampusBuildingGraphic from '../common/CampusBuildingGraphic';

export const DashboardHeaderBanner = ({
  title = 'Principal / Management Dashboard',
  subtitle = 'Institutional analytics, academic overview, and executive governance.',
  academicYear = '2026 – 2027'
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left text */}
      <div className="relative z-10 max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-normal">
          {subtitle}
        </p>
      </div>

      {/* Right campus architectural illustration & Academic Year Pill */}
      <div className="flex items-center gap-4 self-start md:self-auto shrink-0 relative z-10">
        <div className="hidden sm:block">
          <CampusBuildingGraphic className="w-44 h-24 lg:w-56 lg:h-28" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-900 shadow-2xs">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] text-emerald-700/80 uppercase font-semibold block leading-none">Academic Year</span>
            <span className="text-xs font-bold text-emerald-950 leading-tight">{academicYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeaderBanner;

