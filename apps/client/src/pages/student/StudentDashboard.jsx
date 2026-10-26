import React from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy-950 to-teal-950 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <GraduationCap className="w-3.5 h-3.5 mr-1" />
            <span>Student Self-Service Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Hello, {user?.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            B.Tech Semester 3 &bull; Roll: 24CSE042 &bull; Computer Science & Engineering
          </p>
        </div>
        <div>
          <Badge variant="teal" size="md">Enrolled & Active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Overall Attendance" value="88.2%" subtitle="Eligible for University Exams (>75%)" icon={CalendarCheck} color="teal" trend="+0.5%" />
        <StatWidget title="Current CGPA" value="8.64 / 10" subtitle="Top 10% in Department" icon={Award} color="emerald" />
        <StatWidget title="Semester Fee Status" value="Cleared" subtitle="Zero Outstanding Dues" icon={CreditCard} color="navy" />
        <StatWidget title="Enrolled Subjects" value="6 Subjects" subtitle="Total 24 Credits" icon={GraduationCap} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Subject-Wise Attendance Summary"
          subtitle="Real-time attendance percentage per registered course"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {[
              { subject: 'Data Structures & Algorithms (CS301)', classes: '28 / 30 attended', percentage: 93.3, status: 'Healthy' },
              { subject: 'Database Management Systems (CS302)', classes: '24 / 28 attended', percentage: 85.7, status: 'Healthy' },
              { subject: 'Computer Architecture & Org (CS303)', classes: '22 / 26 attended', percentage: 84.6, status: 'Healthy' },
              { subject: 'Discrete Mathematics (MA301)', classes: '21 / 28 attended', percentage: 75.0, status: 'Borderline' }
            ].map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-navy-900">{sub.subject}</h4>
                  <p className="text-[11px] text-navy-500 mt-0.5">{sub.classes}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-navy-900">{sub.percentage}%</span>
                  <Badge variant={sub.percentage >= 80 ? 'success' : 'warning'} size="xs">
                    {sub.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/timetable')} icon={Clock}>
              My Weekly Timetable
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/results')} icon={Award}>
              Semester Grade Card
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/fees')} icon={CreditCard}>
              Download Fee Receipts
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/notices')} icon={GraduationCap}>
              College Circulars
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;

