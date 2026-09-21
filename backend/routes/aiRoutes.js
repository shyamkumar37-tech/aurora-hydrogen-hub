const express = require('express');
const { askAssistant, scanPlate } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/refueling-assistant', protect, askAssistant);
router.post('/scan-plate', protect, scanPlate);

module.exports = router;
