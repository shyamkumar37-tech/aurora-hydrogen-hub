const express = require('express');
const { 
  getStations, 
  getStationById, 
  createStation, 
  updateStation, 
  deleteStation, 
  getNearbyStations, 
  getCompareStations,
  toggleEmergencyStop,
  getShiftStatus,
  startShift,
  submitSafetyChecklist,
  endShift,
  getShiftLogs,
  logTankerRefill,
  getRefillLogs,
  requestRestock
} = require('../controllers/stationController');
const { getStationFootfallAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const { recordAudit } = require('../middleware/auditMiddleware');

const router = express.Router();

router.get('/:id/footfall', getStationFootfallAnalytics);

router.route('/')
  .get(getStations)
  .post(protect, authorize('admin'), recordAudit('CREATE_STATION'), createStation);

router.route('/nearby')
  .get(protect, getNearbyStations);

router.route('/compare')
  .get(protect, getCompareStations);

// Staff Emergency & Safety routes
router.route('/:id/emergency-stop')
  .post(protect, authorize('staff', 'admin'), recordAudit('EMERGENCY_STOP_TOGGLE'), toggleEmergencyStop);

// Staff Shift routes
router.route('/:id/shifts/status')
  .get(protect, authorize('staff', 'admin'), getShiftStatus);

router.route('/:id/shifts/start')
  .post(protect, authorize('staff', 'admin'), recordAudit('START_SHIFT'), startShift);

router.route('/:id/shifts/checklist')
  .post(protect, authorize('staff', 'admin'), recordAudit('SAFETY_CHECKLIST'), submitSafetyChecklist);

router.route('/:id/shifts/end')
  .post(protect, authorize('staff', 'admin'), recordAudit('END_SHIFT'), endShift);

router.route('/:id/shifts/logs')
  .get(protect, authorize('staff', 'admin'), getShiftLogs);

// Staff Logistics & Refill routes
router.route('/:id/refills')
  .get(protect, authorize('staff', 'admin'), getRefillLogs)
  .post(protect, authorize('staff', 'admin'), recordAudit('LOG_TANKER_REFILL'), logTankerRefill);

router.route('/:id/restock-request')
  .post(protect, authorize('staff', 'admin'), recordAudit('REQUEST_RESTOCK'), requestRestock);

router.route('/:id')
  .get(getStationById)
  .put(protect, authorize('admin'), recordAudit('UPDATE_STATION'), updateStation)
  .delete(protect, authorize('admin'), recordAudit('DELETE_STATION'), deleteStation);

module.exports = router;


