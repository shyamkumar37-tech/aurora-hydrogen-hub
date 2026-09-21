const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const socket = require('./socket');
const cronJobs = require('./cron');
const authRoutes = require('./routes/authRoutes');
const stationRoutes = require('./routes/stationRoutes');
const dispenserRoutes = require('./routes/dispenserRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const routeRoutes = require('./routes/routeRoutes');
const rewardsRoutes = require('./routes/rewardsRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const fleetRoutes = require('./routes/fleetRoutes');


const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

dotenv.config();

// Provide safe defaults for deployment if not explicitly configured in environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'aurora_jwt_secret_default_key_2026';
process.env.RAZORPAY_KEY = process.env.RAZORPAY_KEY || process.env.RAZORPAY_KEY_ID || 'rzp_test_default';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'secret_default';

const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`WARNING: Environment variable ${envVar} is missing, using default/local fallback.`);
  }
}

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

// Security Headers: Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allow Leaflet / Tile maps and inline SVG
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cookie Parser for HttpOnly Refresh Tokens
app.use(cookieParser());

// Initialize cron jobs
cronJobs.initCronJobs();

// Inject socket into req
app.use((req, res, next) => {
  req.io = io;
  next();
});

const { apiLimiter } = require('./middleware/rateLimiter');

// Hardened CORS Origin Whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests, matched origins, Vercel domains, or all non-production requests
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.CLIENT_URL === '*' ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not allowed'));
  },
  credentials: true
}));

// Health check endpoint for cloud monitoring (Render, AWS, Vercel)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Aurora Hydrogen Hub Backend',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Global Rate Limiting for all /api endpoints
app.use('/api', apiLimiter);
app.use(express.json({ limit: '10mb' }));


app.use((req, res, next) => {
  logger.info(`[REQ] ${req.method} ${req.url}`);
  res.on('finish', () => {
    logger.info(`[RES] ${req.method} ${req.url} ${res.statusCode}`);
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/dispensers', dispenserRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.post('/api/webhooks/razorpay', require('./controllers/walletController').razorpayWebhook);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/fleet', fleetRoutes);


if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
