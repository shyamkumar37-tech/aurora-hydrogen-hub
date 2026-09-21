const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: String, required: true }, // e.g., 'first_refuel', '100kg_club'
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String }, // emoji or path
  unlockedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ user: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
