import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Activity,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserPlus,
  Table,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';

export const DashboardWidgetsRow = ({
  upcomingEvents = [
    {
      dateMonth: 'OCT',
      dateDay: '30',
      title: 'Academic Council Meeting',
      time: '10:00 AM – 12:00 PM',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      dateMonth: 'NOV',
      dateDay: '02',
      title: 'Semester Exam – CSE (III Year)',
      time: '09:30 AM – 01:00 PM',
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      dateMonth: 'NOV',
      dateDay: '05',
      title: "Parents' Meeting",
      time: '02:00 PM – 04:00 PM',
      color: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    {
      dateMonth: 'NOV',
      dateDay: '10',
      title: 'New Faculty Orientation',
      time: '11:00 AM – 01:00 PM',
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    }
  ],
  recentActivities = [
    {
      title: 'New faculty joined: 3',
      time: '10 mins ago',
      icon: UserPlus,
      bg: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Department timetable updated (CSE)',
      time: '25 mins ago',
      icon: Table,
      bg: 'bg-sky-100 text-sky-700'
    },
    {
      title: 'Fee collection: ₹56,300',
      time: '40 mins ago',
      icon: CreditCard,
      bg: 'bg-amber-100 text-amber-700'
    },
    {
      title: 'Exam schedule published',
      time: '1 hour ago',
      icon: FileSpreadsheet,
      bg: 'bg-teal-100 text-teal-700'
    }
  ],
  notices = [
    {
      title: 'Semester exam schedule released.',
      isNew: true
    },
    {
      title: 'New faculty orientation on Nov 10.',
      isNew: false
    },
    {
      title: 'Last date for fee payment: Nov 05.',
      isNew: false
    },
    {
      title: 'Department meeting on Oct 30.',
      isNew: false
    },
    {
      title: 'Internal marks submission by Nov 03.',
      isNew: false
    }
  ]
}) => {
  // Calendar State: October 2026
  const [currentMonth, setCurrentMonth] = useState('October 2026');
  const [selectedDay, setSelectedDay] = useState(27);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // October 2026 starts on Thursday (1st). Prev days: 27, 28, 29, 30
  const calendarCells = [
    { day: 27, current: false },
    { day: 28, current: false },
    { day: 29, current: false },
    { day: 30, current: false },
    { day: 1, current: true },
    { day: 2, current: true },
    { day: 3, current: true },
    { day: 4, current: true },
    { day: 5, current: true },
    { day: 6, current: true },
    { day: 7, current: true },
    { day: 8, current: true },
    { day: 9, current: true },
    { day: 10, current: true },
    { day: 11, current: true },
    { day: 12, current: true },
    { day: 13, current: true },
    { day: 14, current: true },
    { day: 15, current: true },
    { day: 16, current: true },
    { day: 17, current: true },
    { day: 18, current: true },
    { day: 19, current: true },
    { day: 20, current: true },
    { day: 21, current: true },
    { day: 22, current: true },
    { day: 23, current: true },
    { day: 24, current: true },
    { day: 25, current: true },
    { day: 26, current: true },
    { day: 27, current: true },
    { day: 28, current: true },
    { day: 29, current: true },
    { day: 30, current: true },
    { day: 31, current: true },
    { day: 1, current: false },
    { day: 2, current: false },
    { day: 3, current: false },
    { day: 4, current: false },
    { day: 5, current: false },
    { day: 6, current: false }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Upcoming Events */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Events</h3>
          </div>
          <Link to="/timetable" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            View All
          </Link>
        </div>

        <div className="divide-y divide-slate-100 space-y-2 mt-2">
          {upcomingEvents.map((evt, idx) => (
            <div key={idx} className="flex items-center gap-3 pt-2">
              {/* Date Box */}
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border text-center shrink-0 ${evt.color}`}>
                <span className="text-[9px] font-bold uppercase leading-none">{evt.dateMonth}</span>
                <span className="text-base font-black leading-tight">{evt.dateDay}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 truncate">{evt.title}</h4>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {evt.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Recent Activities */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activities</h3>
          </div>
          <Link to="/reports" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            View All
          </Link>
        </div>

        <div className="space-y-3 mt-3">
          {recentActivities.map((act, idx) => {
            const Icon = act.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${act.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug">{act.title}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Mini Calendar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Calendar</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-slate-700">{currentMonth}</span>
            <button
              type="button"
              onClick={() => setSelectedDay(Math.min(31, selectedDay + 1))}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mt-2 border-b border-slate-100 pb-1">
          {daysOfWeek.map((d) => (
            <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mt-1.5">
          {calendarCells.slice(0, 35).map((cell, idx) => {
            const isSelected = cell.current && cell.day === selectedDay;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => cell.current && setSelectedDay(cell.day)}
                className={`h-7 w-7 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                  !cell.current
                    ? 'text-slate-300 pointer-events-none'
                    : isSelected
                    ? 'bg-[#064e3b] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Notices & Announcements */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Megaphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Notices & Announcements</h3>
          </div>
          <Link to="/notices" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            View All
          </Link>
        </div>

        <ul className="space-y-2.5 mt-2">
          {notices.map((n, idx) => (
            <li key={idx} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="text-slate-700 font-medium leading-snug">{n.title}</span>
              </div>
              {n.isNew && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase shrink-0">
                  New
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DashboardWidgetsRow;

