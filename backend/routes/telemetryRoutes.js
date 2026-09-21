const express = require('express');
const { submitTelemetry, getDispenserTelemetry } = require('../controllers/telemetryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// IoT devices would ideally have their own auth mechanism, 
// but for phase 2 we simulate it via staff/admin JWTs.
router.route('/')
  .post(protect, authorize('staff', 'admin'), submitTelemetry);

router.route('/:id')
  .get(protect, authorize('staff', 'admin'), getDispenserTelemetry);

module.exports = router;
