require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/database');
const { startScheduler } = require('./services/scheduler.service');

// Route imports
const authRoutes     = require('./routes/auth.routes');
const bookingRoutes  = require('./routes/booking.routes');
const calendarRoutes = require('./routes/calendar.routes');
const packageRoutes  = require('./routes/package.routes');
const analyticsRoutes= require('./routes/analytics.routes');
const agentRoutes = require('./routes/agent.routes');
const reviewRoutes   = require('./routes/review.routes');   // ← NEW

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Mount routes
app.use('/api/auth',      authRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/calendar',  calendarRoutes);
app.use('/api/packages',  packageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/reviews',   reviewRoutes);   // ← NEW

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎧 DJ Booking API running on port ${PORT}`);
  startScheduler();
});
