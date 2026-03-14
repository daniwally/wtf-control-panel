// Force start with basic API routes
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting WTF Control Panel Backend with Basic APIs...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: !!process.env.DATABASE_URL ? 'configured' : 'missing',
    uptime: process.uptime()
  });
});

// Basic API routes
const basicRoutes = require('./src/routes/basic');
app.use('/api', basicRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});