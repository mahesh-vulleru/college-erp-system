/**
 * Seed Demo Examinations and Results
 * Creates examinations and 120+ mathematically consistent student scorecards and grade sheets
 */
const Exam = require('../../modules/examinations/exam.model');
const Result = require('../../modules/results/result.model');
const { DEMO_TAG, DEPARTMENTS } = require('./config');

async function seedExaminations(academicMap, studentProfiles) {
  console.log('[Examinations] Seeding institutional exams and 120+ student examination results...');

  const cseDept = academicMap.departments['CSE'];
  const cseCourse = academicMap.courses['CSE'];

  // 1. Create Examinations
  const exams = [];
  const examConfigs = [
    {
      name: `Mid-Term Assessment 1 (2025-2026) ${DEMO_TAG}`,
      examType: 'Mid-Term 1',
      academicYear: '2025-2026',
      semester: 4,
      venue: 'Main Examination Hall A',
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-22'),
      isPublished: true
    },
    {
      name: `Semester End Examination (2024-2025) ${DEMO_TAG}`,
      examType: 'Semester End',
      academicYear: '2024-2025',
      semester: 3,
      venue: 'Academic Auditorium Block C',
      startDate: new Date('2025-12-10'),
      endDate: new Date('2025-12-24'),
      isPublished: true
    }
  ];

  for (const cfg of examConfigs) {
    let ex = await Exam.findOne({ name: cfg.name });
    if (!ex) {
      ex = await Exam.create({
        ...cfg,
        department: cseDept._id,
        course: cseCourse._id
      });
    }
    exams.push(ex);
  }

  // 2. Seed Results for Students
  let resultsCount = 0;
  for (let sIdx = 0; sIdx < Math.min(studentProfiles.length, 60); sIdx++) {
    const student = studentProfiles[sIdx];
    const deptIdx = Math.floor(sIdx / 20);
    const deptCode = DEPARTMENTS[deptIdx].code;
    const subjects = academicMap.subjects[deptCode];
    if (!subjects || subjects.length === 0) continue;

    // Give each student 2-3 subject results
    for (let subIdx = 0; subIdx < Math.min(subjects.length, 2); subIdx++) {
      const subject = subjects[subIdx];
      const exam = exams[subIdx % exams.length];

      // Calculate realistic scores
      const baseScore = 55 + ((sIdx * 7 + subIdx * 11) % 40); // 55 to 94
      const internalMarks = Math.min(40, Math.round(baseScore * 0.4));
      const externalMarks = Math.min(60, baseScore - internalMarks);
      const totalMarks = internalMarks + externalMarks;

      let grade = 'B';
      if (totalMarks >= 90) grade = 'O';
      else if (totalMarks >= 80) grade = 'A+';
      else if (totalMarks >= 70) grade = 'A';
      else if (totalMarks >= 60) grade = 'B+';
      else if (totalMarks >= 50) grade = 'B';
      else if (totalMarks >= 40) grade = 'C';
      else grade = 'F';

      const status = totalMarks >= 40 ? 'passed' : 'failed';

      let res = await Result.findOne({ examination: exam._id, student: student._id, subject: subject._id });
      if (!res) {
        await Result.create({
          examination: exam._id,
          student: student._id,
          subject: subject._id,
          internalMarks,
          externalMarks,
          totalMarks,
          grade,
          status
        });
        resultsCount++;
      }
    }
  }

  console.log(`[Examinations] Successfully provisioned ${exams.length} examinations and ${resultsCount} student scorecards.`);
}

module.exports = { seedExaminations };

