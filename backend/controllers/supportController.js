const SOSAlert = require('../models/SOSAlert');
const SupportTicket = require('../models/SupportTicket');

// SOS Alerts
exports.getSOSAlerts = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ isAcknowledged: false })
      .populate('user', 'name email')
      .populate('station', 'name')
      .sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acknowledgeSOS = async (req, res) => {
  try {
    const alert = await SOSAlert.findByIdAndUpdate(req.params.id, {
      isAcknowledged: true,
      acknowledgedBy: req.user._id
    }, { new: true });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create SOS (called by customer)
exports.createSOSAlert = async (req, res) => {
  try {
    const { stationId } = req.body;
    const alert = await SOSAlert.create({
      user: req.user._id,
      station: stationId
    });
    
    // Broadcast to admins
    if (req.io) {
      req.io.to('admin_room').emit('sos-alert', await SOSAlert.findById(alert._id)
        .populate('user', 'name')
        .populate('station', 'name'));
    }
    
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Support Tickets
exports.getTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { subject, description } = req.body;
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
