const BookCategory = require('./category.model');
const Book = require('./book.model');
const BookCopy = require('./bookCopy.model');
const LibraryMember = require('./member.model');
const BookIssue = require('./issue.model');
const BookReservation = require('./reservation.model');
const LibraryFine = require('./fine.model');
const DigitalResource = require('./digitalResource.model');
const LibrarySetting = require('./setting.model');

module.exports = {
  BookCategory,
  Book,
  BookCopy,
  LibraryMember,
  BookIssue,
  BookReservation,
  LibraryFine,
  DigitalResource,
  LibrarySetting
};

