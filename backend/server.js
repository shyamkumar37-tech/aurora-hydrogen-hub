const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
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

if (!process.env.RAZORPAY_KEY && process.env.RAZORPAY_KEY_ID) {
  process.env.RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID;
}

const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI', 'RAZORPAY_KEY', 'RAZORPAY_WEBHOOK_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`FATAL ERROR: Environment variable ${envVar} is missing.`);
    process.exit(1);
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
    // Allow non-browser requests (e.g. mobile apps, server-to-server, curl) or matched origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not allowed'));
  },
  credentials: true
}));

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
