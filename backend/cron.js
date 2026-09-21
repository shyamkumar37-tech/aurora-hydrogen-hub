const cron = require('node-cron');
const Booking = require('./models/Booking');
const Dispenser = require('./models/Dispenser');
const Station = require('./models/Station');
const socket = require('./socket');

const initCronJobs = () => {
  // Run every 5 minutes to release expired reservations
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking for expired bookings...');
    try {
      const now = new Date();
      // Bookings that are 'pending' or 'confirmed' but their slot was more than 30 mins ago
      const expirationTime = new Date(now.getTime() - 30 * 60000); 
      
      const expiredBookings = await Booking.find({
        status: { $in: ['pending', 'confirmed'] },
        slotTime: { $lt: expirationTime }
      });

      if (expiredBookings.length > 0) {
        console.log(`[CRON] Found ${expiredBookings.length} expired bookings. Processing no-shows...`);
        
        for (const booking of expiredBookings) {
          booking.status = 'no-show';
          await booking.save();

          // Free up the dispenser
          await Dispenser.findByIdAndUpdate(booking.dispenser, { status: 'available' });
          await Station.findByIdAndUpdate(booking.station, { $inc: { availablePumps: 1 } });
          
          try {
            const io = socket.getIO();
            // Emit dispenser status change
            io.to(`station_${booking.station}`).emit('dispenser_status_changed', {
              stationId: booking.station,
              dispenserId: booking.dispenser,
              status: 'available'
            });
            // Emit booking updated to user
            io.to(`user_${booking.user}`).emit('booking_updated', {
              bookingId: booking._id,
              status: 'no-show'
            });
          } catch (e) {
            // Socket not initialized yet or error
          }
        }
      }
    } catch (err) {
      console.error('[CRON] Error running expiration job:', err);
    }
  });

  // Run every 1 minute to check telemetry offline status
  cron.schedule('*/1 * * * *', async () => {
    try {
      const DeviceTelemetry = require('./models/DeviceTelemetry');
      const cutoff = new Date(Date.now() - 60000); // 1 minute ago

      // Find telemetry that hasn't updated in 1 min, but is currently 'online' or 'warning'
      // To do this properly we need the LATEST telemetry per dispenser.
      // For a simplified phase 2, we just query latest telemetry for all dispensers
      
      const latestReadings = await DeviceTelemetry.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$dispenser", latest: { $first: "$$ROOT" } } }
      ]);

      const io = socket.getIO();

      for (const reading of latestReadings) {
        if (reading.latest.lastHeartbeat < cutoff && reading.latest.status !== 'offline') {
          // It went offline
          const newStatus = new DeviceTelemetry({
            ...reading.latest,
            _id: undefined,
            status: 'offline',
            lastHeartbeat: new Date()
          });
          await newStatus.save();
          
          if (io) {
             io.to(`station_${newStatus.station}`).emit('telemetry_alert', newStatus);
          }
        }
      }
    } catch (err) {
      console.error('[CRON] Error checking telemetry heartbeat:', err);
    }
  });
};

module.exports = { initCronJobs };
