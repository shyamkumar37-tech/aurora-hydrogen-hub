const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  quantityKg: {
    type: Number,
    required: true,
    default: 1200 // Standard 1.2 tonne tube-trailer
  },
  purityGrade: {
    type: String,
    default: 'Grade D (99.999% Fuel Cell Grade)'
  },
  sourcePlant: {
    type: String,
    default: 'Aurora Electrolysis Facility #1 (Ennore Solar Park)'
  },
  driverName: {
    type: String,
    default: 'Karthik Raman'
  },
  truckPlate: {
    type: String,
    default: 'TN-04-TT-4821'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_transit', 'delivered', 'cancelled'],
    default: 'in_transit'
  },
  etaMinutes: {
    type: Number,
    default: 35
  },
  dispatchedAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
