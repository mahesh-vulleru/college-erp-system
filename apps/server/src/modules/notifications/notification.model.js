const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null if broadcast to recipientRole
    },
    recipientRole: {
      type: String,
      trim: true,
      default: null // e.g. 'all', 'transport_admin', 'student', etc.
    },
    category: {
      type: String,
      required: true,
      enum: ['Safety', 'Emergency', 'Transport', 'Academic', 'Fee', 'Grievance', 'General', 'System', 'Event'],
      default: 'General'
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    link: {
      type: String,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
