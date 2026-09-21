const MaintenanceLog = require('../models/MaintenanceLog');
const Booking = require('../models/Booking');

exports.getMaintenanceLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.station) filter.station = req.query.station;
    if (req.query.status) filter.status = req.query.status;

    const logs = await MaintenanceLog.find(filter)
      .populate('station', 'name location')
      .populate('dispenser', 'nozzleType')
      .sort({ startTime: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.scheduleMaintenance = async (req, res) => {
  try {
    const { station, dispenser, issue, technician, startTime, endTime } = req.body;
    
    if (!station || !issue || !technician || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Cancel any existing pending/confirmed bookings that overlap with this maintenance window
    const windowStart = new Date(start.getTime() - 30 * 60000);
    const windowEnd = new Date(end.getTime() + 30 * 60000);
    
    const query = {
      station,
      status: { $in: ['pending', 'confirmed'] },
      slotTime: { $gt: windowStart, $lt: windowEnd }
    };
    if (dispenser) {
      query.dispenser = dispenser;
    }

    await Booking.updateMany(query, { $set: { status: 'cancelled' } });

    const log = new MaintenanceLog({
      station,
      dispenser: dispenser || null,
      issue,
      technician,
      startTime: start,
      endTime: end
    });

    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const log = await MaintenanceLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({ message: 'Maintenance log not found' });
    }

    log.status = status;
    const updatedLog = await log.save();
    res.json(updatedLog);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};
