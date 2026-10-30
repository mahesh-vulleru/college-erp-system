const mongoose = require('mongoose');

const evidenceDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    fileType: {
      type: String,
      trim: true,
      default: 'application/pdf'
    },
    fileSize: {
      type: Number, // in bytes
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationNotes: {
      type: String,
      trim: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    }
  },
  { _id: true }
);

const accreditationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Criterion code is required (e.g. NAAC-C1.1, NBA-C2)'],
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: [true, 'Criterion title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Criterion description is required'],
      trim: true
    },
    framework: {
      type: String,
      required: true,
      enum: ['NAAC', 'NBA', 'NIRF', 'ISO', 'UGC', 'AICTE'],
      default: 'NAAC'
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Curricular Aspects',
        'Teaching-Learning & Evaluation',
        'Research, Innovations & Extension',
        'Infrastructure & Learning Resources',
        'Student Support & Progression',
        'Governance, Leadership & Management',
        'Institutional Values & Best Practices',
        'Program Outcomes & Course Outcomes',
        'Facilities & Technical Support',
        'Continuous Improvement'
      ],
      default: 'Curricular Aspects'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // null indicates institution-wide criterion
    },
    assignedOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    weightage: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
      default: 100
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    status: {
      type: String,
      required: true,
      enum: ['not_started', 'in_progress', 'under_review', 'completed', 'overdue'],
      default: 'not_started'
    },
    compliancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    evidenceDocuments: [evidenceDocumentSchema],
    remarks: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes for fast searching and filtering
accreditationSchema.index({ framework: 1, category: 1 });
accreditationSchema.index({ status: 1, dueDate: 1 });
accreditationSchema.index({ department: 1, assignedOwner: 1 });

const Accreditation = mongoose.model('Accreditation', accreditationSchema);

module.exports = Accreditation;

