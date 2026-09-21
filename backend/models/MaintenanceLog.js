const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  dispenser: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispenser' }, // Optional. If null, applies to the whole station.
  issue: { type: String, required: true },
  technician: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed'], default: 'scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
