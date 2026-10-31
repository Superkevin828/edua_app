require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const filesRoutes = require('./routes/files');
const { protect } = require('./middleware/auth');

const app = express();

// Render sits behind its own proxy; trust exactly one hop so req.ip reflects
// the address Render saw, not a client-supplied X-Forwarded-For value.
app.set('trust proxy', 1);

// Connect to MongoDB
try{
    const connectDB = require('./config/db');
    connectDB();
    console.log('MongoDB Connected');
}catch(err){
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
}


// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
    origin: ['https://edua-app.onrender.com','http://localhost:3000','https://edua-app.pages.dev','https://lashawnda-sceptical-ora.ngrok-free.dev','https://cybqa.pesapal.com/pesapalv3'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ============================================
// Client IP + Rate Limiting
// ============================================
// Trust the forwarded client IP only when the request really came from our
// Cloudflare Worker, which proves itself with the shared PROXY_SECRET.
app.use((req, res, next) => {
    const secret = process.env.PROXY_SECRET;
    if (secret && req.headers['x-proxy-secret'] === secret) {
        const ip = req.headers['x-real-client-ip'];
        if (ip) {
            Object.defineProperty(req, 'ip', { value: ip, configurable: true });
        }
    }
    next();
});

// express-rate-limit v6 keys on req.ip. v7+ exports ipKeyGenerator for correct
// IPv6 handling, so use it when available.
const ipKey =
    typeof rateLimit.ipKeyGenerator === 'function'
        ? (req) => rateLimit.ipKeyGenerator(req.ip)
        : (req) => req.ip;

if (!process.env.PROXY_SECRET) {
    console.warn('PROXY_SECRET is not set: Worker traffic will share one rate-limit bucket.');
}

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120, // per real visitor per minute
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKey,
    handler: (req, res) =>
        res.status(429).json({ error: 'Too many requests, slow down.' }),
});

app.use('/api', apiLimiter);

// ============================================
// API Routes
// ============================================
// Lightweight endpoint with no DB query — safe to ping every few minutes
// from an external uptime monitor (e.g. UptimeRobot, cron-job.org) to keep
// the free-tier instance from spinning down due to inactivity.
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.post('/api/checkout', protect, paymentRoutes.createOrder);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', filesRoutes);
// ============================================
// Practice File Downloads
// ============================================
// Serve downloadable practice files (e.g., /practice/test.zip)
app.get('/practice/:filename', (req, res) => {
    const filePath = path.join(__dirname, '..', 'frontend', 'public', 'practice', req.params.filename);
    
    if (!require('fs').existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return res.status(404).send('File not found');
    }
    
    res.download(filePath, (err) => {
        if (err) {
            console.error(`Download error: ${err.message}`);
            if (!res.headersSent) {
                res.status(500).send('Error downloading file');
            }
        }
    });
});



// ============================================
// Error Handling
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Fire-and-forget: warm up the Pesapal token + IPN id in the background
    // so they're already cached by the time a real user clicks Subscribe,
    // instead of making their first checkout request wait through it.
    paymentRoutes.warmUpPesapal();
});