const Vehicle = require('../models/Vehicle');

exports.getMyVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ user: req.user._id });
    res.json(vehicle || null);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addVehicle = async (req, res) => {
  try {
    const existing = await Vehicle.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Vehicle already exists' });
    }

    const { make, model, tankCapacity } = req.body;
    
    if (!make || !model || !tankCapacity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const vehicle = await Vehicle.create({
      user: req.user._id,
      make,
      model,
      tankCapacity,
      currentLevel: Math.floor(tankCapacity * 0.4), // start at 40%
      status: 'ready'
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Vehicle Error:', error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.getVehicleHealth = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ user: req.user._id, _id: req.params.id });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const Transaction = require('../models/Transaction');
    
    // Aggregate last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactions = await Transaction.aggregate([
      { $match: { user: req.user._id, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalH2: { $sum: '$hydrogenDispensed' }, count: { $sum: 1 } } }
    ]);
    
    const lastTx = await Transaction.findOne({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 });

    const totalH2 = transactions.length > 0 ? transactions[0].totalH2 : 0;
    const refuelCount = transactions.length > 0 ? transactions[0].count : 0;
    
    const avgConsumptionPerDay = totalH2 / 30;
    const estimatedRange = vehicle.currentLevel * 100; // 100km per kg roughly
    
    let healthStatus = 'GOOD';
    if (vehicle.status !== 'ready') healthStatus = 'ATTENTION';
    if (avgConsumptionPerDay > vehicle.tankCapacity / 2) healthStatus = 'CRITICAL'; // arbitrary rule

    res.json({
      success: true,
      data: {
        vehicle,
        healthStatus,
        estimatedRange,
        lastRefuelDate: lastTx ? lastTx.createdAt : null,
        totalHydrogenConsumed30d: totalH2,
        refuelingFrequency30d: refuelCount,
        averageConsumptionPerDay: avgConsumptionPerDay
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
