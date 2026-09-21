const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/authMiddleware');

// Get reviews for a station
router.get('/station/:stationId', async (req, res) => {
  try {
    const reviews = await Review.find({ station: req.params.stationId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    // Calculate summary statistics
    const total = reviews.length;
    const avgRating = total > 0 
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1))
      : 4.8;
    const avgSpeed = total > 0
      ? Number((reviews.reduce((acc, r) => acc + r.dispenseSpeedScore, 0) / total).toFixed(1))
      : 4.9;

    res.json({
      reviews,
      stats: {
        totalReviews: total,
        avgRating,
        avgSpeedScore: avgSpeed
      }
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

// Submit a new review
router.post('/station/:stationId', protect, async (req, res) => {
  try {
    const { rating, dispenseSpeedScore, comment, amenitiesRated } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const review = await Review.create({
      station: req.params.stationId,
      user: req.user._id,
      rating: Number(rating),
      dispenseSpeedScore: Number(dispenseSpeedScore) || 5,
      comment,
      amenitiesRated: amenitiesRated || ['EV/H2 Lounge', 'High-Speed Wi-Fi', 'Clean Restrooms']
    });

    const populated = await Review.findById(review._id).populate('user', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Post review error:', error);
    res.status(500).json({ message: 'Server error submitting review' });
  }
});

module.exports = router;
