const express = require('express');
const router = express.Router();

// GET /api/alerts - List alerts with filters
router.get('/', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      status = 'all',
      severity = 'all',
      agentId,
      limit = 50,
      offset = 0,
      hours = 24
    } = req.query;

    const where = {};
    
    // Filter by status
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    // Filter by severity
    if (severity !== 'all') {
      where.severity = severity.toUpperCase();
    }
    
    // Filter by agent
    if (agentId) {
      where.agentId = agentId;
    }
    
    // Filter by time range
    if (hours !== 'all') {
      const hoursBack = parseInt(hours);
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      where.createdAt = { gte: since };
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.alert.count({ where });

    res.json({
      success: true,
      data: alerts,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/alerts/active - Get only active alerts
router.get('/active', async (req, res) => {
  try {
    const { alertService } = req.app.locals;
    
    const activeAlerts = await alertService.getActiveAlerts();
    
    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const { alertService } = req.app.locals;
    const { hours = 24 } = req.query;
    
    const stats = await alertService.getAlertStats(parseInt(hours));
    
    res.json({
      success: true,
      data: stats,
      meta: {
        timeRangeHours: parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/alerts - Create manual alert
router.post('/', async (req, res) => {
  try {
    const { alertService } = req.app.locals;
    const { 
      agentId, 
      type, 
      severity, 
      title, 
      message, 
      details = {} 
    } = req.body;

    // Validate required fields
    if (!type || !severity || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, severity, title, message',
        timestamp: new Date().toISOString()
      });
    }

    const alert = await alertService.createManualAlert(
      agentId, 
      type, 
      severity, 
      title, 
      message, 
      details
    );

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge an alert
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { alertService } = req.app.locals;
    const { id } = req.params;
    const { acknowledgedBy = 'dashboard' } = req.body;

    const alert = await alertService.acknowledgeAlert(id, acknowledgedBy);

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/alerts/:id/resolve - Resolve an alert
router.put('/:id/resolve', async (req, res) => {
  try {
    const { alertService } = req.app.locals;
    const { id } = req.params;
    const { resolvedBy = 'dashboard' } = req.body;

    const alert = await alertService.resolveAlert(id, resolvedBy);

    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/alerts/:id - Delete an alert
router.delete('/:id', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { id } = req.params;

    await prisma.alert.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Alert deleted',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/alerts/:id - Get specific alert
router.get('/:id', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        }
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/alerts/test - Create test alert (development only)
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Test alerts not allowed in production'
    });
  }

  try {
    const { alertService } = req.app.locals;
    const { type = 'SYSTEM_ERROR' } = req.body;

    const alert = await alertService.createManualAlert(
      null,
      type,
      'INFO',
      'Test Alert',
      'This is a test alert created from the dashboard',
      { test: true, timestamp: new Date() }
    );

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Test alert created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;