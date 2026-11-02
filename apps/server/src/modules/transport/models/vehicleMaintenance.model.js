const mongoose = require('mongoose');

const vehicleMaintenanceSchema = new mongoose.Schema(
  {
    maintenanceId: {
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
    maintenanceType: {
      type: String,
      required: true,
      enum: [
        'Regular Service',
        'Engine Repair',
        'Tyre Replacement',
        'Brake Inspection',
        'Battery Replacement',
        'Electrical Repair',
        'Accident Repair',
        'Other Maintenance'
      ],
      default: 'Regular Service'
    },
    serviceDate: {
      type: Date,
      required: true
    },
    nextServiceDate: {
      type: Date
    },
    odometerReading: {
      type: Number,
      min: 0,
      default: 0
    },
    serviceProvider: {
      type: String,
      required: true,
      trim: true
    },
    serviceDescription: {
      type: String,
      required: true,
      trim: true
    },
    partsReplaced: {
      type: String,
      trim: true
    },
    labourCost: {
      type: Number,
      min: 0,
      default: 0
    },
    partsCost: {
      type: Number,
      min: 0,
      default: 0
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0
    },
    invoiceReference: {
      type: String,
      trim: true
    },
    maintenanceStatus: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    },
    remarks: {
      type: String,
      trim: true
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

vehicleMaintenanceSchema.index({ bus: 1, serviceDate: -1 });
vehicleMaintenanceSchema.index({ maintenanceStatus: 1, serviceDate: -1 });

const VehicleMaintenance = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);

module.exports = VehicleMaintenance;

