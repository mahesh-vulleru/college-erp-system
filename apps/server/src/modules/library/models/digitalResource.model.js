const mongoose = require('mongoose');

const digitalResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true
    },
    resourceType: {
      type: String,
      enum: ['ebook', 'journal', 'research_paper', 'conference_proceeding', 'video_lecture'],
      default: 'ebook'
    },
    author: {
      type: String,
      required: [true, 'Author or contributor is required'],
      trim: true
    },
    publisher: {
      type: String,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCategory'
    },
    department: {
      type: String,
      trim: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or resource link is required'],
      trim: true
    },
    fileSizeMb: {
      type: Number,
      default: 0
    },
    accessLevel: {
      type: String,
      enum: ['open', 'members_only', 'faculty_only'],
      default: 'members_only'
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DigitalResource', digitalResourceSchema);

