const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

// Customer endpoints
router.post('/sos', supportController.createSOSAlert);
router.post('/tickets', supportController.createTicket);

// Admin endpoints
router.get('/sos', admin, supportController.getSOSAlerts);
router.put('/sos/:id/acknowledge', admin, supportController.acknowledgeSOS);

router.get('/tickets', admin, supportController.getTickets);
router.put('/tickets/:id/status', admin, supportController.updateTicketStatus);

module.exports = router;
