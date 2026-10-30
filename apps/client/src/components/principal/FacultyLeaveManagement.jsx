import React, { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { Check, X, Calendar, UserCheck } from 'lucide-react';

export const FacultyLeaveManagement = ({ departments = [] }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 'LV-101',
      facultyName: 'Dr. Alan Turing',
      department: 'Computer Science',
      leaveType: 'Academic Duty Leave',
      startDate: '2026-11-05',
      endDate: '2026-11-08',
      reason: 'Keynote Speaker at IEEE International Computing Conference',
      status: 'pending'
    },
    {
      id: 'LV-102',
      facultyName: 'Prof. Grace Hopper',
      department: 'Computer Science',
      leaveType: 'Medical Leave',
      startDate: '2026-11-02',
      endDate: '2026-11-04',
      reason: 'Scheduled diagnostic surgery recovery',
      status: 'pending'
    },
    {
      id: 'LV-103',
      facultyName: 'Dr. Katherine Johnson',
      department: 'Mechanical Engineering',
      leaveType: 'Earned Leave',
      startDate: '2026-11-10',
      endDate: '2026-11-14',
      reason: 'Personal family obligations',
      status: 'pending'
    }
  ]);

  const handleDecision = (id, decision) => {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: decision } : req))
    );
  };

  const filtered = selectedDept === 'all'
    ? leaveRequests
    : leaveRequests.filter((l) => l.department.toLowerCase().includes(selectedDept.toLowerCase()));

  const pendingCount = leaveRequests.filter((l) => l.status === 'pending').length;

  return (
    <Card
      title="Faculty Leave Approvals & Workload Continuity"
      subtitle={`Review institutional leave requests and ensure syllabus coverage during absences (${pendingCount} pending)`}
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
              <th className="py-2.5 px-3">Faculty Member</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Leave Category</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Reason / Justification</th>
              <th className="py-2.5 px-3 text-right">Executive Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{item.facultyName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{item.id}</div>
                </td>
                <td className="py-3 px-3 text-slate-700">{item.department}</td>
                <td className="py-3 px-3">
                  <Badge variant="indigo" size="xs">
                    {item.leaveType}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-slate-600">
                  <span className="font-medium">{item.startDate}</span> to <span className="font-medium">{item.endDate}</span>
                </td>
                <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={item.reason}>
                  {item.reason}
                </td>
                <td className="py-3 px-3 text-right">
                  {item.status === 'pending' ? (
                    <div className="inline-flex items-center space-x-1.5">
                      <button
                        onClick={() => handleDecision(item.id, 'approved')}
                        className="p-1 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        title="Approve Leave"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDecision(item.id, 'rejected')}
                        className="p-1 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Reject Leave"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Badge variant={item.status === 'approved' ? 'success' : 'danger'} size="xs">
                      {item.status.toUpperCase()}
                    </Badge>
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

export default FacultyLeaveManagement;

