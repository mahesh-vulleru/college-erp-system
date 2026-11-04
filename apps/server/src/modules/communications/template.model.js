const mongoose = require('mongoose');

const communicationTemplateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Template code is required (e.g. TPL-FEE-REMINDER-01)'],
      trim: true,
      uppercase: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms'],
      default: 'in_app',
      required: true
    },
    category: {
      type: String,
      enum: [
        'fee_reminder',
        'attendance_shortage',
        'examination_alert',
        'result_announcement',
        'general_circular',
        'emergency_alert',
        'placement_drive'
      ],
      required: [true, 'Template category is required']
    },
    subjectTemplate: {
      type: String,
      trim: true,
      default: ''
    },
    bodyTemplate: {
      type: String,
      required: [true, 'Body template text with placeholders is required'],
      trim: true
    },
    allowedVariables: [
      {
        type: String,
        trim: true
      }
    ],
    targetRoles: [
      {
        type: String,
        trim: true
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

// Indexes
communicationTemplateSchema.index({ category: 1, channel: 1 });
communicationTemplateSchema.index({ isActive: 1 });

/**
 * Helper to render template with supplied key-value parameters
 * Replaces {{variableName}} with params[variableName]
 */
communicationTemplateSchema.methods.render = function (params = {}) {
  let renderedSubject = this.subjectTemplate || '';
  let renderedBody = this.bodyTemplate || '';

  Object.entries(params).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const stringVal = value !== undefined && value !== null ? String(value) : '';
    renderedSubject = renderedSubject.replace(regex, stringVal);
    renderedBody = renderedBody.replace(regex, stringVal);
  });

  return {
    subject: renderedSubject,
    body: renderedBody
  };
};

const CommunicationTemplate = mongoose.model(
  'CommunicationTemplate',
  communicationTemplateSchema
);

module.exports = CommunicationTemplate;

