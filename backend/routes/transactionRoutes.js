const express = require('express');
const { getMyTransactions, completeBookingTransaction } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/my')
  .get(protect, authorize('customer'), getMyTransactions);

router.route('/complete')
  .post(protect, authorize('staff', 'admin'), completeBookingTransaction);

module.exports = router;
