const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false, sparse: true },
  dispenser: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispenser' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  quantityDispensed: { type: Number, required: true },
  cost: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' }
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ station: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);

