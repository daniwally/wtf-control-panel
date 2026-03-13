const express = require('express');
const router = express.Router();

// GET /api/agents - List all agents with status
router.get('/', async (req, res) => {
  try {
    const { prisma, agentCollector } = req.app.locals;
    
    const agents = await agentCollector.getAgentSummary();
    
    res.json({
      success: true,
      data: agents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/agents/:id - Get specific agent details
router.get('/:id', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        metrics: {
          take: 100,
          orderBy: { timestamp: 'desc' }
        },
        logs: {
          take: 50,
          orderBy: { timestamp: 'desc' }
        },
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        },
        heartbeats: {
          take: 20,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: agent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/agents/:id/metrics - Get agent metrics with time range
router.get('/:id/metrics', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { id } = req.params;
    const { 
      hours = 24, 
      limit = 1000,
      granularity = 'minute' // minute, hour, day
    } = req.query;

    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    let metrics = await prisma.agentMetric.findMany({
      where: {
        agentId: id,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    // Group by granularity if needed
    if (granularity === 'hour' && metrics.length > 100) {
      metrics = groupMetricsByHour(metrics);
    }

    res.json({
      success: true,
      data: metrics,
      meta: {
        count: metrics.length,
        timeRange: { since, hours: hoursBack },
        granularity
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/agents/:id/status - Get current agent status
router.get('/:id/status', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        lastSeen: true,
        lastActivity: true,
        uptime: true
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Get latest metrics
    const latestMetric = await prisma.agentMetric.findFirst({
      where: { agentId: id },
      orderBy: { timestamp: 'desc' }
    });

    // Get latest heartbeat
    const latestHeartbeat = await prisma.heartbeat.findFirst({
      where: { agentId: id },
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      success: true,
      data: {
        ...agent,
        latestMetric,
        latestHeartbeat,
        isOnline: agent.status === 'ONLINE',
        lastSeenAgo: agent.lastSeen ? Date.now() - agent.lastSeen.getTime() : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/agents/:id/heartbeat - Record heartbeat from agent
router.post('/:id/heartbeat', async (req, res) => {
  try {
    const { agentCollector } = req.app.locals;
    const { id } = req.params;
    const { status, checks } = req.body;

    // Find agent by ID or name
    const agent = await req.app.locals.prisma.agent.findFirst({
      where: {
        OR: [
          { id },
          { name: id }
        ]
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    await agentCollector.recordHeartbeat(agent.name, status, checks);

    res.json({
      success: true,
      message: 'Heartbeat recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording heartbeat:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to group metrics by hour
function groupMetricsByHour(metrics) {
  const grouped = {};
  
  metrics.forEach(metric => {
    const hour = new Date(metric.timestamp);
    hour.setMinutes(0, 0, 0);
    const key = hour.toISOString();
    
    if (!grouped[key]) {
      grouped[key] = {
        timestamp: hour,
        messagesProcessed: 0,
        tokensConsumed: 0,
        costUsd: 0,
        responseTimeMs: [],
        successRate: [],
        errorRate: [],
        count: 0
      };
    }
    
    const group = grouped[key];
    group.messagesProcessed += metric.messagesProcessed;
    group.tokensConsumed += metric.tokensConsumed;
    group.costUsd += metric.costUsd;
    
    if (metric.responseTimeMs) group.responseTimeMs.push(metric.responseTimeMs);
    if (metric.successRate) group.successRate.push(metric.successRate);
    if (metric.errorRate) group.errorRate.push(metric.errorRate);
    
    group.count++;
  });
  
  // Calculate averages
  return Object.values(grouped).map(group => ({
    timestamp: group.timestamp,
    messagesProcessed: group.messagesProcessed,
    tokensConsumed: group.tokensConsumed,
    costUsd: group.costUsd,
    responseTimeMs: group.responseTimeMs.length > 0 
      ? group.responseTimeMs.reduce((a, b) => a + b, 0) / group.responseTimeMs.length 
      : null,
    successRate: group.successRate.length > 0
      ? group.successRate.reduce((a, b) => a + b, 0) / group.successRate.length
      : null,
    errorRate: group.errorRate.length > 0
      ? group.errorRate.reduce((a, b) => a + b, 0) / group.errorRate.length
      : null
  }));
}

module.exports = router;