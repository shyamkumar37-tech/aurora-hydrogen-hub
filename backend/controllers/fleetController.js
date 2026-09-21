const FleetVehicle = require('../models/FleetVehicle');

// @desc    Get all fleet vehicles for logged in enterprise/customer
// @route   GET /api/fleet
// @access  Private
exports.getFleetVehicles = async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ owner: req.user._id }).sort({ createdAt: -1 });
    
    const stats = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'Active').length,
      totalCapacityKg: vehicles.reduce((acc, v) => acc + (v.tankCapacityKg || 0), 0),
      totalDispensedKg: vehicles.reduce((acc, v) => acc + (v.totalH2DispensedKg || 0), 0),
      co2SavedKg: (vehicles.reduce((acc, v) => acc + (v.totalH2DispensedKg || 0), 0) * 11.2).toFixed(1)
    };

    res.json({
      success: true,
      data: vehicles,
      stats
    });
  } catch (err) {
    console.error('getFleetVehicles error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving fleet' });
  }
};

// @desc    Add a new vehicle to fleet
// @route   POST /api/fleet
// @access  Private
exports.addFleetVehicle = async (req, res) => {
  try {
    const { vin, plateNumber, model, vehicleType, tankCapacityKg, pressureRating, assignedDriver, dailyLimitKg } = req.body;

    if (!vin || !plateNumber || !model || !assignedDriver?.name) {
      return res.status(400).json({ success: false, message: 'Please provide VIN, Plate Number, Model, and Driver Name' });
    }

    const existing = await FleetVehicle.findOne({ owner: req.user._id, plateNumber: plateNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A vehicle with this plate number already exists in your fleet' });
    }

    const vehicle = await FleetVehicle.create({
      owner: req.user._id,
      vin: vin.toUpperCase().trim(),
      plateNumber: plateNumber.toUpperCase().trim(),
      model: model.trim(),
      vehicleType: vehicleType || 'Heavy Duty Truck',
      tankCapacityKg: Number(tankCapacityKg) || 35,
      pressureRating: pressureRating || '700 bar',
      assignedDriver: {
        name: assignedDriver.name.trim(),
        licenseNumber: assignedDriver.licenseNumber || 'DL-H2-VALID',
        phone: assignedDriver.phone || ''
      },
      dailyLimitKg: Number(dailyLimitKg) || 30
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added to fleet successfully',
      data: vehicle
    });
  } catch (err) {
    console.error('addFleetVehicle error:', err);
    res.status(500).json({ success: false, message: 'Error adding vehicle to fleet' });
  }
};

// @desc    Update vehicle status or quota
// @route   PUT /api/fleet/:id
// @access  Private
exports.updateFleetVehicle = async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Fleet vehicle not found' });
    }

    const allowedUpdates = ['status', 'dailyLimitKg', 'assignedDriver', 'model'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();
    res.json({ success: true, message: 'Vehicle updated', data: vehicle });
  } catch (err) {
    console.error('updateFleetVehicle error:', err);
    res.status(500).json({ success: false, message: 'Error updating fleet vehicle' });
  }
};

// @desc    Remove vehicle from fleet
// @route   DELETE /api/fleet/:id
// @access  Private
exports.deleteFleetVehicle = async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Fleet vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle removed from fleet' });
  } catch (err) {
    console.error('deleteFleetVehicle error:', err);
    res.status(500).json({ success: false, message: 'Error deleting fleet vehicle' });
  }
};
