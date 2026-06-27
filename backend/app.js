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
const userRoutes = require('./routes/users');
const rulesRoutes = require('./routes/rules');
const aiOperationsRoutes = require('./routes/aiOperations');
const messageRoutes = require('./routes/messages');
const awbRoutes = require('./routes/awb');
const weightRoutes = require('./routes/weight');
const pickupRoutes = require('./routes/pickup');

const app = express();

// Global middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost origin (Vite may use 5173, 5174, etc.)
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    // Allow any Vercel deployment (including preview deployments)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow custom CORS_ORIGIN env var (e.g. custom domain)
    const allowed = process.env.CORS_ORIGIN;
    if (allowed && origin === allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
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
app.use('/api/users', userRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/ai-operations', aiOperationsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/awb', awbRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/pickup', pickupRoutes);


// Wildcard 404
app.use('*', (req, res, next) => {
  const error = new Error(`Cannot find ${req.method} ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
