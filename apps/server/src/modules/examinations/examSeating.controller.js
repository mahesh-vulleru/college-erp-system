const mongoose = require('mongoose');
const ExamSeating = require('./examSeating.model');
const Examination = require('./exam.model');
const Student = require('../students/student.model');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Configure / generate examination seating plan
 * Validates capacity constraints and duplicate allocations
 * (Super Admin, Principal, HOD, Faculty)
 */
async function configureSeatingPlan(req, res, next) {
  try {
    const {
      examinationId,
      hallName,
      roomNumber,
      totalRows,
      seatsPerRow,
      studentIds,
      allocations: inputAllocations,
      invigilatorId,
      notes
    } = req.body;

    if (!examinationId || !hallName || !roomNumber || !totalRows || !seatsPerRow) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Examination, hall name, room number, total rows, and seats per row are required.'
      });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Examination session not found.'
      });
    }

    const rows = parseInt(totalRows, 10);
    const cols = parseInt(seatsPerRow, 10);
    const capacity = rows * cols;

    let finalAllocations = [];

    if (Array.isArray(inputAllocations) && inputAllocations.length > 0) {
      if (inputAllocations.length > capacity) {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: `Capacity Violation: Cannot allocate ${inputAllocations.length} students into hall with capacity of ${capacity} seats (${rows} rows x ${cols} columns).`
        });
      }

      const studentSet = new Set();
      const seatSet = new Set();

      for (const alloc of inputAllocations) {
        const sId = alloc.student?.toString();
        const seatSig = alloc.seatNumber || `R${alloc.row}C${alloc.column}`;

        if (studentSet.has(sId)) {
          return sendError(res, {
            statusCode: HTTP_STATUS.CONFLICT,
            message: `Duplicate Allocation: Student with roll number ${alloc.rollNumber} is allocated multiple times in this plan.`
          });
        }
        if (seatSet.has(seatSig)) {
          return sendError(res, {
            statusCode: HTTP_STATUS.CONFLICT,
            message: `Duplicate Seat: Seat ${seatSig} is assigned more than once.`
          });
        }
        studentSet.add(sId);
        seatSet.add(seatSig);
      }

      finalAllocations = inputAllocations;
    } else if (Array.isArray(studentIds) && studentIds.length > 0) {
      if (studentIds.length > capacity) {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: `Capacity Violation: Cannot allocate ${studentIds.length} students into hall with capacity of ${capacity} seats.`
        });
      }

      const students = await Student.find({ _id: { $in: studentIds } })
        .populate('user', 'name')
        .sort({ rollNumber: 1 });

      let studentIdx = 0;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          if (studentIdx >= students.length) break;
          const s = students[studentIdx];
          finalAllocations.push({
            student: s._id,
            rollNumber: s.rollNumber,
            studentName: s.user?.name || s.rollNumber,
            row: r,
            column: c,
            seatNumber: `R${r}-S${c}`
          });
          studentIdx++;
        }
      }
    }

    const allocatedStudentIds = finalAllocations.map((a) => a.student);
    const existingOtherHalls = await ExamSeating.find({
      examination: examinationId,
      roomNumber: { $ne: roomNumber },
      'allocations.student': { $in: allocatedStudentIds }
    }).select('hallName roomNumber allocations');

    if (existingOtherHalls && existingOtherHalls.length > 0) {
      for (const otherHall of existingOtherHalls) {
        const conflicting = otherHall.allocations.find((a) =>
          allocatedStudentIds.some((sId) => sId.toString() === a.student.toString())
        );
        if (conflicting) {
          return sendError(res, {
            statusCode: HTTP_STATUS.CONFLICT,
            message: `Cross-Hall Conflict: Student ${conflicting.rollNumber} is already seated in ${otherHall.hallName} (${otherHall.roomNumber}) for this examination.`
          });
        }
      }
    }

    let seatingPlan = await ExamSeating.findOne({
      examination: examinationId,
      roomNumber
    });

    if (seatingPlan) {
      seatingPlan.hallName = hallName;
      seatingPlan.totalRows = rows;
      seatingPlan.seatsPerRow = cols;
      seatingPlan.capacity = capacity;
      seatingPlan.allocations = finalAllocations;
      if (invigilatorId) seatingPlan.invigilator = invigilatorId;
      if (notes !== undefined) seatingPlan.notes = notes;
      await seatingPlan.save();
    } else {
      seatingPlan = await ExamSeating.create({
        examination: examinationId,
        hallName,
        roomNumber,
        totalRows: rows,
        seatsPerRow: cols,
        capacity,
        allocations: finalAllocations,
        invigilator: invigilatorId,
        notes
      });
    }

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Examination seating plan configured and saved successfully',
      data: seatingPlan
    });
  } catch (error) {
    logger.error('Error configuring seating plan:', error);
    next(error);
  }
}

/**
 * Get seating plans for an examination
 */
async function getExamSeatingPlans(req, res, next) {
  try {
    const { examinationId } = req.params;
    const plans = await ExamSeating.find({ examination: examinationId })
      .populate('invigilator', 'designation')
      .populate('examination', 'name examType academicYear semester startDate endDate')
      .lean();

    return sendSuccess(res, {
      message: 'Examination seating plans retrieved',
      data: plans
    });
  } catch (error) {
    logger.error('Error fetching exam seating plans:', error);
    next(error);
  }
}

/**
 * Get a student's assigned seating for all upcoming / recent examinations
 */
async function getStudentExamSeating(req, res, next) {
  try {
    const { studentId } = req.params;
    let sId = studentId;

    if (studentId === 'me' || req.user.role === ROLES.STUDENT) {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student record not found.'
        });
      }
      sId = student._id;
    }

    const plans = await ExamSeating.find({
      'allocations.student': sId
    })
      .populate('examination', 'name examType academicYear semester startDate endDate')
      .lean();

    const studentSeating = (Array.isArray(plans) ? plans : []).map((plan) => {
      const mySeat = plan.allocations.find((a) => a.student && a.student.toString() === sId.toString());
      return {
        seatingPlanId: plan._id,
        examination: plan.examination,
        hallName: plan.hallName,
        roomNumber: plan.roomNumber,
        row: mySeat?.row,
        column: mySeat?.column,
        seatNumber: mySeat?.seatNumber,
        rollNumber: mySeat?.rollNumber
      };
    });

    return sendSuccess(res, {
      message: 'Student examination seating details retrieved',
      data: studentSeating
    });
  } catch (error) {
    logger.error('Error fetching student seating:', error);
    next(error);
  }
}

module.exports = {
  configureSeatingPlan,
  getExamSeatingPlans,
  getStudentExamSeating
};
