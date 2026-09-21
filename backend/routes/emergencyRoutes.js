const express = require('express');
const { requestAssistance, getEmergencyRequest } = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/request', protect, requestAssistance);
router.get('/:id', protect, getEmergencyRequest);

module.exports = router;
