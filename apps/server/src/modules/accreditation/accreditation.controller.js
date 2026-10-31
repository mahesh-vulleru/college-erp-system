const Accreditation = require('./accreditation.model');
const Department = require('../departments/department.model');
const User = require('../auth/auth.model');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * List Accreditation Criteria with Filters, Search, and Computed Compliance Metrics
 */
async function listCriteria(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Framework filter (e.g. NAAC, NBA)
    if (req.query.framework && req.query.framework !== 'all') {
      query.framework = req.query.framework.toUpperCase();
    }

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status.toLowerCase();
    }

    // Department filter
    if (req.query.department && req.query.department !== 'all') {
      if (req.query.department === 'institution_wide') {
        query.department = null;
      } else if (mongoose.Types.ObjectId.isValid(req.query.department)) {
        query.department = req.query.department;
      }
    }

    // Search by code, title, or description
    const search = req.query.search || req.query.q;
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ code: regex }, { title: regex }, { description: regex }];
    }

    // Fetch criteria and counts
    let allCriteria = [];
    try {
      allCriteria = await Accreditation.find(query)
        .populate('department', 'name code')
        .populate('assignedOwner', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ code: 1 })
        .lean();
    } catch (e) {
      allCriteria = [];
    }

    const now = new Date();

    // Check for dynamic overdue and calculate metrics
    let totalWeightage = 0;
    let earnedWeightage = 0;
    let completedCount = 0;
    let pendingVerificationCount = 0;
    let overdueCount = 0;

    const categoryMap = {};

    const updatedCriteria = allCriteria.map((crit) => {
      let isOverdue = false;
      let effectiveStatus = crit.status;

      if (crit.dueDate && new Date(crit.dueDate) < now && crit.status !== 'completed') {
        isOverdue = true;
        effectiveStatus = 'overdue';
      }

      const weight = crit.weightage || 100;
      const compPct = crit.compliancePercentage || (effectiveStatus === 'completed' ? 100 : 0);
      totalWeightage += weight;
      earnedWeightage += (weight * compPct) / 100;

      if (effectiveStatus === 'completed') completedCount += 1;
      if (effectiveStatus === 'overdue') overdueCount += 1;

      // Evidence documents check
      const docs = crit.evidenceDocuments || [];
      const hasPendingDoc = docs.some((d) => d.verificationStatus === 'pending');
      if (hasPendingDoc || effectiveStatus === 'under_review') {
        pendingVerificationCount += 1;
      }

      // Category breakdown
      const cat = crit.category || 'Curricular Aspects';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, total: 0, completed: 0, totalScore: 0 };
      }
      categoryMap[cat].total += 1;
      categoryMap[cat].totalScore += compPct;
      if (effectiveStatus === 'completed') categoryMap[cat].completed += 1;

      return {
        ...crit,
        id: crit._id,
        isOverdue,
        status: effectiveStatus
      };
    });

    const categoryProgress = Object.values(categoryMap).map((c) => ({
      category: c.category,
      total: c.total,
      completed: c.completed,
      percentage: c.total > 0 ? Math.round(c.totalScore / c.total) : 0
    }));

    const totalCriteria = updatedCriteria.length;
    const overallCompliancePercentage =
      totalWeightage > 0 ? Number(((earnedWeightage / totalWeightage) * 100).toFixed(1)) : 0;

    const summary = {
      totalCriteria,
      completedCriteria: completedCount,
      pendingVerification: pendingVerificationCount,
      overdueCriteria: overdueCount,
      overallCompliancePercentage,
      categoryProgress
    };

    // Paginate
    const paginatedItems = updatedCriteria.slice(skip, skip + limit);

    return sendSuccess(res, {
      message: 'Accreditation criteria retrieved successfully',
      data: {
        summary,
        criteria: paginatedItems,
        pagination: {
          page,
          limit,
          total: totalCriteria,
          totalPages: Math.ceil(totalCriteria / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * High-Level Accreditation Compliance Summary for Dashboard Widgets
 */
async function getCriteriaSummary(req, res, next) {
  try {
    const allCriteria = await Accreditation.find().lean();
    const now = new Date();

    let totalWeightage = 0;
    let earnedWeightage = 0;
    let completedCount = 0;
    let pendingVerificationCount = 0;
    let overdueCount = 0;

    const categoryMap = {};

    allCriteria.forEach((crit) => {
      let effectiveStatus = crit.status;
      if (crit.dueDate && new Date(crit.dueDate) < now && crit.status !== 'completed') {
        effectiveStatus = 'overdue';
      }

      const weight = crit.weightage || 100;
      const compPct = crit.compliancePercentage || (effectiveStatus === 'completed' ? 100 : 0);
      totalWeightage += weight;
      earnedWeightage += (weight * compPct) / 100;

      if (effectiveStatus === 'completed') completedCount += 1;
      if (effectiveStatus === 'overdue') overdueCount += 1;

      const docs = crit.evidenceDocuments || [];
      if (docs.some((d) => d.verificationStatus === 'pending') || effectiveStatus === 'under_review') {
        pendingVerificationCount += 1;
      }

      const cat = crit.category || 'General';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, total: 0, completed: 0, score: 0 };
      categoryMap[cat].total += 1;
      categoryMap[cat].score += compPct;
      if (effectiveStatus === 'completed') categoryMap[cat].completed += 1;
    });

    const categoryProgress = Object.values(categoryMap).map((c) => ({
      category: c.category,
      total: c.total,
      completed: c.completed,
      percentage: c.total > 0 ? Math.round(c.score / c.total) : 0
    }));

    const overallCompliancePercentage =
      totalWeightage > 0 ? Number(((earnedWeightage / totalWeightage) * 100).toFixed(1)) : 0;

    return sendSuccess(res, {
      message: 'Accreditation compliance summary retrieved',
      data: {
        totalCriteria: allCriteria.length,
        completedCriteria: completedCount,
        pendingVerification: pendingVerificationCount,
        overdueCriteria: overdueCount,
        overallCompliancePercentage,
        categoryProgress
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Criterion Details by ID
 */
async function getCriterionById(req, res, next) {
  try {
    const criterion = await Accreditation.findById(req.params.id)
      .populate('department', 'name code')
      .populate('assignedOwner', 'name email role')
      .populate('evidenceDocuments.uploadedBy', 'name email')
      .populate('evidenceDocuments.verifiedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!criterion) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Accreditation criterion not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: criterion });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Criterion (Principal / Super Admin / HOD)
 */
async function createCriterion(req, res, next) {
  try {
    const {
      code,
      title,
      description,
      framework,
      category,
      department,
      assignedOwner,
      weightage,
      dueDate,
      compliancePercentage,
      remarks
    } = req.body;

    const existing = await Accreditation.findOne({ code: code.toUpperCase() });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `Criterion with code '${code.toUpperCase()}' already exists`,
        code: 'DUPLICATE_CODE'
      });
    }

    const criterion = await Accreditation.create({
      code: code.toUpperCase(),
      title,
      description,
      framework: framework || 'NAAC',
      category: category || 'Curricular Aspects',
      department: department || null,
      assignedOwner,
      weightage: weightage !== undefined ? Number(weightage) : 100,
      dueDate: new Date(dueDate),
      compliancePercentage: compliancePercentage ? Number(compliancePercentage) : 0,
      remarks,
      createdBy: req.user._id
    });

    await recordAuditLog({
      req,
      action: 'ACCREDITATION_CRITERION_CREATED',
      entityType: 'Accreditation',
      entityId: criterion._id,
      details: { code: criterion.code, title: criterion.title, framework: criterion.framework }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Accreditation criterion registered successfully',
      data: criterion
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Criterion Details & Status
 */
async function updateCriterion(req, res, next) {
  try {
    const criterion = await Accreditation.findById(req.params.id);
    if (!criterion) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Accreditation criterion not found',
        code: 'NOT_FOUND'
      });
    }

    const {
      title,
      description,
      framework,
      category,
      department,
      assignedOwner,
      weightage,
      dueDate,
      status,
      compliancePercentage,
      remarks
    } = req.body;

    if (title) criterion.title = title;
    if (description) criterion.description = description;
    if (framework) criterion.framework = framework;
    if (category) criterion.category = category;
    if (department !== undefined) criterion.department = department || null;
    if (assignedOwner) criterion.assignedOwner = assignedOwner;
    if (weightage !== undefined) criterion.weightage = Number(weightage);
    if (dueDate) criterion.dueDate = new Date(dueDate);
    if (status) criterion.status = status;
    if (compliancePercentage !== undefined) criterion.compliancePercentage = Number(compliancePercentage);
    if (remarks !== undefined) criterion.remarks = remarks;

    await criterion.save();

    await recordAuditLog({
      req,
      action: 'ACCREDITATION_CRITERION_UPDATED',
      entityType: 'Accreditation',
      entityId: criterion._id,
      details: { code: criterion.code, status: criterion.status, compliancePercentage: criterion.compliancePercentage }
    });

    return sendSuccess(res, {
      message: 'Accreditation criterion updated successfully',
      data: criterion
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Criterion
 */
async function deleteCriterion(req, res, next) {
  try {
    const criterion = await Accreditation.findById(req.params.id);
    if (!criterion) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Accreditation criterion not found',
        code: 'NOT_FOUND'
      });
    }

    await Accreditation.findByIdAndDelete(req.params.id);

    await recordAuditLog({
      req,
      action: 'ACCREDITATION_CRITERION_DELETED',
      entityType: 'Accreditation',
      entityId: criterion._id,
      details: { code: criterion.code, title: criterion.title }
    });

    return sendSuccess(res, {
      message: 'Accreditation criterion removed successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Attach Evidence Document to Criterion
 */
async function addEvidenceDocument(req, res, next) {
  try {
    const { name, url, fileType, fileSize } = req.body;

    if (!name || !url) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Document name and access URL are required',
        code: 'INVALID_DOCUMENT_DATA'
      });
    }

    const criterion = await Accreditation.findById(req.params.id);
    if (!criterion) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Accreditation criterion not found',
        code: 'NOT_FOUND'
      });
    }

    criterion.evidenceDocuments.push({
      name,
      url,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || 0,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      verificationStatus: 'pending'
    });

    if (criterion.status === 'not_started') {
      criterion.status = 'in_progress';
    }

    await criterion.save();

    await recordAuditLog({
      req,
      action: 'EVIDENCE_DOCUMENT_ATTACHED',
      entityType: 'Accreditation',
      entityId: criterion._id,
      details: { documentName: name, criterionCode: criterion.code }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Supporting evidence document attached successfully',
      data: criterion
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify or Reject Evidence Document (Principal / Super Admin / Lead Evaluator)
 */
async function verifyEvidenceDocument(req, res, next) {
  try {
    const { verificationStatus, verificationNotes } = req.body;

    const criterion = await Accreditation.findById(req.params.id);
    if (!criterion) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Accreditation criterion not found',
        code: 'NOT_FOUND'
      });
    }

    const doc = criterion.evidenceDocuments.id(req.params.docId);
    if (!doc) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Evidence document not found on this criterion',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    doc.verificationStatus = verificationStatus;
    doc.verificationNotes = verificationNotes || '';
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();

    // Check if all evidence docs are verified
    const allVerified = criterion.evidenceDocuments.every((d) => d.verificationStatus === 'verified');
    if (allVerified && criterion.evidenceDocuments.length > 0) {
      criterion.compliancePercentage = 100;
      criterion.status = 'completed';
    } else if (verificationStatus === 'verified') {
      criterion.compliancePercentage = Math.min(
        100,
        Math.round(
          (criterion.evidenceDocuments.filter((d) => d.verificationStatus === 'verified').length /
            criterion.evidenceDocuments.length) *
            100
        )
      );
    }

    await criterion.save();

    await recordAuditLog({
      req,
      action: 'EVIDENCE_DOCUMENT_VERIFIED',
      entityType: 'Accreditation',
      entityId: criterion._id,
      details: {
        docId: doc._id,
        status: verificationStatus,
        criterionCode: criterion.code
      }
    });

    return sendSuccess(res, {
      message: `Evidence document marked as ${verificationStatus}`,
      data: criterion
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCriteria,
  getCriteriaSummary,
  getCriterionById,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  addEvidenceDocument,
  verifyEvidenceDocument
};

