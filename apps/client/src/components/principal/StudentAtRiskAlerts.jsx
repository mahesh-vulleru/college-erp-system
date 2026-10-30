import React, { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { AlertTriangle, Users, Mail, CheckCircle2 } from 'lucide-react';

export const StudentAtRiskAlerts = ({ departments = [] }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [notifiedStudents, setNotifiedStudents] = useState({});

  // Mocked/default at-risk cohort for demonstration when no backend push exists
  const atRiskStudents = [
    { id: '1', name: 'Aarav Patel', rollNo: 'CSE-2023-042', department: 'Computer Science', attendance: 62.5, riskLevel: 'danger', reason: 'Critical attendance shortage (<65%)' },
    { id: '2', name: 'Sneha Rao', rollNo: 'ECE-2023-018', department: 'Electronics & Communication', attendance: 68.0, riskLevel: 'warning', reason: 'Low attendance in Core subjects' },
    { id: '3', name: 'Vikram Joshi', rollNo: 'MECH-2022-091', department: 'Mechanical Engineering', attendance: 71.4, riskLevel: 'warning', reason: 'Consecutive absence in Lab practicals' },
    { id: '4', name: 'Divya Nair', rollNo: 'CIVIL-2024-005', department: 'Civil Engineering', attendance: 58.2, riskLevel: 'danger', reason: 'Unexcused absence exceeding 10 days' }
  ];

  const filtered = selectedDept === 'all'
    ? atRiskStudents
    : atRiskStudents.filter((s) => s.department.toLowerCase().includes(selectedDept.toLowerCase()));

  const handleNotify = (id) => {
    setNotifiedStudents((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <Card
      title="Student Academic Risk & Attendance Health Alerts"
      subtitle="Institutional early warning indicator for students with attendance falling below mandatory 75% requirement"
      headerAction={
        <div className="flex items-center space-x-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.code || d.name || d._id} value={d.name || d.code}>
                {d.name || d.code}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/50">
              <th className="py-2.5 px-3">Student Name & Roll No</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Attendance</th>
              <th className="py-2.5 px-3">Risk Assessment</th>
              <th className="py-2.5 px-3 text-right">Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{student.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{student.rollNo}</div>
                </td>
                <td className="py-3 px-3 text-slate-700">{student.department}</td>
                <td className="py-3 px-3">
                  <span className={`font-bold ${student.attendance < 65 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {student.attendance}%
                  </span>
                </td>
                <td className="py-3 px-3">
                  <Badge variant={student.riskLevel} dot size="xs">
                    {student.reason}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  {notifiedStudents[student.id] ? (
                    <span className="inline-flex items-center text-emerald-600 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Notified Proctor
                    </span>
                  ) : (
                    <button
                      onClick={() => handleNotify(student.id)}
                      className="inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3 h-3 mr-1" /> Send Advisory
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default StudentAtRiskAlerts;

