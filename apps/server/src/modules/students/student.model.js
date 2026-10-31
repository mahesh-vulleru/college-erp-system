const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    rollNumber: {
      type: String,
      required: [true, 'Student roll number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    enrollmentNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    currentSemester: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 8
    },
    batchYear: {
      type: String,
      required: true,
      trim: true
    },
    guardianName: {
      type: String,
      trim: true
    },
    guardianPhone: {
      type: String,
      trim: true
    },
    bloodGroup: {
      type: String,
      trim: true
    },
    admissionStatus: {
      type: String,
      enum: ['enrolled', 'graduated', 'suspended', 'withdrawn'],
      default: 'enrolled'
    }
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

