const mongoose = require('mongoose');

const seatAllocationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    studentName: {
      type: String,
      trim: true
    },
    row: {
      type: Number,
      required: true
    },
    column: {
      type: Number,
      required: true
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const examSeatingSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: [true, 'Examination reference is required'],
      index: true
    },
    hallName: {
      type: String,
      required: [true, 'Examination hall name is required'],
      trim: true
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number / identifier is required'],
      trim: true
    },
    totalRows: {
      type: Number,
      required: true,
      min: 1
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    allocations: [seatAllocationSchema],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    invigilator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate hall naming within the same examination
examSeatingSchema.index({ examination: 1, roomNumber: 1 }, { unique: true });

const ExamSeating = mongoose.model('ExamSeating', examSeatingSchema);

module.exports = ExamSeating;

