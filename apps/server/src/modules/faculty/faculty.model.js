const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    designation: {
      type: String,
      required: true,
      enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant'],
      default: 'Assistant Professor'
    },
    qualification: {
      type: String,
      trim: true
    },
    dateOfJoining: {
      type: Date,
      default: Date.now
    },
    specialization: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;

