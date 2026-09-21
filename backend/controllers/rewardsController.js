const Transaction = require('../models/Transaction');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

exports.getMyRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Calculate total points (10 points per kg dispensed, or just use user.points if it exists)
    // For phase 2 deterministic backend, let's calculate lifetime points dynamically
    const transactions = await Transaction.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $group: { _id: null, totalKg: { $sum: '$hydrogenDispensed' } } }
    ]);
    
    const totalKg = transactions.length > 0 ? transactions[0].totalKg : 0;
    const points = Math.floor(totalKg * 10);
    
    // Determine tier
    let tier = 'STARTER';
    let nextTier = 'SILVER';
    let pointsNeeded = 500 - points;
    let progress = (points / 500) * 100;
    
    if (points >= 500 && points < 2000) {
      tier = 'SILVER';
      nextTier = 'GOLD';
      pointsNeeded = 2000 - points;
      progress = ((points - 500) / 1500) * 100;
    } else if (points >= 2000 && points < 5000) {
      tier = 'GOLD';
      nextTier = 'PLATINUM';
      pointsNeeded = 5000 - points;
      progress = ((points - 2000) / 3000) * 100;
    } else if (points >= 5000) {
      tier = 'PLATINUM';
      nextTier = 'MAX';
      pointsNeeded = 0;
      progress = 100;
    }
    
    // Evaluate achievements dynamically
    if (transactions.length > 0) {
      // Has at least one transaction -> First Refuel
      await Achievement.updateOne(
        { user: req.user._id, badgeId: 'first_refuel' },
        { $setOnInsert: { title: 'First Refuel', description: 'Completed your first hydrogen refuel', icon: '🌟' } },
        { upsert: true }
      );
    }
    
    if (totalKg >= 100) {
      await Achievement.updateOne(
        { user: req.user._id, badgeId: '100kg_club' },
        { $setOnInsert: { title: '100 kg Club', description: 'Refueled 100kg of hydrogen', icon: '🏆' } },
        { upsert: true }
      );
    }
    
    const achievements = await Achievement.find({ user: req.user._id }).sort({ unlockedAt: -1 });

    res.json({
      success: true,
      data: {
        points,
        tier,
        nextTier,
        pointsNeeded,
        progress: Math.min(100, Math.max(0, progress)),
        achievements,
        history: [] // Mocked history for phase 2, or derived from transactions
      }
    });
  } catch (error) {
    console.error('Rewards Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
