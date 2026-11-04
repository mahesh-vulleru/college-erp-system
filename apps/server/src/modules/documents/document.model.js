const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Student Academic',
        'Staff Document',
        'Identity & Verification',
        'Certificate',
        'Institutional Policy',
        'Fee Receipt',
        'Transport Document',
        'Other'
      ],
      default: 'Student Academic'
    },
    fileKey: {
      type: String,
      required: [true, 'Secure storage file key is required'],
      trim: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    ownerStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    },
    allowedRoles: {
      type: [String],
      default: []
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'pending_verification'],
      default: 'active'
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

