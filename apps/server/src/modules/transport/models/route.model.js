const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    stopId: {
      type: String,
      required: [true, 'Stop ID is required'],
      trim: true
    },
    stopName: {
      type: String,
      required: [true, 'Stop name is required'],
      trim: true
    },
    stopAddress: {
      type: String,
      trim: true
    },
    stopSequence: {
      type: Number,
      required: [true, 'Stop sequence number is required'],
      min: 1
    },
    pickupTime: {
      type: String,
      required: [true, 'Pickup time is required'],
      trim: true
    },
    dropTime: {
      type: String,
      required: [true, 'Drop time is required'],
      trim: true
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  { _id: true }
);

const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      required: [true, 'Route ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true
    },
    routeCode: {
      type: String,
      required: [true, 'Route code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    startingPoint: {
      type: String,
      required: [true, 'Starting point is required'],
      trim: true
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
      default: 'Apex Engineering College Campus'
    },
    totalDistance: {
      type: Number,
      min: 0,
      default: 0
    },
    estimatedDuration: {
      type: String,
      trim: true,
      default: '45 mins'
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    routeStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    stops: [stopSchema],
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

routeSchema.index({ routeStatus: 1 });

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
