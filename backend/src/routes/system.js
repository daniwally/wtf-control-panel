const express = require('express');
const router = express.Router();

// GET /api/system/status - Overall system health
router.get('/status', async (req, res) => {
  try {
    const { prisma, agentCollector, alertService } = req.app.locals;
    
    // Database health
    let dbHealth;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealth = { status: 'healthy', latency: null };
    } catch (error) {
      dbHealth = { status: 'unhealthy', error: error.message };
    }

    // Agent collector health
    const collectorHealth = {
      status: agentCollector.isCollecting ? 'collecting' : 'idle',
      lastRun: new Date() // This would be tracked in real implementation
    };

    // Get system metrics
    const agents = await prisma.agent.findMany();
    const activeAgents = agents.filter(a => a.status === 'ONLINE');
    const activeAlerts = await prisma.alert.count({
      where: { status: 'ACTIVE' }
    });

    // Recent metrics (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = await prisma.agentMetric.findMany({
      where: {
        timestamp: { gte: oneHourAgo }
      }
    });

    const systemStatus = {
      overall: activeAgents.length === agents.length && activeAlerts === 0 
        ? 'healthy' 
        : activeAlerts > 0 
          ? 'degraded' 
          : 'warning',
      components: {
        database: dbHealth,
        agentCollector: collectorHealth,
        alertService: { status: 'running' }
      },
      metrics: {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        activeAlerts,
        recentDataPoints: recentMetrics.length
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/system/info - System information
router.get('/info', (req, res) => {
  const systemInfo = {
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    cpu: process.cpuUsage(),
    pid: process.pid,
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    data: systemInfo,
    timestamp: new Date().toISOString()
  });
});

// GET /api/system/metrics/history - Historical system metrics
router.get('/metrics/history', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      hours = 24,
      limit = 1000
    } = req.query;

    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const systemMetrics = await prisma.systemMetric.findMany({
      where: {
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: systemMetrics,
      meta: {
        count: systemMetrics.length,
        timeRange: { since, hours: hoursBack }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system metrics history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/system/collect - Force agent collection
router.post('/collect', async (req, res) => {
  try {
    const { agentCollector } = req.app.locals;
    
    // Trigger collection in background
    agentCollector.collectAllAgents()
      .then(() => console.log('✅ Manual collection completed'))
      .catch(err => console.error('❌ Manual collection failed:', err));
    
    res.json({
      success: true,
      message: 'Agent collection triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering collection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/system/alerts/check - Force alert evaluation
router.post('/alerts/check', async (req, res) => {
  try {
    const { alertService } = req.app.locals;
    
    // Trigger alert evaluation in background
    alertService.evaluateAlertRules()
      .then(() => console.log('✅ Manual alert evaluation completed'))
      .catch(err => console.error('❌ Manual alert evaluation failed:', err));
    
    res.json({
      success: true,
      message: 'Alert evaluation triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering alert evaluation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/system/performance - Performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { hours = 1 } = req.query;
    
    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Get recent metrics for performance analysis
    const metrics = await prisma.agentMetric.findMany({
      where: {
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate performance stats
    const responseTimeSamples = metrics
      .filter(m => m.responseTimeMs !== null)
      .map(m => m.responseTimeMs)
      .sort((a, b) => a - b);

    const performance = {
      responseTime: {
        samples: responseTimeSamples.length,
        avg: responseTimeSamples.length > 0 
          ? responseTimeSamples.reduce((a, b) => a + b, 0) / responseTimeSamples.length 
          : null,
        p50: responseTimeSamples.length > 0 
          ? responseTimeSamples[Math.floor(responseTimeSamples.length * 0.5)] 
          : null,
        p95: responseTimeSamples.length > 0 
          ? responseTimeSamples[Math.floor(responseTimeSamples.length * 0.95)] 
          : null,
        p99: responseTimeSamples.length > 0 
          ? responseTimeSamples[Math.floor(responseTimeSamples.length * 0.99)] 
          : null,
        min: responseTimeSamples.length > 0 ? Math.min(...responseTimeSamples) : null,
        max: responseTimeSamples.length > 0 ? Math.max(...responseTimeSamples) : null
      },
      throughput: {
        totalMessages: metrics.reduce((sum, m) => sum + m.messagesProcessed, 0),
        messagesPerHour: hoursBack > 0 
          ? metrics.reduce((sum, m) => sum + m.messagesProcessed, 0) / hoursBack 
          : 0,
        totalTokens: metrics.reduce((sum, m) => sum + m.tokensConsumed, 0),
        tokensPerHour: hoursBack > 0 
          ? metrics.reduce((sum, m) => sum + m.tokensConsumed, 0) / hoursBack 
          : 0
      },
      reliability: {
        totalSamples: metrics.length,
        avgSuccessRate: metrics.filter(m => m.successRate !== null).length > 0
          ? metrics
              .filter(m => m.successRate !== null)
              .reduce((sum, m) => sum + m.successRate, 0) 
              / metrics.filter(m => m.successRate !== null).length
          : null,
        avgErrorRate: metrics.filter(m => m.errorRate !== null).length > 0
          ? metrics
              .filter(m => m.errorRate !== null)
              .reduce((sum, m) => sum + m.errorRate, 0) 
              / metrics.filter(m => m.errorRate !== null).length
          : null
      },
      costs: {
        totalCost: metrics.reduce((sum, m) => sum + m.costUsd, 0),
        costPerHour: hoursBack > 0 
          ? metrics.reduce((sum, m) => sum + m.costUsd, 0) / hoursBack 
          : 0,
        costPerMessage: metrics.reduce((sum, m) => sum + m.messagesProcessed, 0) > 0
          ? metrics.reduce((sum, m) => sum + m.costUsd, 0) 
            / metrics.reduce((sum, m) => sum + m.messagesProcessed, 0)
          : 0
      },
      timeRange: {
        hours: hoursBack,
        since,
        dataPoints: metrics.length
      }
    };

    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/system/cleanup - Clean old data
router.delete('/cleanup', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      logDays = 30,
      metricDays = 90,
      alertDays = 30,
      dryRun = false 
    } = req.query;

    const logCutoff = new Date(Date.now() - parseInt(logDays) * 24 * 60 * 60 * 1000);
    const metricCutoff = new Date(Date.now() - parseInt(metricDays) * 24 * 60 * 60 * 1000);
    const alertCutoff = new Date(Date.now() - parseInt(alertDays) * 24 * 60 * 60 * 1000);

    let deletedCounts = {};

    if (dryRun === 'true') {
      // Count what would be deleted
      deletedCounts = {
        logs: await prisma.agentLog.count({
          where: { timestamp: { lt: logCutoff } }
        }),
        metrics: await prisma.agentMetric.count({
          where: { timestamp: { lt: metricCutoff } }
        }),
        alerts: await prisma.alert.count({
          where: { 
            status: 'RESOLVED',
            resolvedAt: { lt: alertCutoff }
          }
        })
      };
    } else {
      // Actually delete
      const [logResult, metricResult, alertResult] = await Promise.all([
        prisma.agentLog.deleteMany({
          where: { timestamp: { lt: logCutoff } }
        }),
        prisma.agentMetric.deleteMany({
          where: { timestamp: { lt: metricCutoff } }
        }),
        prisma.alert.deleteMany({
          where: { 
            status: 'RESOLVED',
            resolvedAt: { lt: alertCutoff }
          }
        })
      ]);

      deletedCounts = {
        logs: logResult.count,
        metrics: metricResult.count,
        alerts: alertResult.count
      };
    }

    res.json({
      success: true,
      data: deletedCounts,
      meta: {
        dryRun: dryRun === 'true',
        cutoffs: {
          logs: logCutoff,
          metrics: metricCutoff,
          alerts: alertCutoff
        }
      },
      message: dryRun === 'true' ? 'Dry run completed' : 'Cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;