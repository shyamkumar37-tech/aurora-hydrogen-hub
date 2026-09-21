const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Inventory = require('../models/Inventory');

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('station', 'name location')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.completeBookingTransaction = async (req, res) => {
  try {
    const { bookingId, quantityDispensed, cost } = req.body;
    
    if (!bookingId || quantityDispensed === undefined || cost === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const qty = Number(quantityDispensed);
    const costNum = Number(cost);
    if (isNaN(qty) || qty <= 0 || isNaN(costNum) || costNum < 0) {
      return res.status(400).json({ message: 'Invalid quantity or cost' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }
    if (booking.status === 'cancelled' || booking.status === 'no-show') {
      return res.status(400).json({ message: `Cannot complete a ${booking.status} booking` });
    }

    const inventory = await Inventory.findOne({ station: booking.station });
    if (!inventory) {
      return res.status(404).json({ message: 'Station inventory not found' });
    }

    if (inventory.currentStock < qty) {
      return res.status(400).json({ message: 'Not enough stock available at this station' });
    }

    // Step 1: Save transaction first to ensure no duplicates
    const transaction = new Transaction({
      booking: booking._id,
      user: booking.user,
      station: booking.station,
      quantityDispensed: qty,
      cost: costNum,
      paymentStatus: 'paid'
    });
    const savedTransaction = await transaction.save();

    // Step 2: Atomic update to inventory
    await Inventory.findOneAndUpdate(
      { station: booking.station },
      { $inc: { currentStock: -qty } }
    );

    // Step 3: Update booking status
    booking.status = 'completed';
    await booking.save();

    // Step 4: Award loyalty points and update tier
    const user = await require('../models/User').findById(booking.user);
    if (user) {
      user.loyaltyPoints += 10;
      if (user.loyaltyPoints >= 500) user.tier = 'Platinum';
      else if (user.loyaltyPoints >= 200) user.tier = 'Gold';
      else if (user.loyaltyPoints >= 50) user.tier = 'Silver';
      await user.save();
    }

    // Emit socket event for inventory update
    req.io.emit('inventoryUpdated', { stationId: booking.station });

    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Transaction Error:', error);
    if (error.code === 11000) { 
      return res.status(400).json({ message: 'Transaction already exists for this booking' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};
