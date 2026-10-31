const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true
    },
    isbn: {
      type: String,
      trim: true,
      sparse: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true
    },
    publisher: {
      type: String,
      required: [true, 'Publisher is required'],
      trim: true
    },
    edition: {
      type: String,
      trim: true,
      default: '1st Edition'
    },
    yearPublished: {
      type: Number
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCategory',
      required: [true, 'Category reference is required']
    },
    department: {
      type: String,
      trim: true
    },
    totalCopies: {
      type: Number,
      default: 0,
      min: 0
    },
    availableCopies: {
      type: Number,
      default: 0,
      min: 0
    },
    issuedCopies: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedCopies: {
      type: Number,
      default: 0,
      min: 0
    },
    rackNumber: {
      type: String,
      trim: true,
      default: 'General Stack'
    },
    callNumber: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

bookSchema.index({ title: 'text', author: 'text', publisher: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);

