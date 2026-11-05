const mongoose = require('mongoose');

const assetMaintenanceSchema = new mongoose.Schema(
  {
    maintenanceId: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Maintenance cost cannot be negative']
    },
    technician: {
      type: String,
      trim: true
    },
    nextServiceDue: {
      type: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'completed'
    }
  },
  { _id: true }
);

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true
    },
    assetCode: {
      type: String,
      required: [true, 'Asset tracking code is required (e.g. AST-IT-001)'],
      trim: true,
      uppercase: true,
      unique: true
    },
    category: {
      type: String,
      required: [true, 'Asset category is required'],
      enum: [
        'it_equipment',
        'lab_equipment',
        'furniture',
        'audio_visual',
        'classroom_hardware',
        'sports',
        'other'
      ],
      default: 'it_equipment'
    },
    subCategory: {
      type: String,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    location: {
      building: {
        type: String,
        trim: true,
        default: 'Main Campus'
      },
      floor: {
        type: String,
        trim: true
      },
      roomNumber: {
        type: String,
        trim: true
      }
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    purchaseCost: {
      type: Number,
      required: [true, 'Purchase cost is required'],
      min: [0, 'Purchase cost cannot be negative']
    },
    currentValue: {
      type: Number,
      min: [0, 'Current value cannot be negative']
    },
    depreciationRate: {
      type: Number,
      min: [0, 'Depreciation rate cannot be negative'],
      max: [100, 'Depreciation rate cannot exceed 100%'],
      default: 10 // Straight-line annual percentage
    },
    usefulLifeYears: {
      type: Number,
      min: 1,
      default: 5
    },
    vendor: {
      name: { type: String, trim: true },
      invoiceNumber: { type: String, trim: true },
      contact: { type: String, trim: true },
      warrantyExpiry: { type: Date }
    },
    status: {
      type: String,
      enum: ['in_service', 'maintenance', 'retired', 'reserved', 'disposed'],
      default: 'in_service'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    maintenanceSchedule: [assetMaintenanceSchema],
    serialNumber: {
      type: String,
      trim: true
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Indexes
assetSchema.index({ category: 1, status: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ serialNumber: 1 }, { sparse: true });

// Pre-save hook to calculate initial currentValue if not explicitly supplied
assetSchema.pre('save', function (next) {
  if (this.currentValue === undefined || this.currentValue === null) {
    this.currentValue = this.purchaseCost;
  }
  next();
});

// Method: Calculate straight-line depreciation
assetSchema.methods.calculateDepreciatedValue = function () {
  const purchase = this.purchaseDate ? new Date(this.purchaseDate) : new Date();
  const now = new Date();
  const yearsElapsed = Math.max(0, (now - purchase) / (1000 * 60 * 60 * 24 * 365.25));
  const rateFraction = (Number(this.depreciationRate) || 10) / 100;
  const depreciated = Math.max(0, this.purchaseCost * (1 - rateFraction * yearsElapsed));
  return Math.round(depreciated * 100) / 100;
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;

