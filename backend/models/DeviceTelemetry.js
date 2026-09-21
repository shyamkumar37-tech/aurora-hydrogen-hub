const mongoose = require('mongoose');

const deviceTelemetrySchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  dispenser: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispenser', required: true },
  status: { type: String, enum: ['online', 'offline', 'warning', 'critical'], default: 'online' },
  pressureBar: { type: Number, required: true },
  temperatureC: { type: Number, required: true },
  flowRateKgMin: { type: Number, required: true },
  hydrogenLevelPercent: { type: Number, required: true },
  lastHeartbeat: { type: Date, default: Date.now },
  errorCode: { type: String, default: null }
}, { timestamps: true });

// Create a compound index for fast queries of latest telemetry per dispenser
deviceTelemetrySchema.index({ dispenser: 1, createdAt: -1 });

module.exports = mongoose.model('DeviceTelemetry', deviceTelemetrySchema);
