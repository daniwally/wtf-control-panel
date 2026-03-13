const express = require('express');
const router = express.Router();

// GET /api/metrics/overview - System overview metrics
router.get('/overview', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { hours = 24 } = req.query;
    
    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Get agent count and status
    const agents = await prisma.agent.findMany();
    const activeAgents = agents.filter(a => a.status === 'ONLINE');

    // Get metrics for the time period
    const metrics = await prisma.agentMetric.findMany({
      where: {
        timestamp: { gte: since }
      }
    });

    // Calculate aggregates
    const totalMessages = metrics.reduce((sum, m) => sum + m.messagesProcessed, 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.tokensConsumed, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.costUsd, 0);
    const totalApiCalls = metrics.reduce((sum, m) => sum + m.apiCalls, 0);

    // Calculate averages
    const responseTimeSamples = metrics.filter(m => m.responseTimeMs !== null);
    const avgResponseTime = responseTimeSamples.length > 0
      ? responseTimeSamples.reduce((sum, m) => sum + m.responseTimeMs, 0) / responseTimeSamples.length
      : null;

    const successRateSamples = metrics.filter(m => m.successRate !== null);
    const avgSuccessRate = successRateSamples.length > 0
      ? successRateSamples.reduce((sum, m) => sum + m.successRate, 0) / successRateSamples.length
      : null;

    const errorRateSamples = metrics.filter(m => m.errorRate !== null);
    const avgErrorRate = errorRateSamples.length > 0
      ? errorRateSamples.reduce((sum, m) => sum + m.errorRate, 0) / errorRateSamples.length
      : null;

    // Get active alerts count
    const activeAlertsCount = await prisma.alert.count({
      where: { status: 'ACTIVE' }
    });

    const overview = {
      agents: {
        total: agents.length,
        active: activeAgents.length,
        offline: agents.filter(a => a.status === 'OFFLINE').length,
        error: agents.filter(a => a.status === 'ERROR').length
      },
      performance: {
        messagesProcessed: totalMessages,
        tokensConsumed: totalTokens,
        apiCalls: totalApiCalls,
        avgResponseTimeMs: avgResponseTime,
        avgSuccessRate: avgSuccessRate,
        avgErrorRate: avgErrorRate
      },
      costs: {
        totalUsd: totalCost,
        avgPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
        avgPerToken: totalTokens > 0 ? totalCost / totalTokens : 0
      },
      alerts: {
        active: activeAlertsCount
      },
      timeRange: {
        hours: hoursBack,
        since,
        dataPoints: metrics.length
      }
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/metrics/timeseries - Time series data for charts
router.get('/timeseries', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      metric = 'messagesProcessed',
      hours = 24,
      interval = 'hour',
      agentId 
    } = req.query;

    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const where = {
      timestamp: { gte: since }
    };

    if (agentId && agentId !== 'all') {
      where.agentId = agentId;
    }

    const metrics = await prisma.agentMetric.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      include: {
        agent: {
          select: { name: true, type: true }
        }
      }
    });

    // Group by interval
    const grouped = groupByInterval(metrics, interval);

    res.json({
      success: true,
      data: grouped,
      meta: {
        metric,
        interval,
        hours: hoursBack,
        agentId: agentId || 'all',
        dataPoints: grouped.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching timeseries:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/metrics/agents/comparison - Compare agents performance
router.get('/agents/comparison', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { hours = 24 } = req.query;

    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const agentMetrics = await prisma.agentMetric.findMany({
      where: {
        timestamp: { gte: since }
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true }
        }
      }
    });

    // Group by agent
    const byAgent = {};
    
    agentMetrics.forEach(metric => {
      const agentId = metric.agentId;
      if (!byAgent[agentId]) {
        byAgent[agentId] = {
          agent: metric.agent,
          metrics: []
        };
      }
      byAgent[agentId].metrics.push(metric);
    });

    // Calculate totals and averages for each agent
    const comparison = Object.values(byAgent).map(({ agent, metrics }) => {
      const totals = {
        messagesProcessed: metrics.reduce((sum, m) => sum + m.messagesProcessed, 0),
        tokensConsumed: metrics.reduce((sum, m) => sum + m.tokensConsumed, 0),
        costUsd: metrics.reduce((sum, m) => sum + m.costUsd, 0),
        apiCalls: metrics.reduce((sum, m) => sum + m.apiCalls, 0)
      };

      const responseTimeSamples = metrics.filter(m => m.responseTimeMs !== null);
      const avgResponseTime = responseTimeSamples.length > 0
        ? responseTimeSamples.reduce((sum, m) => sum + m.responseTimeMs, 0) / responseTimeSamples.length
        : null;

      const successRateSamples = metrics.filter(m => m.successRate !== null);
      const avgSuccessRate = successRateSamples.length > 0
        ? successRateSamples.reduce((sum, m) => sum + m.successRate, 0) / successRateSamples.length
        : null;

      const errorRateSamples = metrics.filter(m => m.errorRate !== null);
      const avgErrorRate = errorRateSamples.length > 0
        ? errorRateSamples.reduce((sum, m) => sum + m.errorRate, 0) / errorRateSamples.length
        : null;

      return {
        agent,
        totals,
        averages: {
          responseTimeMs: avgResponseTime,
          successRate: avgSuccessRate,
          errorRate: avgErrorRate
        },
        dataPoints: metrics.length
      };
    });

    res.json({
      success: true,
      data: comparison,
      meta: {
        hours: hoursBack,
        agentCount: comparison.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent comparison:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/metrics/costs - Cost analysis
router.get('/costs', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { hours = 24, groupBy = 'agent' } = req.query;

    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const metrics = await prisma.agentMetric.findMany({
      where: {
        timestamp: { gte: since }
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    let costData;
    
    if (groupBy === 'agent') {
      // Group by agent
      const byAgent = {};
      metrics.forEach(metric => {
        const agentName = metric.agent.name;
        if (!byAgent[agentName]) {
          byAgent[agentName] = {
            name: agentName,
            type: metric.agent.type,
            totalCost: 0,
            tokensConsumed: 0,
            messagesProcessed: 0
          };
        }
        byAgent[agentName].totalCost += metric.costUsd;
        byAgent[agentName].tokensConsumed += metric.tokensConsumed;
        byAgent[agentName].messagesProcessed += metric.messagesProcessed;
      });
      
      costData = Object.values(byAgent);
    } else if (groupBy === 'time') {
      // Group by time intervals
      costData = groupByInterval(metrics, 'hour', 'costUsd');
    }

    const totalCost = metrics.reduce((sum, m) => sum + m.costUsd, 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.tokensConsumed, 0);
    const totalMessages = metrics.reduce((sum, m) => sum + m.messagesProcessed, 0);

    res.json({
      success: true,
      data: costData,
      summary: {
        totalCost,
        totalTokens,
        totalMessages,
        avgCostPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
        avgCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0
      },
      meta: {
        hours: hoursBack,
        groupBy,
        dataPoints: costData.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cost metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to group metrics by time interval
function groupByInterval(metrics, interval, sumField = null) {
  const grouped = {};
  
  metrics.forEach(metric => {
    let key;
    const date = new Date(metric.timestamp);
    
    if (interval === 'hour') {
      date.setMinutes(0, 0, 0);
      key = date.toISOString();
    } else if (interval === 'day') {
      date.setHours(0, 0, 0, 0);
      key = date.toISOString();
    } else if (interval === 'minute') {
      date.setSeconds(0, 0);
      key = date.toISOString();
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        timestamp: date,
        messagesProcessed: 0,
        tokensConsumed: 0,
        costUsd: 0,
        apiCalls: 0,
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
    group.apiCalls += metric.apiCalls;
    
    if (metric.responseTimeMs) group.responseTimeMs.push(metric.responseTimeMs);
    if (metric.successRate) group.successRate.push(metric.successRate);
    if (metric.errorRate) group.errorRate.push(metric.errorRate);
    
    group.count++;
  });
  
  // Calculate averages and return array
  return Object.values(grouped).map(group => ({
    timestamp: group.timestamp,
    messagesProcessed: group.messagesProcessed,
    tokensConsumed: group.tokensConsumed,
    costUsd: group.costUsd,
    apiCalls: group.apiCalls,
    avgResponseTimeMs: group.responseTimeMs.length > 0 
      ? group.responseTimeMs.reduce((a, b) => a + b, 0) / group.responseTimeMs.length 
      : null,
    avgSuccessRate: group.successRate.length > 0
      ? group.successRate.reduce((a, b) => a + b, 0) / group.successRate.length
      : null,
    avgErrorRate: group.errorRate.length > 0
      ? group.errorRate.reduce((a, b) => a + b, 0) / group.errorRate.length
      : null,
    dataPoints: group.count
  }));
}

module.exports = router;