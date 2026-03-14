const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
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
    data: getCurrentAgents(),
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
      ...getCurrentMetrics(),
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

// WebSocket handling
let agentStatuses = {
  'dora-001': 'ONLINE',
  'oscar-001': 'OFFLINE', 
  'fermin-001': 'ONLINE'
};

io.on('connection', (socket) => {
  console.log(`👤 Client connected: ${socket.id}`);
  
  // Send initial data
  socket.emit('agents:status', getCurrentAgents());
  socket.emit('metrics:update', getCurrentMetrics());
  
  socket.on('disconnect', () => {
    console.log(`👤 Client disconnected: ${socket.id}`);
  });
});

// Simulate real-time agent status changes
setInterval(() => {
  // Randomly change agent statuses
  const agents = Object.keys(agentStatuses);
  const randomAgent = agents[Math.floor(Math.random() * agents.length)];
  
  if (Math.random() > 0.85) { // 15% chance of status change
    agentStatuses[randomAgent] = agentStatuses[randomAgent] === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    
    console.log(`🔄 Agent ${randomAgent} changed to ${agentStatuses[randomAgent]}`);
    
    // Broadcast to all clients
    io.emit('agent:statusChange', {
      agentId: randomAgent,
      status: agentStatuses[randomAgent],
      timestamp: new Date()
    });
  }
  
  // Update metrics every 30 seconds
  io.emit('metrics:update', getCurrentMetrics());
}, 10000); // Every 10 seconds

function getCurrentAgents() {
  return [
    {
      id: 'dora-001',
      name: 'dora',
      type: 'main',
      status: agentStatuses['dora-001'],
      lastSeen: new Date(),
      lastActivity: new Date(),
      uptime: 3600 + Math.floor(Math.random() * 1000),
      activeAlerts: agentStatuses['dora-001'] === 'OFFLINE' ? 1 : 0,
      totalLogs: 15 + Math.floor(Math.random() * 10),
      totalMetrics: 42 + Math.floor(Math.random() * 20)
    },
    {
      id: 'oscar-001',
      name: 'oscar',
      type: 'communication', 
      status: agentStatuses['oscar-001'],
      lastSeen: agentStatuses['oscar-001'] === 'ONLINE' ? new Date() : new Date(Date.now() - 300000),
      lastActivity: agentStatuses['oscar-001'] === 'ONLINE' ? new Date() : new Date(Date.now() - 300000),
      uptime: 1800 + Math.floor(Math.random() * 500),
      activeAlerts: agentStatuses['oscar-001'] === 'OFFLINE' ? 1 : 0,
      totalLogs: 8 + Math.floor(Math.random() * 5),
      totalMetrics: 23 + Math.floor(Math.random() * 10)
    },
    {
      id: 'fermin-001',
      name: 'fermin',
      type: 'assistant',
      status: agentStatuses['fermin-001'],
      lastSeen: new Date(),
      lastActivity: new Date(),
      uptime: 7200 + Math.floor(Math.random() * 1500),
      activeAlerts: agentStatuses['fermin-001'] === 'OFFLINE' ? 1 : 0,
      totalLogs: 32 + Math.floor(Math.random() * 15),
      totalMetrics: 67 + Math.floor(Math.random() * 30)
    }
  ];
}

function getCurrentMetrics() {
  const activeAgents = Object.values(agentStatuses).filter(s => s === 'ONLINE').length;
  const totalAgents = Object.keys(agentStatuses).length;
  
  return {
    agents: {
      total: totalAgents,
      active: activeAgents,
      offline: totalAgents - activeAgents,
      error: 0
    },
    performance: {
      messagesProcessed: 156 + Math.floor(Math.random() * 50),
      tokensConsumed: 15420 + Math.floor(Math.random() * 2000),
      apiCalls: 89 + Math.floor(Math.random() * 20),
      avgResponseTimeMs: 245 + Math.floor(Math.random() * 100),
      avgSuccessRate: 0.95 + Math.random() * 0.05,
      avgErrorRate: Math.random() * 0.05
    },
    costs: {
      totalUsd: 12.34 + Math.random() * 5,
      avgPerMessage: 0.079,
      avgPerToken: 0.0008
    },
    alerts: {
      active: Object.values(agentStatuses).filter(s => s === 'OFFLINE').length
    },
    timestamp: new Date()
  };
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WTF Control Panel API running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Agents: http://localhost:${PORT}/api/agents`);
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics/overview`);
  console.log(`🚨 Alerts: http://localhost:${PORT}/api/alerts/active`);
  console.log(`🔌 WebSocket: Real-time updates enabled`);
});

// Error handling  
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});