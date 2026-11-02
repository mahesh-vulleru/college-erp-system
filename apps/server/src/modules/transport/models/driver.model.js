const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    staffType: {
      type: String,
      enum: ['driver', 'attendant', 'supervisor', 'other'],
      default: 'driver'
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    drivingLicenceNumber: {
      type: String,
      required: [true, 'Driving licence number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    licenceType: {
      type: String,
      enum: ['heavy_transport', 'commercial', 'light_motor'],
      default: 'heavy_transport'
    },
    licenceExpiryDate: {
      type: Date,
      required: [true, 'Licence expiry date is required']
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'on_leave', 'inactive', 'terminated'],
      default: 'active'
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'on_duty', 'off_duty', 'sick_leave'],
      default: 'available'
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

driverSchema.index({ employmentStatus: 1 });
driverSchema.index({ availabilityStatus: 1 });
driverSchema.index({ staffType: 1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;

