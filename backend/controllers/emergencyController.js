const EmergencyRequest = require('../models/EmergencyRequest');
const Station = require('../models/Station');
const Notification = require('../models/Notification');
const smsService = require('../services/smsService');

exports.requestAssistance = async (req, res) => {
  try {
    const { type, location } = req.body; // location = { lat, lng }
    
    if (!type || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Type and location are required' });
    }

    const request = new EmergencyRequest({
      user: req.user._id,
      type,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      }
    });

    await request.save();

    // Dispatch real-time emergency alert via SMS / WhatsApp to dispatch team or user phone
    const targetPhone = process.env.EMERGENCY_DISPATCH_PHONE || req.user.phone;
    if (targetPhone) {
      smsService.sendEmergencyAlertSMS({
        to: targetPhone,
        requestType: type,
        location: request.location,
        userPhone: req.user.phone
      }).catch(err => console.error('Emergency SMS alert error:', err.message));
    }

    // Alert staff via websocket (could be broadcasted to a generic 'staff' room)
    if (req.io) {
      req.io.emit('emergency_alert', request);
    }

    // Find nearest station to guide them
    const nearestStation = await Station.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [location.lng, location.lat] }
        }
      },
      status: { $in: ['operational', 'active'] }
    });

    res.status(201).json({
      success: true,
      data: {
        request,
        nearestStation
      }
    });
  } catch (error) {
    console.error('Emergency Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmergencyRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
