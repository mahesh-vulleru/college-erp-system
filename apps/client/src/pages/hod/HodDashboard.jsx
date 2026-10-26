import React from 'react';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  Clock,
  Layers
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const HodDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <Users className="w-3.5 h-3.5 mr-1" />
            <span>Head of Department Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {user?.department || 'Department Academic Oversight'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Semester syllabus progression, faculty workload distribution, daily class registers, and student performance tracking.
          </p>
        </div>
        <div>
          <Badge variant="teal" size="md">HOD Operations Ready</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Department Students" value="180 Enrolled" subtitle="Semesters 1 through 8" icon={Users} color="navy" />
        <StatWidget title="Department Faculty" value="14 Lecturers" subtitle="100% Workload Allocated" icon={BookOpen} color="teal" />
        <StatWidget title="Subjects Active" value="24 Courses" subtitle="Odd Semester Curriculum" icon={Layers} color="emerald" />
        <StatWidget title="Today's Classes" value="18 / 18 Scheduled" subtitle="Zero Cancellations" icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Department Operational Modules"
          subtitle="Workflows ready for Phase 2 implementation"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {[
              { title: 'Semester Timetable & Class Allotment', desc: 'Configure weekly periods, lecture slots, and lab session venues.', path: '/timetable' },
              { title: 'Faculty Workload & Subject Assignment', desc: 'Allot theoretical units and practical laboratories to department professors.', path: '/faculty' },
              { title: 'Student Attendance & Condonation Roster', desc: 'Identify students falling under the 75% attendance criteria.', path: '/attendance' },
              { title: 'Internal Assessment Marks Verification', desc: 'Review, moderate, and approve faculty test marks before submission.', path: '/results' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-navy-900">{item.title}</h4>
                  <p className="text-xs text-navy-500 font-light mt-0.5">{item.desc}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => navigate(item.path)}>
                  Open &rarr;
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Department Shortcuts">
          <div className="space-y-2">
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/timetable')} icon={Clock}>
              Manage Timetable
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/attendance')} icon={CalendarCheck}>
              Check Class Attendance
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/results')} icon={Award}>
              Verify Marks Entry
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HodDashboard;

