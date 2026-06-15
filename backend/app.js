const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const cargoRoutes = require('./routes/cargo');
const warehouseRoutes = require('./routes/warehouse');
const dispatchRoutes = require('./routes/dispatch');
const dashboardRoutes = require('./routes/dashboard');
const activityLogRoutes = require('./routes/activityLogs');
const notificationRoutes = require('./routes/notifications');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();

// Global middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin (Vite may use 5173, 5174, etc.)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = process.env.CORS_ORIGIN || 'http://localhost:5173';
    callback(origin === allowed ? null : new Error('Not allowed by CORS'), origin === allowed);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger in dev
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Wildcard 404
app.use('*', (req, res, next) => {
  const error = new Error(`Cannot find ${req.method} ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
