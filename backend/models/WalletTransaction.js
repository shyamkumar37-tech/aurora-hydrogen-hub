const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  source: { type: String, enum: ['razorpay', 'upi', 'stripe', 'card', 'refund', 'booking', 'admin'], default: 'razorpay' },
  razorpayPaymentId: { type: String },
  reference: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' }
}, { timestamps: true });

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

