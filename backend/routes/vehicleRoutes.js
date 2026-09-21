const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/authMiddleware');

// Get all user vehicles (supports /my and /)
const getUserVehicles = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const vehicles = await Vehicle.find({ user: req.user._id }).sort({ isActive: -1, createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ message: 'Server error fetching vehicles' });
  }
};

router.get('/my', protect, getUserVehicles);
router.get('/', protect, getUserVehicles);

// Add new vehicle to garage
router.post('/', protect, async (req, res) => {
  try {
    const { model, make, plateNumber, fuelType, tankCapacityKg, tankCapacity, efficiencyKgPer100Km } = req.body;
    
    const resolvedModel = (model ? (make && !model.includes(make) ? `${make} ${model}` : model) : make)?.trim();
    const resolvedPlate = (plateNumber || `IND-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();

    if (!resolvedModel) {
      return res.status(400).json({ message: 'Vehicle model or make is required' });
    }

    // Deactivate others if this is the first vehicle
    const count = await Vehicle.countDocuments({ user: req.user._id });
    const isActive = count === 0;

    const capacity = Number(tankCapacityKg) || Number(tankCapacity) || 5.6;
    const efficiency = Number(efficiencyKgPer100Km) || 0.95;
    const estimatedRangeKm = Math.round((capacity / efficiency) * 100);

    const vehicle = await Vehicle.create({
      user: req.user._id,
      model: resolvedModel,
      plateNumber: resolvedPlate,
      fuelType: fuelType || '700 bar Hydrogen',
      tankCapacityKg: capacity,
      currentFuelLevelPct: 75,
      estimatedRangeKm,
      efficiencyKgPer100Km: efficiency,
      isActive
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ message: 'Server error adding vehicle' });
  }
});

// Switch active vehicle
router.put('/:id/activate', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Set all other vehicles to inactive
    await Vehicle.updateMany({ user: req.user._id }, { $set: { isActive: false } });
    
    vehicle.isActive = true;
    await vehicle.save();

    res.json({ message: 'Active vehicle switched successfully', vehicle });
  } catch (error) {
    console.error('Activate vehicle error:', error);
    res.status(500).json({ message: 'Server error activating vehicle' });
  }
});

// Delete vehicle from garage
router.delete('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // If active was deleted, make another one active
    if (vehicle.isActive) {
      const another = await Vehicle.findOne({ user: req.user._id });
      if (another) {
        another.isActive = true;
        await another.save();
      }
    }

    res.json({ message: 'Vehicle deleted from garage' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Server error deleting vehicle' });
  }
});

// Get vehicle telemetry & health
router.get('/:id/health', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const fuelPct = vehicle.currentFuelLevelPct !== undefined ? vehicle.currentFuelLevelPct : 75;
    const capacity = vehicle.tankCapacityKg || 5.6;
    const efficiency = vehicle.efficiencyKgPer100Km || 0.95;
    const currentH2Kg = parseFloat(((fuelPct / 100) * capacity).toFixed(2));
    const estimatedRange = Math.round((currentH2Kg / efficiency) * 100);

    res.json({
      success: true,
      data: {
        vehicle: {
          make: vehicle.make || (vehicle.model ? vehicle.model.split(' ')[0] : 'Aurora'),
          model: vehicle.model,
          plateNumber: vehicle.plateNumber
        },
        healthStatus: fuelPct > 20 ? 'OPTIMAL' : 'ATTENTION',
        estimatedRange,
        currentFuelLevelPct: fuelPct,
        currentH2Kg,
        tankCapacityKg: capacity,
        totalHydrogenConsumed30d: 38.5,
        averageConsumptionPerDay: 1.28
      }
    });
  } catch (error) {
    console.error('Vehicle health error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle health' });
  }
});

module.exports = router;
