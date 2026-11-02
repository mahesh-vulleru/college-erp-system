const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema(
  {
    fuelRecordId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    busRegistrationNumber: {
      type: String,
      trim: true
    },
    fuelType: {
      type: String,
      enum: ['diesel', 'cng', 'electric', 'petrol'],
      default: 'diesel',
      required: true
    },
    fuelStation: {
      type: String,
      required: true,
      trim: true
    },
    fuelDate: {
      type: Date,
      required: true
    },
    fuelQuantity: {
      type: Number,
      required: true,
      min: 0.1
    },
    pricePerLitre: {
      type: Number,
      required: true,
      min: 0
    },
    totalFuelCost: {
      type: Number,
      required: true,
      min: 0
    },
    odometerReading: {
      type: Number,
      required: true,
      min: 0
    },
    previousOdometerReading: {
      type: Number,
      min: 0,
      default: 0
    },
    distanceTravelled: {
      type: Number,
      min: 0,
      default: 0
    },
    mileage: {
      type: Number,
      min: 0,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Fuel Card', 'Bank Transfer', 'Corporate Account', 'UPI'],
      default: 'Fuel Card'
    },
    invoiceNumber: {
      type: String,
      trim: true
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

fuelRecordSchema.index({ bus: 1, fuelDate: -1 });

const FuelRecord = mongoose.model('FuelRecord', fuelRecordSchema);

module.exports = FuelRecord;

