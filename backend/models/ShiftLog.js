const mongoose = require('mongoose');

const shiftLogSchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  staffUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shiftStart: { type: Date, default: Date.now },
  shiftEnd: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  totalKgDispensed: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  transactionsCount: { type: Number, default: 0 },
  handoverNotes: { type: String, default: '' },
  safetyChecklistPassed: { type: Boolean, default: false },
  safetyChecklistDetails: {
    groundingClampChecked: { type: Boolean, default: false },
    nozzleSealsInspected: { type: Boolean, default: false },
    ventStackValveClear: { type: Boolean, default: false },
    vaporSensorsGreen: { type: Boolean, default: false },
    emergencyStopTested: { type: Boolean, default: false },
    inspectedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('ShiftLog', shiftLogSchema);
