const express = require('express');
const { askAssistant, scanPlate, voiceAutoBook } = require('../controllers/aiController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/refueling-assistant', optionalProtect, askAssistant);
router.post('/scan-plate', optionalProtect, scanPlate);
router.post('/voice-auto-book', optionalProtect, voiceAutoBook);

module.exports = router;

