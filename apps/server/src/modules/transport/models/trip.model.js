const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    tripId: {
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
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    tripType: {
      type: String,
      enum: ['morning_pickup', 'evening_drop', 'special'],
      default: 'morning_pickup',
      required: true
    },
    tripDate: {
      type: Date,
      required: true
    },
    scheduledDeparture: {
      type: String,
      required: true,
      trim: true // e.g. "07:30"
    },
    scheduledArrival: {
      type: String,
      required: true,
      trim: true // e.g. "08:45"
    },
    actualDeparture: {
      type: Date
    },
    actualArrival: {
      type: Date
    },
    tripStatus: {
      type: String,
      enum: ['scheduled', 'started', 'in_progress', 'completed', 'delayed', 'cancelled'],
      default: 'scheduled'
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    delayReason: {
      type: String,
      trim: true
    },
    breakdownReport: {
      reportedAt: Date,
      description: String,
      emergencyBusRequested: Boolean
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

tripSchema.index({ tripDate: 1, bus: 1 });
tripSchema.index({ tripDate: 1, driver: 1 });
tripSchema.index({ tripStatus: 1, tripDate: 1 });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;

