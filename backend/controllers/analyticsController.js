const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Dispenser = require('../models/Dispenser');
const mongoose = require('mongoose');

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const totals = await Transaction.aggregate([
      { $match: { user: userId, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalHydrogenKg: { $sum: "$quantityDispensed" },
          totalSpend: { $sum: "$cost" },
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    const result = totals.length > 0 ? totals[0] : {
      totalHydrogenKg: 0,
      totalSpend: 0,
      totalSessions: 0
    };

    // Calculate average
    result.averageKgPerSession = result.totalSessions > 0 ? (result.totalHydrogenKg / result.totalSessions) : 0;
    
    // Carbon impact: ~11kg CO2 saved per kg of H2 vs gasoline
    result.carbonImpact = {
      co2SavedKg: result.totalHydrogenKg * 11,
      treesEquivalent: Math.floor((result.totalHydrogenKg * 11) / 21) // 1 tree absorbs ~21kg CO2/year
    };

    res.json(result);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper to build match filter
const buildMatchFilter = (req) => {
  const match = {};
  if (req.query.stationId) {
    match.station = new mongoose.Types.ObjectId(req.query.stationId);
  }
  if (req.query.startDate || req.query.endDate) {
    match.createdAt = {};
    if (req.query.startDate) match.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setUTCHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }
  return match;
};

const buildBookingMatchFilter = (req) => {
  const match = {};
  if (req.query.stationId) {
    match.station = new mongoose.Types.ObjectId(req.query.stationId);
  }
  if (req.query.startDate || req.query.endDate) {
    match.slotTime = {};
    if (req.query.startDate) match.slotTime.$gte = new Date(req.query.startDate);
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setUTCHours(23, 59, 59, 999);
      match.slotTime.$lte = end;
    }
  }
  return match;
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const match = buildMatchFilter(req);
    // Only count completed paid transactions
    match.paymentStatus = 'paid';

    const revenueByDate = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$cost" },
          totalQuantity: { $sum: "$quantityDispensed" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(revenueByDate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPeakHoursAnalytics = async (req, res) => {
  try {
    const match = buildBookingMatchFilter(req);

    const peakHours = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $hour: "$slotTime" },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(peakHours);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getUtilizationAnalytics = async (req, res) => {
  try {
    const match = buildBookingMatchFilter(req);
    // Exclude cancelled/no-show from utilization metric
    match.status = { $nin: ['cancelled', 'no-show'] };

    const bookingsByDate = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$slotTime" } },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate Utilization %
    // Assuming 30 min slots = 48 slots per day per dispenser
    let dispenserCount = 0;
    if (req.query.stationId) {
      dispenserCount = await Dispenser.countDocuments({ station: req.query.stationId, status: { $nin: ['offline'] } });
    } else {
      dispenserCount = await Dispenser.countDocuments({ status: { $nin: ['offline'] } });
    }
    if (dispenserCount === 0) dispenserCount = 1; // avoid division by zero
    
    const totalSlotsPerDay = dispenserCount * 48;

    const utilizationData = bookingsByDate.map(b => ({
      _id: b._id,
      bookingCount: b.bookingCount,
      utilizationPct: Number(((b.bookingCount / totalSlotsPerDay) * 100).toFixed(2))
    }));

    res.json(utilizationData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Transaction.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: "$user",
          totalH2Kg: { $sum: "$quantityDispensed" }
        }
      },
      // 1kg of H2 saves ~11kg of CO2 compared to gasoline
      {
        $addFields: {
          co2SavedKg: { $multiply: ["$totalH2Kg", 11] }
        }
      },
      { $sort: { co2SavedKg: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          _id: 1,
          name: "$userInfo.name",
          tier: "$userInfo.tier",
          totalH2Kg: 1,
          co2SavedKg: 1
        }
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCarbonImpact = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    
    // 1 kg of H2 replacing gasoline saves roughly 11.2 kg of CO2 emissions.
    const CO2_SAVINGS_FACTOR = 11.2;
    
    const transactions = await Transaction.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $group: { _id: null, totalH2: { $sum: '$hydrogenDispensed' } } }
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const monthlyTransactions = await Transaction.aggregate([
      { $match: { user: req.user._id, status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, totalH2: { $sum: '$hydrogenDispensed' } } }
    ]);

    const totalH2Used = transactions.length > 0 ? transactions[0].totalH2 : 0;
    const monthlyH2Used = monthlyTransactions.length > 0 ? monthlyTransactions[0].totalH2 : 0;
    
    const estimatedCO2Avoided = totalH2Used * CO2_SAVINGS_FACTOR;
    const monthlyCO2Avoided = monthlyH2Used * CO2_SAVINGS_FACTOR;
    const yearlyProjection = monthlyCO2Avoided * 12;

    res.json({
      success: true,
      data: {
        totalH2Used,
        estimatedCO2Avoided,
        monthlyCO2Avoided,
        yearlyProjection,
        factorUsed: CO2_SAVINGS_FACTOR,
        equivalentDrivingAvoidedKm: estimatedCO2Avoided * 4 // Assuming 250g CO2/km for average gas car
      }
    });
  } catch (error) {
    console.error('Carbon Impact Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStationFootfallAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid Station ID required' });
    }

    const stationObjectId = new mongoose.Types.ObjectId(id);

    // Aggregate bookings by hour of day (0-23) for this station
    const bookingFootfall = await Booking.aggregate([
      { $match: { station: stationObjectId, status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: { $hour: "$slotTime" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Also aggregate completed transactions by hour of day (0-23) for this station
    const transactionFootfall = await Transaction.aggregate([
      { $match: { station: stationObjectId } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Count dispensers at this station to normalize peak load
    const dispenserCount = (await Dispenser.countDocuments({ station: stationObjectId, status: { $ne: 'offline' } })) || 4;
    const maxCapacityPerHour = Math.max(dispenserCount * 4, 8); // 4 slots per hour per dispenser

    const hourMap = {};
    bookingFootfall.forEach(b => {
      hourMap[b._id] = (hourMap[b._id] || 0) + b.count;
    });
    transactionFootfall.forEach(t => {
      hourMap[t._id] = (hourMap[t._id] || 0) + t.count;
    });

    const timeSlots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const histogram = timeSlots.map(timeStr => {
      const hour = parseInt(timeStr.split(':')[0], 10);
      const count = (hourMap[hour] || 0) + (hourMap[hour + 1] || 0);
      // Realistic load percentage based on real records
      const load = Math.min(100, Math.max(20, Math.round((count / maxCapacityPerHour) * 100)));
      return {
        time: timeStr,
        load,
        activityCount: count,
        status: load > 80 ? 'Peak' : load > 50 ? 'Busy' : 'Available'
      };
    });

    res.json({
      stationId: id,
      dispenserCount,
      histogram
    });
  } catch (error) {
    console.error('Station Footfall Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
