const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting Simple WTF Control Panel API...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://wtf-control-panel-production-295c.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'mock',
    uptime: process.uptime(),
    version: 'simple-api'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WTF Control Panel API - Simple Mode',
    timestamp: new Date().toISOString(),
    version: 'simple-api',
    endpoints: ['/health', '/api/agents', '/api/metrics/overview', '/api/alerts/active']
  });
});

// Agents endpoint
app.get('/api/agents', (req, res) => {
  const agents = [
    {
      id: 'dora-001',
      name: 'dora',
      type: 'main',
      status: 'ONLINE',
      lastSeen: new Date(),
      lastActivity: new Date(),
      uptime: 3600,
      activeAlerts: 0,
      totalLogs: 15,
      totalMetrics: 42
    },
    {
      id: 'oscar-001', 
      name: 'oscar',
      type: 'communication',
      status: 'OFFLINE',
      lastSeen: new Date(Date.now() - 300000),
      lastActivity: new Date(Date.now() - 300000),
      uptime: 1800,
      activeAlerts: 1,
      totalLogs: 8,
      totalMetrics: 23
    }
  ];

  res.json({
    success: true,
    data: agents,
    timestamp: new Date().toISOString(),
    message: 'Mock data from simple API server'
  });
});

// Metrics endpoint
app.get('/api/metrics/overview', (req, res) => {
  const metrics = {
    agents: {
      total: 2,
      active: 1,
      offline: 1,
      error: 0
    },
    performance: {
      messagesProcessed: 156,
      tokensConsumed: 15420,
      apiCalls: 89,
      avgResponseTimeMs: 245,
      avgSuccessRate: 0.98,
      avgErrorRate: 0.02
    },
    costs: {
      totalUsd: 12.34,
      avgPerMessage: 0.079,
      avgPerToken: 0.0008
    },
    alerts: {
      active: 1
    },
    timeRange: {
      hours: 24,
      since: new Date(Date.now() - 24 * 60 * 60 * 1000),
      dataPoints: 144
    }
  };

  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
    message: 'Mock metrics data'
  });
});

// Alerts endpoint
app.get('/api/alerts/active', (req, res) => {
  const alerts = [
    {
      id: 'alert-001',
      type: 'HEARTBEAT_MISSED',
      severity: 'WARNING',
      title: 'Heartbeat Missed - oscar',
      message: 'oscar no envía heartbeat hace más de 10 minutos',
      agentName: 'oscar',
      timestamp: new Date(Date.now() - 600000)
    }
  ];

  res.json({
    success: true,
    data: alerts,
    count: alerts.length,
    timestamp: new Date().toISOString()
  });
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: ['/health', '/api/agents', '/api/metrics/overview', '/api/alerts/active']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple API server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Agents: http://localhost:${PORT}/api/agents`);
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics/overview`);
  console.log(`🚨 Alerts: http://localhost:${PORT}/api/alerts/active`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});