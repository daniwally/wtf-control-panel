require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

const { PrismaClient } = require('@prisma/client');
const agentRoutes = require('./routes/agents');
const metricRoutes = require('./routes/metrics');
const alertRoutes = require('./routes/alerts');
const logRoutes = require('./routes/logs');
const systemRoutes = require('./routes/system');

const AgentCollectorService = require('./services/AgentCollectorService');
const AlertService = require('./services/AlertService');
const websocketHandler = require('./websocket/websocketHandler');

// Initialize
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Services
const agentCollector = new AgentCollectorService(prisma, io);
const alertService = new AlertService(prisma, io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make services available to routes
app.locals.prisma = prisma;
app.locals.io = io;
app.locals.agentCollector = agentCollector;
app.locals.alertService = alertService;

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/system', systemRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// WebSocket handling
websocketHandler(io, prisma, { agentCollector, alertService });

// Cron jobs
console.log('🕐 Setting up cron jobs...');

// Collect agent data every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  try {
    await agentCollector.collectAllAgents();
  } catch (error) {
    console.error('Agent collection error:', error);
  }
});

// Check for alerts every minute
cron.schedule('* * * * *', async () => {
  try {
    await alertService.evaluateAlertRules();
  } catch (error) {
    console.error('Alert evaluation error:', error);
  }
});

// Clean up old data daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('🧹 Running daily cleanup...');
    
    // Delete logs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.agentLog.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    // Delete metrics older than 90 days  
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    await prisma.agentMetric.deleteMany({
      where: {
        timestamp: {
          lt: ninetyDaysAgo
        }
      }
    });
    
    console.log('✅ Daily cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Agent Dashboard Backend running on port ${PORT}`);
  console.log(`📊 Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💗 Health: http://localhost:${PORT}/health`);
  
  try {
    await prisma.$connect();
    console.log('📦 Database connected successfully');
    
    // Initialize services
    await agentCollector.initialize();
    console.log('🤖 Agent collector initialized');
    
  } catch (error) {
    console.error('❌ Startup error:', error);
  }
});

module.exports = { app, server, prisma };