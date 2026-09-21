const mongoose = require('mongoose');

const dispenserSchema = new mongoose.Schema({
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  nozzleType: { type: String, enum: ['350 bar', '700 bar'], required: true },
  pressureRating: { type: Number },
  status: { type: String, enum: ['available', 'in-use', 'fueling', 'maintenance', 'offline'], default: 'available' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

dispenserSchema.virtual('stationId').get(function() {
  return this.station;
});

dispenserSchema.index({ station: 1, status: 1 });

module.exports = mongoose.model('Dispenser', dispenserSchema);


