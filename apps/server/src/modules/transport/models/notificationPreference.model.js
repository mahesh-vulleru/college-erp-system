const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    emailAlerts: {
      type: Boolean,
      default: true
    },
    smsAlerts: {
      type: Boolean,
      default: false
    },
    inAppAlerts: {
      type: Boolean,
      default: true
    },
    categories: {
      tripUpdates: { type: Boolean, default: true },
      studentUpdates: { type: Boolean, default: true },
      safetyAlerts: { type: Boolean, default: true },
      financialAlerts: { type: Boolean, default: true },
      generalAnnouncements: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

module.exports = NotificationPreference;

