const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      required: [true, 'Communication log tracking ID is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunicationTemplate',
      default: null
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required']
    },
    senderRole: {
      type: String,
      trim: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required']
    },
    recipientRole: {
      type: String,
      trim: true
    },
    channel: {
      type: String,
      enum: [
        'in_app',
        'email_simulated',
        'email_live',
        'sms_simulated',
        'sms_live'
      ],
      required: [true, 'Communication channel is required']
    },
    category: {
      type: String,
      trim: true,
      default: 'general'
    },
    subject: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Message content is required']
    },
    status: {
      type: String,
      enum: [
        'delivered_in_app',
        'simulated_local',
        'sent_live',
        'failed',
        'queued'
      ],
      required: true
    },
    metadata: {
      targetEmail: {
        type: String,
        trim: true
      },
      targetPhone: {
        type: String,
        trim: true
      },
      variablesUsed: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      deliveryNotes: {
        type: String,
        trim: true
      },
      externalMessageId: {
        type: String,
        trim: true
      }
    },
    dispatchedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
communicationLogSchema.index({ recipient: 1, dispatchedAt: -1 });
communicationLogSchema.index({ sender: 1, dispatchedAt: -1 });
communicationLogSchema.index({ channel: 1, status: 1 });
communicationLogSchema.index({ category: 1 });

const CommunicationLog = mongoose.model(
  'CommunicationLog',
  communicationLogSchema
);

module.exports = CommunicationLog;

