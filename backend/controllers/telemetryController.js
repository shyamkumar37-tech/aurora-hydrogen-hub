const DeviceTelemetry = require('../models/DeviceTelemetry');
const Dispenser = require('../models/Dispenser');

exports.submitTelemetry = async (req, res) => {
  try {
    const { dispenserId, pressureBar, temperatureC, flowRateKgMin, hydrogenLevelPercent, errorCode } = req.body;
    
    // In a real app, this would use an API key or device certificate, not a user token
    const dispenser = await Dispenser.findById(dispenserId);
    if (!dispenser) {
      return res.status(404).json({ message: 'Dispenser not found' });
    }

    let status = 'online';
    if (errorCode) {
      status = 'critical';
    } else if (pressureBar < 300 || temperatureC > 85) {
      status = 'warning';
    }

    const telemetry = new DeviceTelemetry({
      station: dispenser.station,
      dispenser: dispenserId,
      status,
      pressureBar,
      temperatureC,
      flowRateKgMin,
      hydrogenLevelPercent,
      errorCode
    });

    await telemetry.save();

    // Broadcast to staff/admins
    if (req.io) {
      req.io.to(`station_${dispenser.station}`).emit('telemetry_alert', telemetry);
    }

    res.status(201).json({ success: true, data: telemetry });
  } catch (error) {
    console.error('Telemetry Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDispenserTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const telemetry = await DeviceTelemetry.find({ dispenser: id })
      .sort({ createdAt: -1 })
      .limit(50); // Last 50 readings
    
    res.json({ success: true, data: telemetry });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
