const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Vehicle Problem', 'Station/Pump Problem', 'Accident', 'Medical Emergency', 'Roadside Assistance'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  status: { type: String, enum: ['REQUESTED', 'ACKNOWLEDGED', 'ASSIGNED', 'RESOLVED', 'CANCELLED'], default: 'REQUESTED' }
}, { timestamps: true });

emergencyRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
