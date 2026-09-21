const express = require('express');
const { getMyRewards } = require('../controllers/rewardsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyRewards);
router.get('/history', protect, getMyRewards); // For simplicity, we mapped this to the same controller that returns history
router.get('/achievements', protect, getMyRewards);

module.exports = router;
