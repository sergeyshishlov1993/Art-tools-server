require('dotenv').config();
const express = require('express');
const cors = require('cors');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const telegramService = require('./services/telegramService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        message: 'ART-TOOLS API',
        version: '2.0',
        status: 'running'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.APP_PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    telegramService.init();
});

module.exports = app;
