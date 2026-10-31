const mongoose = require('mongoose');

const bookCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    shelfLocation: {
      type: String,
      trim: true,
      default: 'Main Stacks'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BookCategory', bookCategorySchema);

