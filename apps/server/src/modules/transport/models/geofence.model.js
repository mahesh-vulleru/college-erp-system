const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema(
  {
    geofenceId: {
      type: String,
      required: [true, 'Geofence ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Geofence name is required'],
      trim: true
    },
    geofenceType: {
      type: String,
      required: [true, 'Geofence type is required'],
      enum: ['Campus', 'Pickup/Drop Stop', 'Restricted Zone', 'High Risk Area', 'Depot'],
      default: 'Campus'
    },
    center: {
      latitude: {
        type: Number,
        required: [true, 'Center latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Center longitude is required']
      }
    },
    radiusMeters: {
      type: Number,
      required: true,
      default: 200,
      min: 10
    },
    speedLimitKmh: {
      type: Number,
      default: 40,
      min: 5,
      max: 120
    },
    associatedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    description: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

geofenceSchema.index({ status: 1 });
geofenceSchema.index({ geofenceType: 1 });

const Geofence = mongoose.model('Geofence', geofenceSchema);

module.exports = Geofence;

