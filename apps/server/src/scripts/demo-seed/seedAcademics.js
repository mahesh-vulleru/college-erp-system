/**
 * Seed Demo Academics
 * Departments, Courses, Subjects, Faculty Profiles, Timetable, and Academic Calendar
 */
const Department = require('../../modules/departments/department.model');
const Course = require('../../modules/courses/course.model');
const Subject = require('../../modules/subjects/subject.model');
const Faculty = require('../../modules/faculty/faculty.model');
const Timetable = require('../../modules/timetable/timetable.model');
const InstitutionalEvent = require('../../modules/events/institutionalEvent.model');
const { DEMO_PREFIX, DEMO_TAG, DEPARTMENTS } = require('./config');

const SUBJECT_CATALOG = {
  CSE: [
    { name: 'Introduction to Programming & C', code: 'CS101', sem: 1, credits: 4 },
    { name: 'Digital Logic & Computer Design', code: 'CS102', sem: 1, credits: 3 },
    { name: 'Data Structures & Algorithms', code: 'CS201', sem: 2, credits: 4 },
    { name: 'Object Oriented Programming with Java', code: 'CS202', sem: 2, credits: 4 },
    { name: 'Database Management Systems', code: 'CS301', sem: 3, credits: 4 },
    { name: 'Operating Systems Internals', code: 'CS302', sem: 3, credits: 3 },
    { name: 'Computer Networks & Protocols', code: 'CS401', sem: 4, credits: 4 }
  ],
  ECE: [
    { name: 'Basic Electrical & Electronics', code: 'EC101', sem: 1, credits: 4 },
    { name: 'Network Theory & Circuit Analysis', code: 'EC102', sem: 1, credits: 3 },
    { name: 'Electronic Devices & Circuits', code: 'EC201', sem: 2, credits: 4 },
    { name: 'Signals & Linear Systems', code: 'EC202', sem: 2, credits: 4 },
    { name: 'Analog Integrated Circuits', code: 'EC301', sem: 3, credits: 4 },
    { name: 'Microprocessors & Microcontrollers', code: 'EC302', sem: 3, credits: 4 },
    { name: 'Digital Signal Processing', code: 'EC401', sem: 4, credits: 4 }
  ],
  ME: [
    { name: 'Engineering Mechanics', code: 'ME101', sem: 1, credits: 4 },
    { name: 'Engineering Graphics & CAD', code: 'ME102', sem: 1, credits: 3 },
    { name: 'Thermodynamics & Heat Transfer', code: 'ME201', sem: 2, credits: 4 },
    { name: 'Manufacturing Processes', code: 'ME202', sem: 2, credits: 4 },
    { name: 'Fluid Mechanics & Machinery', code: 'ME301', sem: 3, credits: 4 },
    { name: 'Kinematics & Dynamics of Machines', code: 'ME302', sem: 3, credits: 4 },
    { name: 'Design of Machine Elements', code: 'ME401', sem: 4, credits: 4 }
  ],
  CE: [
    { name: 'Building Materials & Construction', code: 'CE101', sem: 1, credits: 3 },
    { name: 'Surveying & Geomatics', code: 'CE102', sem: 1, credits: 4 },
    { name: 'Strength of Materials', code: 'CE201', sem: 2, credits: 4 },
    { name: 'Fluid Mechanics in Civil Eng', code: 'CE202', sem: 2, credits: 3 },
    { name: 'Structural Analysis I', code: 'CE301', sem: 3, credits: 4 },
    { name: 'Geotechnical Engineering', code: 'CE302', sem: 3, credits: 4 },
    { name: 'Environmental Engineering', code: 'CE401', sem: 4, credits: 4 }
  ],
  EEE: [
    { name: 'Electric Circuit Theory', code: 'EE101', sem: 1, credits: 4 },
    { name: 'Electromagnetic Field Theory', code: 'EE102', sem: 1, credits: 3 },
    { name: 'Electrical Machines I', code: 'EE201', sem: 2, credits: 4 },
    { name: 'Power System Generation', code: 'EE202', sem: 2, credits: 4 },
    { name: 'Control Systems Engineering', code: 'EE301', sem: 3, credits: 4 },
    { name: 'Electrical Machines II', code: 'EE302', sem: 3, credits: 4 },
    { name: 'Power Electronics & Drives', code: 'EE401', sem: 4, credits: 4 }
  ]
};

async function seedAcademics(userMap) {
  console.log('[Academics] Seeding 5 departments, 5 programs, 35 subjects, faculty profiles, and schedules...');
  const academicMap = {
    departments: {},
    courses: {},
    subjects: {},
    faculties: []
  };

  // 1. Departments & Courses
  for (const d of DEPARTMENTS) {
    const hodUser = userMap.hods[d.code];
    let dept = await Department.findOne({ code: `${DEMO_PREFIX}${d.code}` });
    if (!dept) {
      dept = await Department.create({
        name: `${d.name} ${DEMO_TAG}`,
        code: `${DEMO_PREFIX}${d.code}`,
        hod: hodUser ? hodUser._id : null,
        intakeCapacity: d.intakeCapacity,
        description: d.description
      });
    } else {
      dept.hod = hodUser ? hodUser._id : null;
      await dept.save();
    }
    academicMap.departments[d.code] = dept;

    // Course
    let course = await Course.findOne({ code: `${DEMO_PREFIX}BT-${d.code}` });
    if (!course) {
      course = await Course.create({
        name: `Bachelor of Technology in ${d.name} ${DEMO_TAG}`,
        code: `${DEMO_PREFIX}BT-${d.code}`,
        department: dept._id,
        durationYears: 4,
        totalSemesters: 8
      });
    }
    academicMap.courses[d.code] = course;
  }

  // 2. 20 Faculty Profiles (4 per department)
  const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Assistant Professor'];
  const specs = [
    'Artificial Intelligence & Systems', 'Signal Processing & VLSI',
    'Thermal & Fluid Dynamics', 'Structural Engineering', 'Power Systems & Drives'
  ];

  for (let i = 0; i < 20; i++) {
    const deptIdx = Math.floor(i / 4);
    const deptCode = DEPARTMENTS[deptIdx].code;
    const dept = academicMap.departments[deptCode];
    const facultyUser = userMap.faculty[i];
    const empId = `${DEMO_PREFIX}FAC-${String(i + 1).padStart(2, '0')}`;

    let facProfile = await Faculty.findOne({ employeeId: empId });
    if (!facProfile) {
      facProfile = await Faculty.create({
        user: facultyUser._id,
        employeeId: empId,
        department: dept._id,
        designation: designations[i % 4],
        qualification: i % 2 === 0 ? 'Ph.D in Engineering' : 'M.Tech / M.E.',
        specialization: specs[deptIdx]
      });
    }
    academicMap.faculties.push(facProfile);
  }

  // 3. Subjects & Timetable Schedules
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (const d of DEPARTMENTS) {
    const dept = academicMap.departments[d.code];
    const course = academicMap.courses[d.code];
    const subjects = SUBJECT_CATALOG[d.code];
    academicMap.subjects[d.code] = [];

    const deptFaculties = academicMap.faculties.filter(f => f.department.toString() === dept._id.toString());

    for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
      const s = subjects[sIdx];
      const subCode = `${DEMO_PREFIX}${s.code}`;
      let subject = await Subject.findOne({ code: subCode });
      if (!subject) {
        subject = await Subject.create({
          name: `${s.name} ${DEMO_TAG}`,
          code: subCode,
          course: course._id,
          department: dept._id,
          semester: s.sem,
          credits: s.credits
        });
      }
      academicMap.subjects[d.code].push(subject);

      // Timetable entry
      const day = days[sIdx % days.length];
      const period = (sIdx % 6) + 1;
      const assignedFac = deptFaculties[sIdx % deptFaculties.length];
      const roomNum = `${DEMO_PREFIX}Room-${100 + (sIdx % 10) + 1}`;

      let tt = await Timetable.findOne({ subject: subject._id, periodNumber: period });
      if (!tt) {
        await Timetable.create({
          department: dept._id,
          course: course._id,
          semester: s.sem,
          section: 'A',
          dayOfWeek: day,
          periodNumber: period,
          startTime: `0${8 + period}:00`,
          endTime: `0${8 + period}:50`,
          subject: subject._id,
          faculty: assignedFac._id,
          roomNumber: roomNum
        });
      }
    }
  }

  // 4. Academic Calendar Events
  const events = [
    { title: `Mid-Term Examination Week ${DEMO_TAG}`, desc: 'College-wide Mid-Term 1 Assessments', cat: 'Examination Deadline', daysFromNow: 10 },
    { title: `Accreditation Committee Review ${DEMO_TAG}`, desc: 'Annual institutional compliance evaluation', cat: 'Accreditation Submission', daysFromNow: 25 },
    { title: `Governing Council Meeting ${DEMO_TAG}`, desc: 'Executive committee strategy session', cat: 'Council Meeting', daysFromNow: 30 },
    { title: `Campus Annual Technical Symposium ${DEMO_TAG}`, desc: 'Inter-department hackathon and project expo', cat: 'Academic Event', daysFromNow: 45 }
  ];

  for (const ev of events) {
    let exist = await InstitutionalEvent.findOne({ title: ev.title });
    if (!exist) {
      await InstitutionalEvent.create({
        title: ev.title,
        description: ev.desc,
        eventCategory: ev.cat,
        startDate: new Date(Date.now() + ev.daysFromNow * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (ev.daysFromNow + 2) * 24 * 60 * 60 * 1000),
        priority: 'high',
        assignedOwner: userMap.core.principal._id,
        venue: 'Main Auditorium & Seminar Halls'
      });
    }
  }

  console.log('[Academics] Successfully provisioned academic structures, schedules, and events.');
  return academicMap;
}

module.exports = { seedAcademics };

