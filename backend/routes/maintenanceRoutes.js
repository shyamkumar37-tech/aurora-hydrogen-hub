const express = require('express');
const { getMaintenanceLogs, scheduleMaintenance, updateMaintenanceStatus } = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, authorize('staff', 'admin'), getMaintenanceLogs)
  .post(protect, authorize('staff', 'admin'), scheduleMaintenance);

router.route('/:id/status')
  .put(protect, authorize('staff', 'admin'), updateMaintenanceStatus);

module.exports = router;
