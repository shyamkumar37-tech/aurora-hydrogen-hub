const express = require('express');
const { getInventories, updateInventory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, authorize('staff', 'admin'), getInventories);

router.route('/:id')
  .put(protect, authorize('staff', 'admin'), updateInventory);

module.exports = router;
