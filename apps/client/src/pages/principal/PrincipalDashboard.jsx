import React from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  CalendarCheck
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const PrincipalDashboard = () => {
  const navigate = useNavigate();

  const deptAttendance = [
    { label: 'CSE', value: 89 },
    { label: 'ECE', value: 84 },
    { label: 'EEE', value: 78 },
    { label: 'ME', value: 81 },
    { label: 'CE', value: 86 },
    { label: 'IT', value: 92 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <Building2 className="w-3.5 h-3.5 mr-1" />
            <span>Principal & Executive Council Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Institutional Performance & Academic Oversight</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Macro metrics across 6 engineering departments, student roll strength, overall attendance compliance, and fee collection health.
          </p>
        </div>
        <div>
          <Badge variant="teal" size="md">Executive Ready</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Total Enrolled Students" value="840 / 1,000" subtitle="84% Institutional Capacity" icon={GraduationCap} color="navy" />
        <StatWidget title="Faculty Strength" value="64 Members" subtitle="1:13 Teacher-Student Ratio" icon={Users} color="teal" />
        <StatWidget title="Overall Attendance" value="85.4%" subtitle="Above 75% Regulatory Minimum" icon={CalendarCheck} color="emerald" trend="+1.2%" />
        <StatWidget title="Semester Pass Rate" value="91.8%" subtitle="Even Semester University Exams" icon={Award} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Department-Wise Attendance Performance"
          subtitle="Real-time average student attendance across 6 engineering branches"
          className="lg:col-span-2"
        >
          <SimpleBarChart data={deptAttendance} height={180} barColor="bg-teal-600" />
        </Card>

        <Card title="Executive Decisions" subtitle="Pending approvals & reviews">
          <div className="space-y-2.5">
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/departments')} icon={Building2}>
              Review Department Status
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/reports')} icon={TrendingUp}>
              Institutional Summary Reports
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/examinations')} icon={Award}>
              Examination Schedules
            </Button>
            <Button variant="teal" size="sm" className="w-full justify-start" onClick={() => navigate('/notices')} icon={BookOpen}>
              Publish Institutional Circular
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalDashboard;

