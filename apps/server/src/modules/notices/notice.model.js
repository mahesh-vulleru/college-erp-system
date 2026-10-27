const mongoose = require('mongoose');

const noticeHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'published', 'archived'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'Academic', 'Examination', 'Fees', 'Holiday', 'Emergency', 'Placement'],
      default: 'General'
    },
    targetRoles: {
      type: [String],
      default: ['*']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'urgent'],
      default: 'normal'
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    publicationDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: null
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    history: [noticeHistorySchema]
  },
  { timestamps: true }
);

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
