const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Subject code is required (e.g. CS301)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    semester: {
      type: Number,
      required: [true, 'Semester number is required (1-8)'],
      min: 1,
      max: 8
    },
    credits: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
      max: 6
    },
    isLab: {
      type: Boolean,
      default: false
    },
    syllabusUrl: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;

