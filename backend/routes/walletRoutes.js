const express = require('express');
const { 
  createOrder, 
  verifyPayment, 
  addFunds, 
  getWalletTransactions,
  getDigitalPass,
  updateSpendingCap,
  authorizePassTap
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/add', protect, addFunds);
router.get('/transactions', protect, getWalletTransactions);

// Digital Fuel Pass routes
router.get('/pass', protect, getDigitalPass);
router.put('/spending-cap', protect, updateSpendingCap);
router.post('/pass/authorize-tap', protect, authorizePassTap);

module.exports = router;

