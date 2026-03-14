const express = require('express');
const router = express.Router();

// Basic agents endpoint
router.get('/agents', async (req, res) => {
  try {
    const mockAgents = [
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
        lastSeen: new Date(Date.now() - 300000), // 5 min ago
        lastActivity: new Date(Date.now() - 300000),
        uptime: 1800,
        activeAlerts: 1,
        totalLogs: 8,
        totalMetrics: 23
      }
    ];

    res.json({
      success: true,
      data: mockAgents,
      timestamp: new Date().toISOString(),
      message: 'Mock data - database not connected yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic metrics endpoint
router.get('/metrics/overview', async (req, res) => {
  try {
    const mockMetrics = {
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
      data: mockMetrics,
      timestamp: new Date().toISOString(),
      message: 'Mock data - database not connected yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic alerts endpoint
router.get('/alerts/active', async (req, res) => {
  try {
    const mockAlerts = [
      {
        id: 'alert-001',
        type: 'HEARTBEAT_MISSED',
        severity: 'WARNING',
        title: 'Heartbeat Missed - oscar',
        message: '💓 HEARTBEAT PERDIDO: oscar no envía heartbeat hace más de 10 minutos',
        agentName: 'oscar',
        timestamp: new Date(Date.now() - 600000) // 10 min ago
      }
    ];

    res.json({
      success: true,
      data: mockAlerts,
      count: mockAlerts.length,
      timestamp: new Date().toISOString(),
      message: 'Mock data - database not connected yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic system status
router.get('/system/status', async (req, res) => {
  try {
    const systemStatus = {
      overall: 'warning',
      components: {
        database: { status: 'connecting' },
        agentCollector: { status: 'idle' },
        alertService: { status: 'running' }
      },
      metrics: {
        totalAgents: 2,
        activeAgents: 1,
        activeAlerts: 1,
        recentDataPoints: 0
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString(),
      message: 'Mock data - database not connected yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;