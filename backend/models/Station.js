const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [80.2707, 13.0827] }, // [longitude, latitude]
    address: { type: String }
  },

  capacity: { type: Number },
  operatingHours: { type: String, default: '24/7' },
  status: { type: String, enum: ['operational', 'active', 'limited', 'maintenance', 'offline'], default: 'operational' },
  availablePumps: { type: Number, default: 0 },

  totalPumps: { type: Number, default: 0 },
  pricePerKg: { type: Number, default: 82 },
  priceOverride: { type: Number },
  queueLength: { type: Number, default: 0 },
  waitTime: { type: Number, default: 0 }, // in minutes
  fuelingDuration: { type: Number, default: 7 }, // in minutes
  emergencyStop: { type: Boolean, default: false },
  currentPressureBar: { type: Number, default: 700 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);
