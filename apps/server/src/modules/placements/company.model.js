const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      unique: true
    },
    industry: {
      type: String,
      trim: true,
      default: 'Information Technology'
    },
    website: {
      type: String,
      trim: true
    },
    contactPerson: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true }
    },
    tier: {
      type: String,
      enum: ['Tier 1', 'Tier 2', 'Tier 3', 'Startup', 'PSU / Govt'],
      default: 'Tier 2'
    },
    headquarters: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted'],
      default: 'active'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Indexes
companySchema.index({ tier: 1, status: 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;

