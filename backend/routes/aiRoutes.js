const express = require('express');
const { askAssistant, scanPlate } = require('../controllers/aiController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/refueling-assistant', optionalProtect, askAssistant);
router.post('/scan-plate', protect, scanPlate);

module.exports = router;
