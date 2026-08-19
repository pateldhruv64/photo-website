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
//
// Production origins yahan list hote hain. Naya domain add karna ho to
// code chhune ki zaroorat nahi — .env me CORS_ORIGINS=https://a.com,https://b.com
// daal do.
const ALLOWED_ORIGINS = [
  'https://photo-website-livid.vercel.app',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];

// Dev me localhost ka port fix nahi hota — 3000 busy ho to Next apne aap
// 3001, 3002 pe chala jaata hai. Pehle sirf 3000 whitelisted tha, isliye
// us haalat me har API call CORS par mar jaati thi. Ab dev me koi bhi
// localhost port chalta hai; production me sirf upar wali list.
const isLocalhost = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

const allowLocalhost = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Origin header server-to-server calls aur curl me hota hi nahi.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (allowLocalhost && isLocalhost(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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
  message: { error: 'Too many requests. Please try again later.' },
  // Client gallery ka apna, kaafi zyada khula limiter hai (neeche).
  // Ek client 200 photos wali gallery se ek-ek karke download kare to
  // 100/min wala limit turant lag jaata tha aur downloads chup-chaap
  // fail hone lagti thi — wahi "photo download hi nahi hoti" wali problem.
  skip: (req) => req.path.startsWith('/client-gallery/')
});

// Client gallery: har photo ek request hai, isliye limit udaar hai.
// Phir bhi password-brute-force se bachne ke liye unlock alag hai.
const galleryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 600,
  message: { error: 'Too many download requests. Please wait a minute.' }
});

const galleryUnlockLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again in a few minutes.' }
});

const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many requests. Please try again later.' }
});

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/client-gallery/unlock', galleryUnlockLimiter);
app.use('/api/client-gallery', galleryLimiter);
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
