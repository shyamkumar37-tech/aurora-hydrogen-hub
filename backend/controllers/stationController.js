const Station = require('../models/Station');
const Dispenser = require('../models/Dispenser');
const Inventory = require('../models/Inventory');

exports.getStations = async (req, res) => {
  try {
    const stations = await Station.find({});
    const enriched = await Promise.all(stations.map(async (st) => {
      const stObj = st.toObject();
      const totalPumps = await Dispenser.countDocuments({ station: st._id });
      const availablePumps = await Dispenser.countDocuments({ station: st._id, status: 'available' });
      stObj.totalPumps = totalPumps > 0 ? totalPumps : (stObj.totalPumps || 2);
      stObj.availablePumps = totalPumps > 0 ? availablePumps : (stObj.availablePumps || 2);
      return stObj;
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getNearbyStations = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 50000 } = req.query; // maxDistance in meters (50km default)
    
    if (!lng || !lat) {
      return res.status(400).json({ message: 'Please provide lng and lat' });
    }

    const stations = await Station.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance)
        }
      },
      status: 'active'
    });

    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (station) {
      res.json(station);
    } else {
      res.status(404).json({ message: 'Station not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createStation = async (req, res) => {
  try {
    const station = new Station(req.body);
    const createdStation = await station.save();
    
    // Auto-initialize inventory
    await Inventory.create({ station: createdStation._id });
    
    res.status(201).json(createdStation);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (station) {
      if (req.body.status) {
        req.io.emit('statusChanged', { type: 'station', id: station._id, status: station.status });
      }
      res.json(station);
    } else {
      res.status(404).json({ message: 'Station not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (station) {
      await Dispenser.deleteMany({ station: station._id });
      const Inventory = require('../models/Inventory'); // Ensure it's required if used here
      await Inventory.findOneAndDelete({ station: station._id });
      res.json({ message: 'Station and associated data removed' });
    } else {
      res.status(404).json({ message: 'Station not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCompareStations = async (req, res) => {
  try {
    const stations = await Station.find({ status: { $in: ['operational', 'active'] } });
    
    // Sort by price (cheapest first)
    const cheapest = [...stations].sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0));
    
    // Sort by fastest (wait time)
    const fastest = [...stations].sort((a, b) => (a.waitTime || 0) - (b.waitTime || 0));

    // Sort by best overall (simple heuristic: low price + low wait + high availability)
    const bestOverall = [...stations].sort((a, b) => {
      const scoreA = (a.pricePerKg || 0) + (a.waitTime || 0) - (a.availablePumps || 0);
      const scoreB = (b.pricePerKg || 0) + (b.waitTime || 0) - (b.availablePumps || 0);
      return scoreA - scoreB;
    });

    res.json({
      success: true,
      data: {
        cheapest: cheapest.slice(0, 5),
        fastest: fastest.slice(0, 5),
        bestOverall: bestOverall.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================
// STAFF MODULE ENHANCEMENTS
// ==========================================

// 1. Digital Emergency Stop (E-Stop)
exports.toggleEmergencyStop = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const newEStopState = !station.emergencyStop;
    station.emergencyStop = newEStopState;
    station.status = newEStopState ? 'maintenance' : 'operational';
    await station.save();

    // Lock/Unlock all dispensers
    if (newEStopState) {
      await Dispenser.updateMany({ station: station._id }, { status: 'offline' });
    } else {
      await Dispenser.updateMany({ station: station._id, status: 'offline' }, { status: 'available' });
    }

    if (req.io) {
      req.io.emit('emergencyStopToggled', {
        stationId: station._id,
        stationName: station.name,
        emergencyStop: newEStopState,
        status: station.status,
        triggeredBy: req.user.name
      });
    }

    res.json({
      message: newEStopState ? 'EMERGENCY STOP ACTIVATED! All dispensers locked.' : 'Emergency stop deactivated. Station restored to operational.',
      station
    });
  } catch (error) {
    console.error('E-Stop error:', error);
    res.status(500).json({ message: 'Server error toggling emergency stop' });
  }
};

// 2. Shift Management & Safety Checklist
exports.getShiftStatus = async (req, res) => {
  try {
    const ShiftLog = require('../models/ShiftLog');
    const activeShift = await ShiftLog.findOne({
      station: req.params.id,
      staffUser: req.user._id,
      status: 'active'
    }).populate('staffUser', 'name email');

    res.json({ activeShift: activeShift || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error getting shift status' });
  }
};

exports.startShift = async (req, res) => {
  try {
    const ShiftLog = require('../models/ShiftLog');
    
    // Check if already on active shift
    let active = await ShiftLog.findOne({
      station: req.params.id,
      staffUser: req.user._id,
      status: 'active'
    });

    if (active) {
      return res.json({ message: 'Shift is already active', shift: active });
    }

    const newShift = await ShiftLog.create({
      station: req.params.id,
      staffUser: req.user._id,
      shiftStart: new Date(),
      status: 'active'
    });

    res.status(201).json({ message: 'Shift started successfully', shift: newShift });
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ message: 'Server error starting shift' });
  }
};

exports.submitSafetyChecklist = async (req, res) => {
  try {
    const ShiftLog = require('../models/ShiftLog');
    const { groundingClampChecked, nozzleSealsInspected, ventStackValveClear, vaporSensorsGreen, emergencyStopTested } = req.body;

    const allPassed = groundingClampChecked && nozzleSealsInspected && ventStackValveClear && vaporSensorsGreen && emergencyStopTested;

    let shift = await ShiftLog.findOne({
      station: req.params.id,
      staffUser: req.user._id,
      status: 'active'
    });

    if (!shift) {
      shift = await ShiftLog.create({
        station: req.params.id,
        staffUser: req.user._id,
        status: 'active'
      });
    }

    shift.safetyChecklistPassed = allPassed;
    shift.safetyChecklistDetails = {
      groundingClampChecked,
      nozzleSealsInspected,
      ventStackValveClear,
      vaporSensorsGreen,
      emergencyStopTested,
      inspectedAt: new Date()
    };
    await shift.save();

    res.json({ message: 'Safety inspection checklist recorded successfully', shift });
  } catch (error) {
    console.error('Safety checklist error:', error);
    res.status(500).json({ message: 'Server error submitting checklist' });
  }
};

exports.endShift = async (req, res) => {
  try {
    const ShiftLog = require('../models/ShiftLog');
    const Transaction = require('../models/Transaction');
    const { handoverNotes } = req.body;

    const shift = await ShiftLog.findOne({
      station: req.params.id,
      staffUser: req.user._id,
      status: 'active'
    });

    if (!shift) {
      return res.status(404).json({ message: 'No active shift found to end' });
    }

    // Calculate metrics for this shift period
    const shiftTransactions = await Transaction.find({
      station: req.params.id,
      createdAt: { $gte: shift.shiftStart }
    });

    const totalKg = shiftTransactions.reduce((acc, t) => acc + (t.quantityDispensed || 0), 0);
    const totalRev = shiftTransactions.reduce((acc, t) => acc + (t.cost || 0), 0);

    shift.shiftEnd = new Date();
    shift.status = 'completed';
    shift.totalKgDispensed = totalKg;
    shift.totalRevenue = totalRev;
    shift.transactionsCount = shiftTransactions.length;
    shift.handoverNotes = handoverNotes || '';
    await shift.save();

    res.json({
      message: 'Shift ended and handover log created successfully',
      shift,
      summary: {
        totalKg,
        totalRevenue: totalRev,
        transactionsCount: shiftTransactions.length
      }
    });
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({ message: 'Server error ending shift' });
  }
};

exports.getShiftLogs = async (req, res) => {
  try {
    const ShiftLog = require('../models/ShiftLog');
    const shifts = await ShiftLog.find({ station: req.params.id })
      .populate('staffUser', 'name email')
      .sort({ shiftStart: -1 })
      .limit(20);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching shift logs' });
  }
};

// 3. Hydrogen Tanker Refills & Supply Logistics
exports.logTankerRefill = async (req, res) => {
  try {
    const RefillLog = require('../models/RefillLog');
    const { carrier, tankerId, batchNumber, quantityAddedKg, tankPressureAfterBar, notes } = req.body;

    if (!carrier || !tankerId || !batchNumber || !quantityAddedKg) {
      return res.status(400).json({ message: 'Please provide all tanker intake details' });
    }

    const qty = Number(quantityAddedKg);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity added must be a positive number' });
    }

    const refill = await RefillLog.create({
      station: req.params.id,
      carrier,
      tankerId,
      batchNumber,
      quantityAddedKg: qty,
      tankPressureAfterBar: tankPressureAfterBar || 700,
      loggedBy: req.user._id,
      notes: notes || ''
    });

    // Update inventory
    const inventory = await Inventory.findOne({ station: req.params.id });
    if (inventory) {
      inventory.currentStock += qty;
      inventory.lastRefillAt = new Date();
      await inventory.save();
    } else {
      await Inventory.create({
        station: req.params.id,
        currentStock: qty,
        lastRefillAt: new Date()
      });
    }

    // Update station pressure
    if (tankPressureAfterBar) {
      await Station.findByIdAndUpdate(req.params.id, { currentPressureBar: Number(tankPressureAfterBar) });
    }

    if (req.io) {
      req.io.emit('inventoryUpdated', { stationId: req.params.id, currentStock: inventory?.currentStock });
    }

    res.status(201).json({ message: 'Tanker delivery logged and inventory replenished!', refill });
  } catch (error) {
    console.error('Refill log error:', error);
    res.status(500).json({ message: 'Server error logging tanker refill' });
  }
};

exports.getRefillLogs = async (req, res) => {
  try {
    const RefillLog = require('../models/RefillLog');
    const logs = await RefillLog.find({ station: req.params.id })
      .populate('loggedBy', 'name')
      .sort({ deliveredAt: -1 })
      .limit(20);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching refill logs' });
  }
};

exports.requestRestock = async (req, res) => {
  try {
    const SupportTicket = require('../models/SupportTicket');
    const station = await Station.findById(req.params.id);
    const { urgent, requestedKg, message } = req.body;

    const ticket = await SupportTicket.create({
      user: req.user._id,
      category: 'station',
      subject: `🚨 H2 Restock Request: ${station?.name || 'Station'}`,
      description: `Staff ${req.user.name} requested ${requestedKg || 500} kg hydrogen restock. Urgency: ${urgent ? 'CRITICAL' : 'Standard'}. Note: ${message || 'Storage running low.'}`,
      status: 'open',
      priority: urgent ? 'high' : 'medium'
    });

    res.json({ message: 'Restock dispatch ticket submitted to logistics admins', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error requesting restock' });
  }
};

