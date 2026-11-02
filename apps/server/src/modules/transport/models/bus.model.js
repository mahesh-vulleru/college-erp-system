const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      required: [true, 'Bus ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    busName: {
      type: String,
      required: [true, 'Bus name/number is required'],
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true,
      default: 'Tata Motors'
    },
    model: {
      type: String,
      trim: true,
      default: 'Starbus Ultra'
    },
    manufacturingYear: {
      type: Number,
      min: 2000,
      max: new Date().getFullYear() + 1
    },
    busType: {
      type: String,
      enum: ['standard', 'mini', 'deluxe', 'ac', 'non_ac'],
      default: 'standard'
    },
    fuelType: {
      type: String,
      enum: ['diesel', 'cng', 'electric', 'petrol'],
      default: 'diesel'
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Capacity must be at least 1 seat']
    },
    currentStatus: {
      type: String,
      enum: ['active', 'inactive', 'under_maintenance', 'out_of_service'],
      default: 'active'
    },
    insuranceNumber: {
      type: String,
      trim: true
    },
    insuranceExpiryDate: {
      type: Date
    },
    fitnessCertificateNumber: {
      type: String,
      trim: true
    },
    fitnessExpiryDate: {
      type: Date
    },
    pollutionCertificateExpiryDate: {
      type: Date
    },
    lastServiceDate: {
      type: Date
    },
    nextServiceDate: {
      type: Date
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
busSchema.index({ currentStatus: 1 });
busSchema.index({ assignedRoute: 1 });

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;

