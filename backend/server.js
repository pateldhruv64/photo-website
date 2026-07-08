require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Headers ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: true, // Reflexively allow requesting origin (localhost, IP address, etc.) for easy local network testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Compression ─────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parser ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Cookie Parser ───────────────────────────────────────────────────
app.use(cookieParser());

// ─── Rate Limiting ───────────────────────────────────────────────────
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});

const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many requests. Please try again later.' }
});

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api', publicLimiter, publicRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// ─── Health Check ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Database Connection + Start Server ──────────────────────────────
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 defaults are good, no need for useNewUrlParser etc.
    });
    console.log('✅ MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

startServer();
