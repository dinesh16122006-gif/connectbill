require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { initScheduler } = require('./services/billScheduler');

// Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const providerRoutes = require('./routes/providerRoutes');
const planRoutes = require('./routes/planRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingRoutes = require('./routes/settingRoutes');
const supportRoutes = require('./routes/supportRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiter for OTP requests (max 10 requests per 15 minutes per IP)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api/auth/customer/send-otp', otpLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ConnectBill Backend API',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/search', searchRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Bootstrap Server & DB
const startServer = async () => {
  try {
    await connectDB();
    initScheduler();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 ConnectBill API Server running on port ${PORT}`);
      console.log(`🌍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💳 Razorpay Simulation: ${process.env.RAZORPAY_SIMULATE !== 'false'}`);
      console.log(`📲 Mock OTP Mode: ${process.env.MOCK_OTP_MODE !== 'false'}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
