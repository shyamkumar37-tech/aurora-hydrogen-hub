const mongoose = require('mongoose');

const refillLogSchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  carrier: { type: String, required: true }, // e.g. "Air Liquide", "Linde H2 Logistics"
  tankerId: { type: String, required: true },
  batchNumber: { type: String, required: true },
  quantityAddedKg: { type: Number, required: true },
  tankPressureAfterBar: { type: Number, default: 700 },
  purityCertificationPass: { type: Boolean, default: true },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  deliveredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RefillLog', refillLogSchema);
