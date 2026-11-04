/**
 * Seed Demo Students
 * Creates 100 Student profiles linked to User records, Departments, Courses, and Parent accounts
 */
const Student = require('../../modules/students/student.model');
const { DEMO_PREFIX, DEPARTMENTS } = require('./config');

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];

async function seedStudents(userMap, academicMap) {
  console.log('[Students] Seeding 100 student profiles linked to departments and parents...');
  const studentProfiles = [];

  for (let i = 0; i < 100; i++) {
    const num = String(i + 1).padStart(3, '0');
    const rollNumber = `${DEMO_PREFIX}STU-${num}`;
    const enrNumber = `${DEMO_PREFIX}ENR-2024-${num}`;

    // Distribute 20 students per department
    const deptIdx = Math.floor(i / 20);
    const deptCode = DEPARTMENTS[deptIdx].code;
    const dept = academicMap.departments[deptCode];
    const course = academicMap.courses[deptCode];

    // Distribute semesters 1 to 4
    const semester = (i % 4) + 1;
    const studentUser = userMap.students[i];
    const parentUser = userMap.parents[i];

    let profile = await Student.findOne({ rollNumber });
    if (!profile) {
      profile = await Student.create({
        user: studentUser._id,
        rollNumber,
        enrollmentNumber: enrNumber,
        department: dept._id,
        course: course._id,
        currentSemester: semester,
        batchYear: '2024-2028',
        guardianName: parentUser.name,
        guardianPhone: parentUser.email,
        bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
        admissionStatus: 'enrolled'
      });
    } else {
      profile.department = dept._id;
      profile.course = course._id;
      profile.guardianName = parentUser.name;
      profile.guardianPhone = parentUser.email;
      await profile.save();
    }
    studentProfiles.push(profile);
  }

  console.log(`[Students] Successfully provisioned ${studentProfiles.length} student profile records.`);
  return studentProfiles;
}

module.exports = { seedStudents };

