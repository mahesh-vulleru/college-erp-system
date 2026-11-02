const mongoose = require('mongoose');

const geofenceEventSchema = new mongoose.Schema(
  {
    geofence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Geofence'
    },
    geofenceName: {
      type: String,
      trim: true
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
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    eventType: {
      type: String,
      required: true,
      enum: ['entry', 'exit', 'unexpected_stop', 'deviation']
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    speed: {
      type: Number,
      default: 0
    },
    details: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

geofenceEventSchema.index({ bus: 1, timestamp: -1 });
geofenceEventSchema.index({ eventType: 1, timestamp: -1 });

const GeofenceEvent = mongoose.model('GeofenceEvent', geofenceEventSchema);

module.exports = GeofenceEvent;

