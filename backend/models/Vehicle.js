const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  plateNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  fuelType: {
    type: String,
    enum: ['700 bar Hydrogen', '350 bar Hydrogen', 'Cryogenic Liquid H2'],
    default: '700 bar Hydrogen'
  },
  tankCapacityKg: {
    type: Number,
    required: true,
    default: 5.6
  },
  currentFuelLevelPct: {
    type: Number,
    min: 0,
    max: 100,
    default: 65
  },
  estimatedRangeKm: {
    type: Number,
    default: 420
  },
  isActive: {
    type: Boolean,
    default: false
  },
  efficiencyKgPer100Km: {
    type: Number,
    default: 0.95
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

vehicleSchema.virtual('currentLevel').get(function() {
  const cap = this.tankCapacityKg || 5.6;
  const pct = this.currentFuelLevelPct !== undefined ? this.currentFuelLevelPct : 65;
  return parseFloat(((cap * pct) / 100).toFixed(2));
});

vehicleSchema.virtual('tankCapacity').get(function() {
  return this.tankCapacityKg || 5.6;
});

vehicleSchema.virtual('make').get(function() {
  if (!this.model) return 'Hydrogen';
  const parts = this.model.split(' ');
  return parts[0] || 'Hydrogen';
});

vehicleSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

