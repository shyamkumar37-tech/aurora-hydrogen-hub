const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFleetVehicles,
  addFleetVehicle,
  updateFleetVehicle,
  deleteFleetVehicle
} = require('../controllers/fleetController');

router.use(protect);

router.route('/')
  .get(getFleetVehicles)
  .post(addFleetVehicle);

router.route('/:id')
  .put(updateFleetVehicle)
  .delete(deleteFleetVehicle);

module.exports = router;
