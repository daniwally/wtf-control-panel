const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting MINIMAL WTF Control Panel API...');

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Health 
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'minimal',
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'WTF Control Panel API - MINIMAL Mode',
    server: 'minimal',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/agents', '/api/metrics/overview']
  });
});

// API Test endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'API working',
    server: 'minimal',
    endpoints: ['/api/agents', '/api/metrics/overview', '/api/alerts/active']
  });
});

// Agents - INLINE (no external files)
app.get('/api/agents', (req, res) => {
  console.log('📊 API /agents called');
  res.json({
    success: true,
    data: [
      {
        id: 'dora-001',
        name: 'dora',
        type: 'main',
        status: 'ONLINE',
        lastSeen: new Date(),
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
        activeAlerts: 1,
        totalLogs: 8,
        totalMetrics: 23
      }
    ],
    timestamp: new Date().toISOString(),
    server: 'minimal'
  });
});

// Metrics - INLINE
app.get('/api/metrics/overview', (req, res) => {
  console.log('📈 API /metrics/overview called');
  res.json({
    success: true,
    data: {
      agents: { total: 2, active: 1, offline: 1, error: 0 },
      performance: {
        messagesProcessed: 156,
        avgResponseTimeMs: 245,
        avgSuccessRate: 0.98
      },
      costs: { totalUsd: 12.34 },
      alerts: { active: 1 }
    },
    timestamp: new Date().toISOString(),
    server: 'minimal'
  });
});

// Alerts - INLINE
app.get('/api/alerts/active', (req, res) => {
  console.log('🚨 API /alerts/active called');
  res.json({
    success: true,
    data: [{
      id: 'alert-001',
      type: 'HEARTBEAT_MISSED',
      severity: 'WARNING',
      title: 'Oscar offline',
      message: 'oscar no responde hace 5 minutos',
      agentName: 'oscar'
    }],
    timestamp: new Date().toISOString(),
    server: 'minimal'
  });
});

// Catch all
app.use('*', (req, res) => {
  console.log('❌ 404:', req.originalUrl);
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    server: 'minimal',
    availableEndpoints: ['/health', '/api/agents', '/api/metrics/overview', '/api/alerts/active']
  });
});

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MINIMAL server running on port ${PORT}`);
  console.log(`📊 Test: http://localhost:${PORT}/api/agents`);
});

// Error handling
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);