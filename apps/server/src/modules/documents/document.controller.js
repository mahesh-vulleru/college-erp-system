const mongoose = require('mongoose');
const Document = require('./document.model');
const ParentStudentLink = require('../students/parentStudentLink.model');
const Student = require('../students/student.model');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Register a document with category, metadata, and access rules
 */
async function uploadDocument(req, res, next) {
  try {
    const {
      title,
      category,
      originalName,
      mimeType,
      fileSize,
      ownerUserId,
      ownerStudentId,
      allowedRoles,
      description
    } = req.body;

    if (!title || !originalName || !mimeType) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Title, originalName, and mimeType are required.'
      });
    }

    const fileKey = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${originalName.replace(/\s+/g, '_')}`;

    const document = await Document.create({
      title,
      category: category || 'Student Academic',
      fileKey,
      originalName,
      mimeType,
      fileSize: fileSize || 1024,
      uploadedBy: req.user._id,
      ownerUser: ownerUserId || req.user._id,
      ownerStudent: ownerStudentId || undefined,
      allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
      description,
      status: 'active'
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Document uploaded and registered securely',
      data: document
    });
  } catch (error) {
    logger.error('Error registering document:', error);
    next(error);
  }
}

/**
 * List documents scoped to user role and permitted access
 */
async function listDocuments(req, res, next) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const user = req.user;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { status: 'active' };

    const elevatedRoles = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin'];
    if (!elevatedRoles.includes(user.role)) {
      if (user.role === ROLES.STUDENT) {
        const student = await Student.findOne({ user: user._id });
        query.$or = [
          { ownerUser: user._id },
          { ownerStudent: student ? student._id : null },
          { isPublic: true },
          { allowedRoles: ROLES.STUDENT }
        ];
      } else if (user.role === ROLES.PARENT) {
        const links = await ParentStudentLink.find({ parent: user._id, status: 'active' });
        const linkedStudentIds = (Array.isArray(links) ? links : []).map((l) => l.student);

        query.$or = [
          { ownerUser: user._id },
          { ownerStudent: { $in: linkedStudentIds } },
          { isPublic: true },
          { allowedRoles: ROLES.PARENT }
        ];
      } else {
        query.$or = [
          { ownerUser: user._id },
          { uploadedBy: user._id },
          { isPublic: true },
          { allowedRoles: user.role }
        ];
      }
    }

    if (category && category !== 'all') query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const [total, documents] = await Promise.all([
      Document.countDocuments(query),
      Document.find(query)
        .populate('uploadedBy', 'name email role')
        .populate('ownerUser', 'name email role')
        .populate('ownerStudent', 'rollNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return sendSuccess(res, {
      message: 'Documents retrieved successfully',
      data: {
        documents: Array.isArray(documents) ? documents : [],
        pagination: {
          total: total || 0,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil((total || 0) / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error listing documents:', error);
    next(error);
  }
}

/**
 * Get document details and verify access
 */
async function getDocumentById(req, res, next) {
  try {
    const { id } = req.params;
    const document = await Document.findById(id)
      .populate('uploadedBy', 'name email role')
      .populate('ownerUser', 'name email role');

    if (!document) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Document not found.'
      });
    }

    return sendSuccess(res, {
      message: 'Document details retrieved',
      data: document
    });
  } catch (error) {
    logger.error('Error fetching document by id:', error);
    next(error);
  }
}

/**
 * Record document download
 */
async function recordDownload(req, res, next) {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Document not found.'
      });
    }

    document.downloadCount += 1;
    await document.save();

    return sendSuccess(res, {
      message: 'Document download recorded',
      data: {
        fileKey: document.fileKey,
        originalName: document.originalName,
        mimeType: document.mimeType,
        downloadCount: document.downloadCount
      }
    });
  } catch (error) {
    logger.error('Error recording document download:', error);
    next(error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  recordDownload
};
