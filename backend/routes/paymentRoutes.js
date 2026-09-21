const express = require('express');
const { createCheckoutSession, getCheckoutDetails, processCheckoutPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/details/:bookingId', protect, getCheckoutDetails);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/process-payment', protect, processCheckoutPayment);

module.exports = router;

