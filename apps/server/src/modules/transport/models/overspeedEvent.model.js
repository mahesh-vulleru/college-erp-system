const mongoose = require('mongoose');

const overspeedEventSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    busRegistrationNumber: {
      type: String,
      trim: true
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    driverName: {
      type: String,
      trim: true
    },
    speed: {
      type: Number,
      required: true
    },
    speedLimit: {
      type: Number,
      required: true
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, trim: true }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['New', 'Acknowledged', 'Dismissed', 'Warning Issued'],
      default: 'New'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

overspeedEventSchema.index({ bus: 1, timestamp: -1 });
overspeedEventSchema.index({ status: 1, timestamp: -1 });

const OverspeedEvent = mongoose.model('OverspeedEvent', overspeedEventSchema);

module.exports = OverspeedEvent;

