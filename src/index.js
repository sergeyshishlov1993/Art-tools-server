require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const telegramService = require('./services/telegramService');
const { startTrackingSyncJob } = require('../jobs/trackingSyncJob');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);  // ✅ Створюємо HTTP server

socketService.init(server);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ART-TOOLS API Docs'
}));

app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.json({
        message: 'ART-TOOLS API',
        version: '2.0',
        status: 'running'
    });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.APP_PORT || 8000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
    console.log(`🔌 WebSocket ready`);

    telegramService.init();
    startTrackingSyncJob();
});

module.exports = { app, server };
