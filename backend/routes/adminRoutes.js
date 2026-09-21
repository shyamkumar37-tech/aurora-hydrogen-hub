const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

// 1. Staff & User RBAC
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/adjust-wallet', adminController.adjustWalletBalance);
router.put('/customers/:id/suspend', adminController.suspendCustomer);
router.get('/staff', adminController.getStaff);

// 2. SCADA Control Matrix
router.get('/scada', adminController.getSCADAOverview);
router.post('/scada/emergency-shutoff', adminController.toggleEmergencyShutoff);

// 3. Dynamic Tariff & Pricing Engine
router.get('/pricing', adminController.getPricing);
router.put('/pricing', adminController.updateBasePricing);

// 4. Hydrogen Supply Chain Logistics
router.get('/shipments', adminController.getShipments);
router.post('/shipments/dispatch', adminController.dispatchShipment);

// 5. Security Audit Forensics
router.get('/audit-logs', adminController.getAuditLogs);

// 6. Predictive AI Maintenance & Diagnostics
router.get('/diagnostics', adminController.getDiagnostics);

// 7. ESG Carbon Ledger & Revenue Forecasting
router.get('/forecast', adminController.getESGRevenueForecast);

module.exports = router;

