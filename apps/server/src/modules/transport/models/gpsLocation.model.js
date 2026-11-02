const mongoose = require('mongoose');

const gpsLocationSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    speed: {
      type: Number,
      default: 0,
      min: 0
    },
    heading: {
      type: Number,
      default: 0,
      min: 0,
      max: 360
    },
    accuracy: {
      type: Number,
      default: 5
    },
    isOnline: {
      type: Boolean,
      default: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true
  }
);

gpsLocationSchema.index({ bus: 1, timestamp: -1 });
gpsLocationSchema.index({ trip: 1, timestamp: -1 });

const GpsLocation = mongoose.model('GpsLocation', gpsLocationSchema);

module.exports = GpsLocation;

