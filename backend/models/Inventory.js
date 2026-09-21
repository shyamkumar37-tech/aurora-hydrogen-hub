const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, unique: true },
  currentStock: { type: Number, default: 0 },
  threshold: { type: Number, default: 100 },
  lastRefillAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
