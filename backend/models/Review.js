const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  dispenseSpeedScore: {
    type: Number, // 1 to 5
    default: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  amenitiesRated: [{
    type: String,
    enum: ['EV/H2 Lounge', 'High-Speed Wi-Fi', 'Artisan Café', 'Clean Restrooms', 'Tire Pressure & Water', '24/7 Security']
  }],
  helpfulCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

reviewSchema.index({ station: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
