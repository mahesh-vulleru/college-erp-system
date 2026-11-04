/**
 * Seed Demo Attendance Records
 * Generates 200+ realistic attendance sessions across multiple dates, subjects, and statuses
 */
const Attendance = require('../../modules/attendance/attendance.model');
const { DEPARTMENTS } = require('./config');

async function seedAttendance(academicMap, studentProfiles) {
  console.log('[Attendance] Seeding 200+ realistic student attendance records across subjects and dates...');

  const dates = [];
  const now = new Date();
  for (let d = 1; d <= 7; d++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    dt.setHours(9, 0, 0, 0);
    dates.push(dt);
  }

  let totalSeeded = 0;
  // Generate attendance for each department
  for (let deptIdx = 0; deptIdx < DEPARTMENTS.length; deptIdx++) {
    const deptCode = DEPARTMENTS[deptIdx].code;
    const deptStudents = studentProfiles.slice(deptIdx * 20, (deptIdx + 1) * 20);
    const deptSubjects = academicMap.subjects[deptCode];
    const deptFaculties = academicMap.faculties.filter(f => f.department.toString() === academicMap.departments[deptCode]._id.toString());

    if (!deptSubjects || deptSubjects.length === 0 || deptFaculties.length === 0) continue;

    for (let sIdx = 0; sIdx < Math.min(deptStudents.length, 10); sIdx++) {
      const student = deptStudents[sIdx];
      const subject = deptSubjects[sIdx % deptSubjects.length];
      const faculty = deptFaculties[sIdx % deptFaculties.length];

      for (let dIdx = 0; dIdx < dates.length; dIdx++) {
        const date = dates[dIdx];
        const periodNumber = (dIdx % 4) + 1;

        // Realistic distribution: 85% present, 10% absent, 5% late
        let status = 'present';
        const rand = (sIdx + dIdx) % 10;
        if (rand === 9) status = 'absent';
        else if (rand === 8) status = 'late';

        const filter = {
          student: student._id,
          subject: subject._id,
          date,
          periodNumber
        };

        const existing = await Attendance.findOne(filter);
        if (!existing) {
          await Attendance.create({
            ...filter,
            faculty: faculty._id,
            status,
            remarks: status === 'present' ? 'Attended full session' : (status === 'late' ? '15 min late arrival' : 'Unexcused absence')
          });
          totalSeeded++;
        }
      }
    }
  }

  console.log(`[Attendance] Successfully provisioned ${totalSeeded} attendance ledger records.`);
}

module.exports = { seedAttendance };

