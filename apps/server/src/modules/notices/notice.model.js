const mongoose = require('mongoose');

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
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;

