const mongoose = require('mongoose');

const ticketCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      required: true
    },
    comment: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Ticket subject / title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Academic',
        'Examination',
        'Fee & Accounts',
        'Library',
        'Transport & Fleet',
        'Hostel & Mess',
        'Infrastructure & Facilities',
        'IT & Technical Support',
        'Harassment & Grievance Cell',
        'General'
      ],
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    submittedByRole: {
      type: String,
      required: true
    },
    assignedDepartment: {
      type: String,
      trim: true,
      default: 'General Administration'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: [ticketCommentSchema],
    resolutionNotes: {
      type: String,
      trim: true
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Auto-generate ticketNumber before validation if not present
ticketSchema.pre('validate', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('HelpdeskTicket').countDocuments();
    const year = new Date().getFullYear();
    this.ticketNumber = `TKT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const HelpdeskTicket = mongoose.model('HelpdeskTicket', ticketSchema);

module.exports = HelpdeskTicket;

