const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  dispenser: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispenser', required: true },
  slotTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no-show'], default: 'pending' }
}, { timestamps: true });

bookingSchema.index({ dispenser: 1, slotTime: 1 }, { unique: true });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ station: 1, status: 1 });
bookingSchema.index({ slotTime: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

