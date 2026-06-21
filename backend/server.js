require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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

const app = express();

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
    origin: ['http://localhost:3000','https://edua-app.pages.dev'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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