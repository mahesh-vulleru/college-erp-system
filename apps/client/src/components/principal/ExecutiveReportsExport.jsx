import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export const ExecutiveReportsExport = ({ departments = [] }) => {
  const [exportingReport, setExportingReport] = useState(null);

  const reportsList = [
    {
      id: 'dept-enrollment',
      title: 'Departmental Enrollment & Faculty Roster Audit',
      description: 'Comprehensive roster of all department programs, enrolled students, faculty strength, and student-teacher ratio.',
      filename: 'Department_Enrollment_Audit',
      getData: () =>
        departments.map((d) => ({
          DepartmentCode: d.code || 'N/A',
          DepartmentName: d.name || 'Unnamed',
          HOD: d.hod?.name || 'Unassigned',
          ActiveStudents: d.studentCount || 0,
          FacultyMembers: d.facultyCount || 0,
          Ratio: `${d.studentCount || 0}:${d.facultyCount || 1}`
        })),
      columns: [
        { header: 'Department Code', key: 'DepartmentCode' },
        { header: 'Department Name', key: 'DepartmentName' },
        { header: 'Head of Department', key: 'HOD' },
        { header: 'Enrolled Students', key: 'ActiveStudents' },
        { header: 'Faculty Strength', key: 'FacultyMembers' },
        { header: 'Student-Teacher Ratio', key: 'Ratio' }
      ]
    },
    {
      id: 'attendance-summary',
      title: 'Institutional Monthly Attendance & Compliance Record',
      description: 'Aggregated monthly attendance health statistics and regulatory compliance metrics across all semesters.',
      filename: 'Institutional_Attendance_Compliance',
      getData: () => [
        { Metric: 'Overall College Attendance', Percentage: '86.4%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech CSE Attendance Average', Percentage: '88.1%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech ECE Attendance Average', Percentage: '84.7%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech Mechanical Attendance Average', Percentage: '82.9%', ComplianceStatus: 'Compliant' },
        { Metric: 'B.Tech Civil Attendance Average', Percentage: '79.5%', ComplianceStatus: 'Under Surveillance' }
      ],
      columns: [
        { header: 'Metric / Department', key: 'Metric' },
        { header: 'Attendance Average', key: 'Percentage' },
        { header: 'Regulatory Status', key: 'ComplianceStatus' }
      ]
    },
    {
      id: 'exam-results',
      title: 'University Semester Assessment & Grade Distribution',
      description: 'Official academic pass percentages, distinction counts, and semester examination results summary.',
      filename: 'Academic_Assessment_Grades_Summary',
      getData: () => [
        { Semester: 'Odd Semester 2025-26', TotalAppeared: 1240, Passed: 1165, PassPercentage: '93.9%', Distinctions: 382 },
        { Semester: 'Even Semester 2024-25', TotalAppeared: 1198, Passed: 1118, PassPercentage: '93.3%', Distinctions: 345 }
      ],
      columns: [
        { header: 'Examination Cycle', key: 'Semester' },
        { header: 'Candidates Appeared', key: 'TotalAppeared' },
        { header: 'Candidates Passed', key: 'Passed' },
        { header: 'Institutional Pass Rate', key: 'PassPercentage' },
        { header: 'Distinctions (>75%)', key: 'Distinctions' }
      ]
    }
  ];

  const handleExport = (report) => {
    setExportingReport(report.id);
    try {
      const rows = report.getData();
      exportToCsv(report.filename, rows, report.columns);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setTimeout(() => setExportingReport(null), 1000);
    }
  };

  return (
    <Card
      title="Multi-Format Executive Reports & Archival Export"
      subtitle="Generate and download RFC-4180 standard spreadsheet reports for regulatory bodies (AICTE, NBA, NAAC)"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportsList.map((report) => (
          <div
            key={report.id}
            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-2 text-indigo-700 font-semibold text-xs mb-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>CSV Spreadsheet</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{report.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{report.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <Button
                variant="secondary"
                size="xs"
                className="w-full justify-center"
                icon={exportingReport === report.id ? CheckCircle2 : Download}
                onClick={() => handleExport(report)}
                disabled={exportingReport === report.id}
              >
                {exportingReport === report.id ? 'Exported Successfully' : 'Download CSV Export'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ExecutiveReportsExport;

