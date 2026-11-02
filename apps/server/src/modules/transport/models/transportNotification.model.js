const mongoose = require('mongoose');

const transportNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientRole: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Trip', 'Student', 'Safety', 'Financial', 'General']
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

transportNotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const TransportNotification = mongoose.model('TransportNotification', transportNotificationSchema);

module.exports = TransportNotification;

