const Institution = require('./institution.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * GET /api/v1/institution/profile
 * Retrieve institutional profile. Accessible by all authenticated roles.
 */
async function getProfile(req, res, next) {
  try {
    const institution = await Institution.getSingleton();
    return sendSuccess(res, {
      message: 'Institutional profile retrieved successfully',
      data: institution
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/institution/profile
 * Update institutional profile. Strictly authorized for Super Admin.
 */
async function updateProfile(req, res, next) {
  try {
    const {
      name,
      code,
      establishedYear,
      tagline,
      institutionType,
      logoUrl,
      address,
      contact,
      affiliation,
      accreditation,
      targetStudentCapacity,
      currentAcademicYear,
      activeSemesterTerm
    } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Institution/College name is required'
      });
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Institution code is required'
      });
    }

    if (contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email.trim())) {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          code: 'VALIDATION_ERROR',
          message: 'Invalid official contact email format'
        });
      }
    }

    if (contact?.website) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
      if (!urlRegex.test(contact.website.trim())) {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          code: 'VALIDATION_ERROR',
          message: 'Invalid official website URL format'
        });
      }
    }

    // 2. Fetch or create singleton
    let institution = await Institution.getSingleton();

    // 3. Update fields
    institution.name = name.trim();
    institution.code = code.trim().toUpperCase();

    if (establishedYear !== undefined) {
      institution.establishedYear = Number(establishedYear);
    }
    if (tagline !== undefined) {
      institution.tagline = String(tagline).trim();
    }
    if (institutionType !== undefined) {
      institution.institutionType = String(institutionType).trim();
    }
    if (logoUrl !== undefined) {
      institution.logoUrl = String(logoUrl).trim();
    }

    if (address && typeof address === 'object') {
      institution.address = {
        line1: address.line1 !== undefined ? String(address.line1).trim() : institution.address.line1,
        line2: address.line2 !== undefined ? String(address.line2).trim() : institution.address.line2,
        city: address.city !== undefined ? String(address.city).trim() : institution.address.city,
        state: address.state !== undefined ? String(address.state).trim() : institution.address.state,
        postalCode: address.postalCode !== undefined ? String(address.postalCode).trim() : institution.address.postalCode,
        country: address.country !== undefined ? String(address.country).trim() : institution.address.country
      };
    }

    if (contact && typeof contact === 'object') {
      institution.contact = {
        email: contact.email !== undefined ? String(contact.email).trim().toLowerCase() : institution.contact.email,
        phone: contact.phone !== undefined ? String(contact.phone).trim() : institution.contact.phone,
        emergencyPhone: contact.emergencyPhone !== undefined ? String(contact.emergencyPhone).trim() : institution.contact.emergencyPhone,
        website: contact.website !== undefined ? String(contact.website).trim() : institution.contact.website
      };
    }

    if (affiliation && typeof affiliation === 'object') {
      institution.affiliation = {
        university: affiliation.university !== undefined ? String(affiliation.university).trim() : institution.affiliation.university,
        approvalBody: affiliation.approvalBody !== undefined ? String(affiliation.approvalBody).trim() : institution.affiliation.approvalBody,
        aicteApprovalNumber: affiliation.aicteApprovalNumber !== undefined ? String(affiliation.aicteApprovalNumber).trim() : institution.affiliation.aicteApprovalNumber,
        ugcStatus: affiliation.ugcStatus !== undefined ? String(affiliation.ugcStatus).trim() : institution.affiliation.ugcStatus,
        autonomousStatus: affiliation.autonomousStatus !== undefined ? String(affiliation.autonomousStatus).trim() : institution.affiliation.autonomousStatus
      };
    }

    if (accreditation && typeof accreditation === 'object') {
      institution.accreditation = {
        naacGrade: accreditation.naacGrade !== undefined ? String(accreditation.naacGrade).trim() : institution.accreditation.naacGrade,
        naacCgpa: accreditation.naacCgpa !== undefined ? String(accreditation.naacCgpa).trim() : institution.accreditation.naacCgpa,
        naacValidUntil: accreditation.naacValidUntil !== undefined ? String(accreditation.naacValidUntil).trim() : institution.accreditation.naacValidUntil,
        nbaStatus: accreditation.nbaStatus !== undefined ? String(accreditation.nbaStatus).trim() : institution.accreditation.nbaStatus,
        nirfRankBand: accreditation.nirfRankBand !== undefined ? String(accreditation.nirfRankBand).trim() : institution.accreditation.nirfRankBand
      };
    }

    if (targetStudentCapacity !== undefined) {
      institution.targetStudentCapacity = Number(targetStudentCapacity);
    }
    if (currentAcademicYear !== undefined) {
      institution.currentAcademicYear = String(currentAcademicYear).trim();
    }
    if (activeSemesterTerm !== undefined) {
      institution.activeSemesterTerm = String(activeSemesterTerm).trim();
    }

    institution.updatedBy = req.user?.id || req.user?._id;

    await institution.save();

    // Audit Log
    try {
      if (typeof recordAuditLog === 'function') {
        await recordAuditLog({
          actor: req.user?.id || req.user?._id,
          action: 'INSTITUTION_PROFILE_UPDATE',
          targetModel: 'Institution',
          targetId: institution._id,
          details: { name: institution.name, code: institution.code },
          ipAddress: req.ip || req.connection?.remoteAddress
        });
      }
    } catch {
      // Non-blocking audit logger
    }

    return sendSuccess(res, {
      message: 'Institutional profile updated successfully',
      data: institution
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/institution/logo
 * Update college logo. Strictly authorized for Super Admin.
 */
async function uploadLogo(req, res, next) {
  try {
    const { logoUrl } = req.body;

    if (!logoUrl || typeof logoUrl !== 'string') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Valid logo data or image URL is required'
      });
    }

    // Limit maximum size for base64 / URL strings to ~3MB
    if (logoUrl.length > 4000000) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Logo payload exceeds maximum allowed size (2MB)'
      });
    }

    let institution = await Institution.getSingleton();
    institution.logoUrl = logoUrl;
    institution.updatedBy = req.user?.id || req.user?._id;
    await institution.save();

    return sendSuccess(res, {
      message: 'College logo updated successfully',
      data: institution
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadLogo
};
