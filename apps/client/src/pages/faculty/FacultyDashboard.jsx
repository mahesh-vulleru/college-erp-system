import React from 'react';
import {
  CalendarCheck,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <CalendarCheck className="w-3.5 h-3.5 mr-1" />
            <span>Faculty Academic Workplace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Record period attendance, log internal examination marks, manage subject notes, and review your daily timetable.
          </p>
        </div>
        <div>
          <Badge variant="teal" size="md">Teacher Portal Active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Assigned Subjects" value="3 Courses" subtitle="CS301, CS302, CS305" icon={BookOpen} color="teal" />
        <StatWidget title="Today's Lectures" value="3 Sessions" subtitle="09:00, 11:15, 14:00" icon={Clock} color="navy" />
        <StatWidget title="Pending Attendance" value="1 Class" subtitle="Period 4: CS301 (Sec A)" icon={CalendarCheck} color="amber" />
        <StatWidget title="Internal Marks" value="Completed" subtitle="Mid-Term 1 Marks Locked" icon={Award} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Today's Lecture Schedule"
          subtitle="Timetable slots allocated for your teaching schedule"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {[
              { time: '09:00 - 09:50 AM', subject: 'Data Structures & Algorithms (CS301)', venue: 'Room 302 (CSE Dept)', status: 'Completed', marked: true },
              { time: '11:15 - 12:05 PM', subject: 'Database Management Systems (CS302)', venue: 'Room 304 (CSE Dept)', status: 'Completed', marked: true },
              { time: '02:00 - 02:50 PM', subject: 'Data Structures Lab (CS301-P)', venue: 'Computing Lab 2', status: 'Upcoming', marked: false }
            ].map((slot, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-warm-50 border border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-navy-900">{slot.subject}</span>
                    <Badge variant={slot.marked ? 'success' : 'warning'} size="xs">
                      {slot.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-navy-500 mt-1 font-light">
                    {slot.time} &bull; {slot.venue}
                  </p>
                </div>
                <Button
                  variant={slot.marked ? 'secondary' : 'teal'}
                  size="sm"
                  onClick={() => navigate('/attendance')}
                  icon={slot.marked ? CheckCircle : CalendarCheck}
                >
                  {slot.marked ? 'View Register' : 'Mark Attendance'}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Academic Tasks">
          <div className="space-y-2">
            <Button variant="teal" size="sm" className="w-full justify-start" onClick={() => navigate('/attendance')} icon={CalendarCheck}>
              Take Class Attendance
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/results')} icon={Award}>
              Enter Mid-Term Marks
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/timetable')} icon={Clock}>
              My Weekly Timetable
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/notices')} icon={FileText}>
              View College Notices
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FacultyDashboard;

