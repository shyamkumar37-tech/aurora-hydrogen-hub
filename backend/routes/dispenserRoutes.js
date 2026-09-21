const express = require('express');
const { getDispensers, getDispenserById, createDispenser, updateDispenser, deleteDispenser, generateDispenserQR, simulatePump } = require('../controllers/dispenserController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { recordAudit } = require('../middleware/auditMiddleware');

const router = express.Router();

router.route('/')
  .get(getDispensers)
  .post(protect, authorize('admin'), recordAudit('CREATE_DISPENSER'), createDispenser);

router.route('/:id')
  .get(getDispenserById)
  .put(protect, authorize('admin'), recordAudit('UPDATE_DISPENSER'), updateDispenser)
  .delete(protect, authorize('admin'), recordAudit('DELETE_DISPENSER'), deleteDispenser);

router.route('/:id/qr')
  .get(protect, authorize('admin', 'staff'), generateDispenserQR);

router.route('/:id/simulate-pump')
  .post(protect, recordAudit('SIMULATE_PUMP'), simulatePump);

module.exports = router;

