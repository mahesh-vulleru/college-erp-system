const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course / Program name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Course code is required (e.g. BTECH-CSE)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    degreeType: {
      type: String,
      default: 'B.Tech',
      trim: true
    },
    durationSemesters: {
      type: Number,
      default: 8,
      min: 1,
      max: 10
    },
    totalCredits: {
      type: Number,
      default: 160
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;

