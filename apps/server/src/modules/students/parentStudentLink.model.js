const mongoose = require('mongoose');

const parentStudentLinkSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent user reference is required'],
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student profile reference is required'],
      index: true
    },
    relationship: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian', 'Other'],
      default: 'Guardian',
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_verification'],
      default: 'active',
      index: true
    },
    permissions: {
      canViewAcademics: { type: Boolean, default: true },
      canViewAttendance: { type: Boolean, default: true },
      canViewFees: { type: Boolean, default: true },
      canViewTransport: { type: Boolean, default: true }
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Compound unique index ensuring a parent cannot be linked twice to the same student
parentStudentLinkSchema.index({ parent: 1, student: 1 }, { unique: true });

const ParentStudentLink = mongoose.model('ParentStudentLink', parentStudentLinkSchema);

module.exports = ParentStudentLink;

