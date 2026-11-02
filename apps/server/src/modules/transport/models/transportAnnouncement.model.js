const mongoose = require('mongoose');
const { ALL_ROLES } = require('@college-erp/shared');

const transportAnnouncementSchema = new mongoose.Schema(
  {
    announcementId: {
      type: String,
      required: [true, 'Announcement ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Urgent'],
      default: 'Normal'
    },
    targetRoles: [
      {
        type: String,
        enum: ALL_ROLES
      }
    ],
    targetRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      }
    ],
    targetBuses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
      }
    ],
    publishDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByName: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

transportAnnouncementSchema.index({ isActive: 1, publishDate: -1 });

const TransportAnnouncement = mongoose.model('TransportAnnouncement', transportAnnouncementSchema);

module.exports = TransportAnnouncement;

