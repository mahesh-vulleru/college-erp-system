const mongoose = require('mongoose');
const Result = require('./result.model');
const Examination = require('../examinations/exam.model');
const Student = require('../students/student.model');
const Department = require('../departments/department.model');
const Attendance = require('../attendance/attendance.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

async function getResults(req, res, next) {
  try {
    const query = {};
    if (req.query.examination) query.examination = req.query.examination;
    if (req.query.student) query.student = req.query.student;
    if (req.query.subject) query.subject = req.query.subject;

    // Security invariant: Students can ONLY query their own results AND only for published exams!
    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = profile._id;

      // Find published and active exams only
      const publishedExams = await Examination.find({
        isPublished: true,
        status: { $ne: 'cancelled' }
      }).select('_id');
      const publishedExamIds = publishedExams.map((e) => e._id);
      query.examination = { $in: publishedExamIds };
    } else if (req.user && req.user.role === ROLES.HOD) {
      let hodDept = null;
      if (req.user.department) {
        hodDept = await Department.findOne({
          $or: [{ name: req.user.department }, { hod: req.user._id }]
        });
      } else {
        hodDept = await Department.findOne({ hod: req.user._id });
      }

      if (hodDept) {
        if (!req.query.student) {
          const deptStudents = await Student.find({ department: hodDept._id }).select('_id');
          const deptStudentIds = deptStudents.map((s) => s._id);
          query.student = { $in: deptStudentIds };
        }
        if (!req.query.examination) {
          const deptExams = await Examination.find({ department: hodDept._id }).select('_id');
          if (deptExams.length > 0) {
            const deptExamIds = deptExams.map((e) => e._id);
            query.examination = { $in: deptExamIds };
          }
        }
      }
    }

    const results = await Result.find(query)
      .populate('examination', 'name examType academicYear semester isPublished status')
      .populate('subject', 'name code credits isLab')
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber batchYear currentSemester',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: 'Examination results retrieved successfully',
      data: results,
      meta: { count: results.length }
    });
  } catch (error) {
    next(error);
  }
}

async function recordResult(req, res, next) {
  try {
    const { examination, student, subject, internalMarks = 0, externalMarks = 0, status: submittedStatus } = req.body;

    const examDoc = await Examination.findById(examination);
    if (!examDoc) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'EXAM_NOT_FOUND'
      });
    }

    if (examDoc.status === 'cancelled') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Cannot record marks for a cancelled examination',
        code: 'EXAM_CANCELLED'
      });
    }

    const numInternal = Number(internalMarks);
    const numExternal = Number(externalMarks);

    // Enforce strict marks boundary checks: Reject negative marks and marks exceeding maximums
    if (numInternal < 0 || numInternal > 40) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Internal marks must be between 0 and 40',
        code: 'MARKS_OUT_OF_BOUNDS'
      });
    }

    if (numExternal < 0 || numExternal > 60) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'External marks must be between 0 and 60',
        code: 'MARKS_OUT_OF_BOUNDS'
      });
    }

    const totalMarks = numInternal + numExternal;

    let grade = 'F';
    let status = 'failed';
    if (totalMarks >= 90) { grade = 'O'; status = 'passed'; }
    else if (totalMarks >= 80) { grade = 'A+'; status = 'passed'; }
    else if (totalMarks >= 70) { grade = 'A'; status = 'passed'; }
    else if (totalMarks >= 60) { grade = 'B+'; status = 'passed'; }
    else if (totalMarks >= 50) { grade = 'B'; status = 'passed'; }
    else if (totalMarks >= 40) { grade = 'C'; status = 'passed'; }

    if (submittedStatus === 'absent' || submittedStatus === 'withheld') {
      status = submittedStatus;
      grade = submittedStatus === 'absent' ? 'AB' : 'F';
    }

    const result = await Result.findOneAndUpdate(
      { examination, student, subject },
      { internalMarks: numInternal, externalMarks: numExternal, totalMarks, grade, status },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('examination', 'name examType academicYear')
      .populate('subject', 'name code credits')
      .populate({
        path: 'student',
        select: 'rollNumber',
        populate: { path: 'user', select: 'name' }
      });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Marks entered and grade computed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function batchRecordResults(req, res, next) {
  try {
    const { examination, subject, records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Records array is required for batch marks entry',
        code: 'INVALID_PAYLOAD'
      });
    }

    const examDoc = await Examination.findById(examination);
    if (!examDoc) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination not found',
        code: 'EXAM_NOT_FOUND'
      });
    }

    if (examDoc.status === 'cancelled') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Cannot record marks for a cancelled examination',
        code: 'EXAM_CANCELLED'
      });
    }

    const operations = [];
    for (const rec of records) {
      const numInternal = Number(rec.internalMarks || 0);
      const numExternal = Number(rec.externalMarks || 0);

      if (numInternal < 0 || numInternal > 40 || numExternal < 0 || numExternal > 60) {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: `Marks out of bounds for student ${rec.studentId}: Internal 0-40, External 0-60`,
          code: 'MARKS_OUT_OF_BOUNDS'
        });
      }

      const totalMarks = numInternal + numExternal;
      let grade = 'F';
      let status = 'failed';
      if (totalMarks >= 90) { grade = 'O'; status = 'passed'; }
      else if (totalMarks >= 80) { grade = 'A+'; status = 'passed'; }
      else if (totalMarks >= 70) { grade = 'A'; status = 'passed'; }
      else if (totalMarks >= 60) { grade = 'B+'; status = 'passed'; }
      else if (totalMarks >= 50) { grade = 'B'; status = 'passed'; }
      else if (totalMarks >= 40) { grade = 'C'; status = 'passed'; }

      operations.push({
        updateOne: {
          filter: { examination, subject, student: rec.studentId },
          update: {
            $set: {
              internalMarks: numInternal,
              externalMarks: numExternal,
              totalMarks,
              grade,
              status
            }
          },
          upsert: true
        }
      });
    }

    const result = await Result.bulkWrite(operations);

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Batch marks entry completed successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getResults,
  recordResult,
  batchRecordResults,
  getAcademicInsights
};

/**
 * GET /api/v1/results/academic-insights
 * Explainable statistical academic risk scoring & pass probability (no false AI/ML claims)
 */
async function getAcademicInsights(req, res, next) {
  try {
    const studentQuery = {};

    // Scoping based on role
    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked to user account',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      studentQuery._id = profile._id;
    } else if (req.user.role === ROLES.HOD) {
      let hodDept = null;
      if (req.user.department) {
        hodDept = await Department.findOne({
          $or: [{ name: req.user.department }, { hod: req.user._id }]
        });
      } else {
        hodDept = await Department.findOne({ hod: req.user._id });
      }
      if (hodDept) {
        studentQuery.department = hodDept._id;
      }
    } else if (req.query.department) {
      if (mongoose.Types.ObjectId.isValid(req.query.department)) {
        studentQuery.department = req.query.department;
      }
    }

    if (req.query.semester) {
      const sem = parseInt(req.query.semester, 10);
      if (!isNaN(sem)) studentQuery.currentSemester = sem;
    }

    const students = await Student.find(studentQuery)
      .populate('user', 'name email')
      .populate('department', 'name code')
      .limit(100);

    const insights = await Promise.all(
      students.map(async (student) => {
        // 1. Attendance Metrics
        const [totalSessions, presentSessions] = await Promise.all([
          Attendance.countDocuments({ student: student._id }),
          Attendance.countDocuments({ student: student._id, status: 'present' })
        ]);

        const attendancePct = totalSessions > 0
          ? Math.round((presentSessions / totalSessions) * 100)
          : 85; // default benchmark if not marked yet

        // 2. Academic Performance & Backlog Metrics
        const studentResults = await Result.find({ student: student._id });
        let totalMarksSum = 0;
        let evaluatedCount = 0;
        let backlogCount = 0;

        studentResults.forEach((r) => {
          if (r.totalMarks !== undefined && r.totalMarks !== null) {
            totalMarksSum += r.totalMarks;
            evaluatedCount++;
            if (r.totalMarks < 40 || r.status === 'fail') {
              backlogCount++;
            }
          }
        });

        const marksPct = evaluatedCount > 0
          ? Math.round(totalMarksSum / evaluatedCount)
          : 70; // baseline

        // 3. Statistical Risk Calculation Formula (Explainable, deterministic)
        // Risk Score (0 - 100): Weighted combination of attendance deficit, marks deficit, and backlogs
        const attendanceDeficit = Math.max(0, 75 - attendancePct);
        const marksDeficit = Math.max(0, 50 - marksPct);
        const calculatedRiskScore = Math.min(
          100,
          Math.round((attendanceDeficit * 1.5) + (marksDeficit * 1.2) + (backlogCount * 12))
        );

        // Pass Probability Formula (5% to 98%)
        const calculatedPassProbability = Math.max(
          5,
          Math.min(98, Math.round((marksPct * 0.65) + (attendancePct * 0.35) - (backlogCount * 5)))
        );

        let riskLevel = 'low';
        if (calculatedRiskScore >= 40 || attendancePct < 65 || backlogCount >= 2) {
          riskLevel = 'high';
        } else if (calculatedRiskScore >= 20 || attendancePct < 75 || backlogCount === 1) {
          riskLevel = 'moderate';
        }

        // Explainable Factors List
        const riskFactors = [];
        if (attendancePct < 75) {
          riskFactors.push(`Attendance below statutory 75% threshold (${attendancePct}%)`);
        }
        if (marksPct < 45) {
          riskFactors.push(`Internal assessment average below 45% (${marksPct}/100)`);
        }
        if (backlogCount > 0) {
          riskFactors.push(`${backlogCount} active subject backlog(s) recorded`);
        }
        if (riskFactors.length === 0) {
          riskFactors.push('Academic indicators meet normal progression benchmarks');
        }

        // Recommended Intervention
        let recommendedAction = 'Continue standard academic monitoring';
        if (riskLevel === 'high') {
          recommendedAction = 'Mandatory remedial tutorial and faculty mentor counseling';
        } else if (riskLevel === 'moderate') {
          recommendedAction = 'Attendance recovery notification and revision assignment';
        }

        return {
          studentId: student._id,
          rollNumber: student.rollNumber,
          name: student.user?.name || 'Student',
          email: student.user?.email,
          department: student.department?.name,
          currentSemester: student.currentSemester,
          metrics: {
            attendancePercentage: attendancePct,
            totalSessionsAttended: presentSessions,
            totalSessionsConducted: totalSessions,
            averageInternalMarks: marksPct,
            activeBacklogs: backlogCount
          },
          intelligence: {
            methodology: 'Deterministic Statistical Risk Indicator (Rule-based explainable heuristic)',
            riskLevel,
            riskScore: calculatedRiskScore,
            passProbabilityPercent: calculatedPassProbability,
            explainableFactors: riskFactors,
            recommendedIntervention: recommendedAction
          }
        };
      })
    );

    // Summary counts
    const highRiskCount = insights.filter((i) => i.intelligence.riskLevel === 'high').length;
    const moderateRiskCount = insights.filter((i) => i.intelligence.riskLevel === 'moderate').length;
    const lowRiskCount = insights.filter((i) => i.intelligence.riskLevel === 'low').length;

    return sendSuccess(res, {
      message: 'Academic insights and risk evaluation generated successfully',
      data: {
        timestamp: new Date().toISOString(),
        summary: {
          totalAnalyzed: insights.length,
          highRiskCount,
          moderateRiskCount,
          lowRiskCount,
          averagePassProbability: insights.length > 0
            ? Math.round(insights.reduce((s, i) => s + i.intelligence.passProbabilityPercent, 0) / insights.length)
            : 80
        },
        students: insights
      }
    });
  } catch (error) {
    next(error);
  }
}
