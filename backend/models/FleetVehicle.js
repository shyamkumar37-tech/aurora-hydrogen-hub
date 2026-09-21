const mongoose = require('mongoose');

const fleetVehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vin: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  plateNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['Heavy Duty Truck', 'City Transit Bus', 'Delivery Van', 'Passenger Sedan', 'Material Handler'],
    default: 'Heavy Duty Truck'
  },
  tankCapacityKg: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 35
  },
  pressureRating: {
    type: String,
    enum: ['350 bar', '700 bar'],
    default: '700 bar'
  },
  assignedDriver: {
    name: { type: String, required: true },
    licenseNumber: { type: String, default: 'DL-H2-VALID' },
    phone: { type: String, default: '' }
  },
  dailyLimitKg: {
    type: Number,
    default: 30
  },
  totalH2DispensedKg: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'In Maintenance', 'Depot Standby'],
    default: 'Active'
  }
}, {
  timestamps: true
});

fleetVehicleSchema.index({ owner: 1, plateNumber: 1 }, { unique: true });

module.exports = mongoose.model('FleetVehicle', fleetVehicleSchema);
