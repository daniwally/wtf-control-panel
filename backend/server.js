const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 WTF Control Panel API - PRODUCTION MODE');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Health 
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'production',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'WTF Control Panel API - PRODUCTION MODE',
    mode: 'production',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/agents', '/api/metrics/overview', '/api/alerts/active']
  });
});

// API Base
app.get('/api', (req, res) => {
  res.json({
    message: 'WTF Control Panel API Ready',
    mode: 'production',
    endpoints: ['/api/agents', '/api/metrics/overview', '/api/alerts/active'],
    timestamp: new Date().toISOString()
  });
});

// Agents
app.get('/api/agents', (req, res) => {
  console.log('📊 /api/agents called');
  res.json({
    success: true,
    data: [
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
      },
      {
        id: 'fermin-001',
        name: 'fermin',
        type: 'assistant',
        status: 'ONLINE',
        lastSeen: new Date(),
        lastActivity: new Date(),
        uptime: 7200,
        activeAlerts: 0,
        totalLogs: 32,
        totalMetrics: 67
      }
    ],
    timestamp: new Date().toISOString(),
    mode: 'production'
  });
});

// Metrics
app.get('/api/metrics/overview', (req, res) => {
  console.log('📈 /api/metrics/overview called');
  res.json({
    success: true,
    data: {
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
    },
    timestamp: new Date().toISOString(),
    mode: 'production'
  });
});

// Alerts
app.get('/api/alerts/active', (req, res) => {
  console.log('🚨 /api/alerts/active called');
  res.json({
    success: true,
    data: [
      {
        id: 'alert-001',
        type: 'HEARTBEAT_MISSED',
        severity: 'WARNING',
        title: 'Heartbeat Missed - oscar',
        message: 'oscar no envía heartbeat hace más de 10 minutos',
        agentName: 'oscar',
        timestamp: new Date(Date.now() - 600000)
      }
    ],
    count: 1,
    timestamp: new Date().toISOString(),
    mode: 'production'
  });
});

// System Status
app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      overall: 'healthy',
      components: {
        database: { status: 'mock' },
        agentCollector: { status: 'running' },
        alertService: { status: 'running' }
      },
      metrics: {
        totalAgents: 2,
        activeAgents: 1,
        activeAlerts: 1,
        recentDataPoints: 144
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    },
    mode: 'production'
  });
});

// 404
app.use('*', (req, res) => {
  console.log('❌ 404:', req.originalUrl);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    mode: 'production',
    availableEndpoints: ['/health', '/api/agents', '/api/metrics/overview', '/api/alerts/active'],
    timestamp: new Date().toISOString()
  });
});

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WTF Control Panel API running on port ${PORT}`);
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