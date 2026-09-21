const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Dispenser = require('../models/Dispenser');
const Notification = require('../models/Notification');
const MaintenanceLog = require('../models/MaintenanceLog');

exports.createBooking = async (req, res) => {
  try {
    const { station, dispenser, slotTime } = req.body;
    
    // Check Station status
    const stationDoc = await Station.findById(station);
    if (!stationDoc || (stationDoc.status !== 'operational' && stationDoc.status !== 'active')) {
      return res.status(400).json({ message: 'Station is not operational' });
    }

    const requestedTime = new Date(slotTime);
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60000);
    
    if (requestedTime < twoMinutesAgo) {
      return res.status(400).json({ message: 'Cannot book a time slot in the past' });
    }


    const windowStart = new Date(requestedTime.getTime() - 30 * 60000); // 30 mins before
    const windowEnd = new Date(requestedTime.getTime() + 30 * 60000); // 30 mins after
    
    // Check for overlapping maintenance for this station or dispenser
    const maintenanceOverlap = await MaintenanceLog.findOne({
      station,
      $or: [{ dispenser: null }, { dispenser }],
      status: { $nin: ['completed'] },
      startTime: { $lt: windowEnd },
      endTime: { $gt: windowStart }
    });

    if (maintenanceOverlap) {
      return res.status(409).json({ message: 'Time slot overlaps with scheduled maintenance' });
    }
    
    // Check dispenser availability flag
    const dispenserDoc = await Dispenser.findById(dispenser);
    if (!dispenserDoc || dispenserDoc.status !== 'available') {
      return res.status(409).json({ message: 'Time slot overlaps with existing booking or dispenser unavailable.' });
    }


    // ATOMIC RESERVATION - Rely on MongoDB unique compound index
    const booking = new Booking({
      user: req.user._id,
      station,
      dispenser,
      slotTime
    });

    let createdBooking;
    try {
      createdBooking = await booking.save();
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(409).json({ message: 'Slot already booked. Please choose another time.' });
      }
      throw saveError;
    }

    // Update dispenser status and decrement available pumps
    await Dispenser.findByIdAndUpdate(dispenser, { $set: { status: 'reserved' } });
    await Station.findByIdAndUpdate(station, { $inc: { availablePumps: -1 } });

    // Create Notification
    const newNotification = await Notification.create({
      user: req.user._id,
      message: `Your booking for ${slotTime} at ${stationDoc.name} is confirmed.`,
      type: 'system',
      read: false
    });

    // Broadcast dispenser state change to station subscribers
    if (req.io) {
      req.io.to(`station_${station}`).emit('dispenser_status_changed', {
        stationId: station,
        dispenserId: dispenser,
        status: 'reserved'
      });
      
      // Notify the user directly
      req.io.to(`user_${req.user._id}`).emit('booking_updated', {
        bookingId: createdBooking._id,
        status: createdBooking.status
      });

      req.io.to(`user_${req.user._id}`).emit('notification', newNotification);
    }

    res.status(201).json({
      _id: createdBooking._id,
      message: 'Booking created successfully',
      booking: createdBooking
    });
  } catch (error) {

    console.error('Booking Creation Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('station', 'name location')
      .populate('dispenser', 'nozzleType pressureRating')
      .sort({ slotTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.cancelMyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed refueling session' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release dispenser back to available
    if (booking.dispenser) {
      await Dispenser.findByIdAndUpdate(booking.dispenser, { status: 'available' });
    }
    if (booking.station) {
      await Station.findByIdAndUpdate(booking.station, { $inc: { availablePumps: 1 } });
    }

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('station', 'name')
      .populate('dispenser', 'nozzleType')
      .sort({ slotTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate transition
    if (booking.status === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({ message: 'Cannot change status of a cancelled booking' });
    }
    if (booking.status === 'no-show' && status !== 'no-show') {
      return res.status(400).json({ message: 'Cannot change status of a no-show booking' });
    }
    if (booking.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ message: 'Cannot change status of a completed booking' });
    }
    
    if (status === 'completed' && booking.status !== 'completed') {
      return res.status(400).json({ message: 'Must use /api/transactions/complete to complete a booking' });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    // Revert Dispenser if cancelled or completed
    if (['cancelled', 'no-show', 'completed'].includes(status)) {
      await Dispenser.findByIdAndUpdate(booking.dispenser, { status: 'available' });
      await Station.findByIdAndUpdate(booking.station, { $inc: { availablePumps: 1 } });
      
      if (req.io) {
        req.io.to(`station_${booking.station}`).emit('dispenser_status_changed', {
          stationId: booking.station,
          dispenserId: booking.dispenser,
          status: 'available'
        });
      }
    }

    // Create Notification
    if (['confirmed', 'cancelled', 'no-show', 'completed'].includes(status)) {
      const newNotification = await Notification.create({
        user: booking.user,
        message: `Your booking at ${booking.station} is now ${status}.`
      });
      
      if (req.io) {
        req.io.to(`user_${booking.user}`).emit('booking_updated', {
          bookingId: booking._id,
          status: status
        });
        req.io.to(`user_${booking.user}`).emit('notification', newNotification);
      }
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkInBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate('station').populate('user').populate('dispenser');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no-show') {
      return res.status(400).json({ message: `Cannot check in booking with status: ${booking.status}` });
    }

    booking.status = 'confirmed'; 
    await booking.save();

    // Arm dispenser
    if (booking.dispenser) {
      await Dispenser.findByIdAndUpdate(booking.dispenser._id, { status: 'in-use' });
      if (req.io) {
        req.io.to(`station_${booking.station._id}`).emit('dispenser_status_changed', {
          stationId: booking.station._id,
          dispenserId: booking.dispenser._id,
          status: 'in-use'
        });
      }
    }
    
    res.json({ message: 'Check-in successful & dispenser armed', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkInWithQR = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'QR or Booking code is required' });
    }

    // code can be booking ID or custom string
    const booking = await Booking.findById(code.trim()).populate('station').populate('user').populate('dispenser');
    if (!booking) {
      return res.status(404).json({ message: 'No active booking found with this code/ID' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'This booking has already been completed.' });
    }
    if (booking.status === 'cancelled' || booking.status === 'no-show') {
      return res.status(400).json({ message: `This booking is ${booking.status}` });
    }

    booking.status = 'confirmed';
    await booking.save();

    if (booking.dispenser) {
      await Dispenser.findByIdAndUpdate(booking.dispenser._id, { status: 'in-use' });
      if (req.io) {
        req.io.to(`station_${booking.station._id}`).emit('dispenser_status_changed', {
          stationId: booking.station._id,
          dispenserId: booking.dispenser._id,
          status: 'in-use'
        });
      }
    }

    res.json({
      message: 'QR Code verified successfully. Dispenser is armed.',
      booking
    });
  } catch (err) {
    console.error('QR Checkin error:', err);
    res.status(500).json({ message: 'Server error processing QR check-in' });
  }
};

exports.createWalkInBooking = async (req, res) => {
  try {
    const { stationId, dispenserId, customerName, customerEmail, quantityDispensed, cost, paymentMethod } = req.body;

    if (!stationId || !dispenserId || !quantityDispensed || !cost) {
      return res.status(400).json({ message: 'Please provide all required walk-in details' });
    }

    const qty = Number(quantityDispensed);
    const costNum = Number(cost);
    if (isNaN(qty) || qty <= 0 || isNaN(costNum) || costNum <= 0) {
      return res.status(400).json({ message: 'Invalid quantity or cost amount' });
    }

    const User = require('../models/User');
    const Inventory = require('../models/Inventory');
    const Transaction = require('../models/Transaction');

    // Find or create customer
    let customerUser = await User.findOne({ email: customerEmail || 'walkin@station.h2' });
    if (!customerUser) {
      customerUser = await User.create({
        name: customerName || 'Walk-in Driver',
        email: customerEmail || `walkin_${Date.now()}@station.h2`,
        password: 'password123',
        role: 'customer'
      });
    }

    // Check inventory
    const inventory = await Inventory.findOne({ station: stationId });
    if (inventory && inventory.currentStock < qty) {
      return res.status(400).json({ message: `Insufficient inventory. Available: ${inventory.currentStock} kg` });
    }

    // Create completed booking record
    const booking = new Booking({
      user: customerUser._id,
      station: stationId,
      dispenser: dispenserId,
      slotTime: new Date(),
      status: 'completed'
    });
    await booking.save();

    // Create Transaction
    const transaction = new Transaction({
      booking: booking._id,
      user: customerUser._id,
      station: stationId,
      quantityDispensed: qty,
      cost: costNum,
      paymentStatus: 'paid'
    });
    await transaction.save();

    // Deduct inventory
    if (inventory) {
      inventory.currentStock = Math.max(0, inventory.currentStock - qty);
      await inventory.save();
    }

    if (req.io) {
      req.io.emit('inventoryUpdated', { stationId, currentStock: inventory?.currentStock });
    }

    res.status(201).json({
      message: 'Walk-in refueling completed successfully',
      booking,
      transaction
    });
  } catch (err) {
    console.error('Walk-in refueling error:', err);
    res.status(500).json({ message: 'Server error processing walk-in refueling' });
  }
};

exports.reassignDispenser = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDispenserId } = req.body;

    if (!newDispenserId) {
      return res.status(400).json({ message: 'New dispenser ID is required' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldDispenserId = booking.dispenser;

    // Check new dispenser
    const newDispenser = await Dispenser.findById(newDispenserId);
    if (!newDispenser) {
      return res.status(404).json({ message: 'Target dispenser not found' });
    }

    if (newDispenser.status === 'maintenance' || newDispenser.status === 'offline') {
      return res.status(400).json({ message: `Target dispenser is in ${newDispenser.status} status` });
    }

    // Free up old dispenser if it was reserved
    if (oldDispenserId) {
      await Dispenser.findByIdAndUpdate(oldDispenserId, { status: 'available' });
    }

    // Assign new dispenser
    booking.dispenser = newDispenserId;
    await booking.save();
    await Dispenser.findByIdAndUpdate(newDispenserId, { status: 'reserved' });

    if (req.io) {
      req.io.to(`station_${booking.station}`).emit('dispenser_status_changed', {
        stationId: booking.station,
        dispenserId: newDispenserId,
        status: 'reserved'
      });
    }

    const updated = await Booking.findById(id).populate('station').populate('user').populate('dispenser');
    res.json({ message: 'Dispenser reassigned successfully', booking: updated });
  } catch (err) {
    console.error('Reassign dispenser error:', err);
    res.status(500).json({ message: 'Server error reassigning dispenser' });
  }
};

