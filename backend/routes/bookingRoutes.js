const express = require('express');
const { 
  createBooking, 
  getMyBookings, 
  cancelMyBooking,
  getAllBookings, 
  updateBookingStatus, 
  checkInBooking,
  checkInWithQR,
  createWalkInBooking,
  reassignDispenser
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { recordAudit } = require('../middleware/auditMiddleware');

const router = express.Router();

// Customer endpoints
router.route('/')
  .post(protect, authorize('customer'), recordAudit('CREATE_BOOKING'), createBooking);

router.route('/my')
  .get(protect, authorize('customer'), getMyBookings);

router.route('/:id/cancel')
  .put(protect, authorize('customer'), recordAudit('CANCEL_BOOKING'), cancelMyBooking);

// Staff/Admin endpoints
router.route('/all')
  .get(protect, authorize('staff', 'admin'), getAllBookings);

router.route('/checkin-qr')
  .post(protect, authorize('staff', 'admin'), recordAudit('QR_CHECKIN'), checkInWithQR);

router.route('/walk-in')
  .post(protect, authorize('staff', 'admin'), recordAudit('WALK_IN_REFUELING'), createWalkInBooking);

router.route('/:id/reassign-dispenser')
  .put(protect, authorize('staff', 'admin'), recordAudit('REASSIGN_DISPENSER'), reassignDispenser);

router.route('/:id/status')
  .put(protect, authorize('staff', 'admin'), recordAudit('UPDATE_BOOKING_STATUS'), updateBookingStatus);

router.route('/:id/checkin')
  .post(protect, authorize('staff', 'admin'), recordAudit('CHECKIN_BOOKING'), checkInBooking);

module.exports = router;


