const express = require('express');
const router = express.Router();

// GET /api/logs - Get logs with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      level = 'all',
      agentId,
      source,
      sessionId,
      search,
      limit = 100,
      offset = 0,
      hours = 24,
      order = 'desc'
    } = req.query;

    const where = {};
    
    // Filter by log level
    if (level !== 'all') {
      where.level = level.toUpperCase();
    }
    
    // Filter by agent
    if (agentId && agentId !== 'all') {
      where.agentId = agentId;
    }
    
    // Filter by source
    if (source) {
      where.source = source;
    }
    
    // Filter by session ID
    if (sessionId) {
      where.sessionId = sessionId;
    }
    
    // Search in message content
    if (search) {
      where.message = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Filter by time range
    if (hours !== 'all') {
      const hoursBack = parseInt(hours);
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      where.timestamp = { gte: since };
    }

    const logs = await prisma.agentLog.findMany({
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
      orderBy: { timestamp: order === 'desc' ? 'desc' : 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.agentLog.count({ where });

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit),
        filters: {
          level,
          agentId: agentId || 'all',
          source,
          sessionId,
          search,
          hours: hours === 'all' ? 'all' : parseInt(hours)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/logs/levels - Get available log levels with counts
router.get('/levels', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { hours = 24 } = req.query;

    const where = {};
    
    if (hours !== 'all') {
      const hoursBack = parseInt(hours);
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      where.timestamp = { gte: since };
    }

    const levelCounts = await prisma.agentLog.groupBy({
      by: ['level'],
      where,
      _count: {
        level: true
      },
      orderBy: {
        level: 'asc'
      }
    });

    const levels = levelCounts.map(item => ({
      level: item.level,
      count: item._count.level
    }));

    res.json({
      success: true,
      data: levels,
      meta: {
        timeRangeHours: hours === 'all' ? 'all' : parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching log levels:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/logs/sources - Get available log sources with counts
router.get('/sources', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { hours = 24 } = req.query;

    const where = {};
    
    if (hours !== 'all') {
      const hoursBack = parseInt(hours);
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      where.timestamp = { gte: since };
    }

    const sourceCounts = await prisma.agentLog.groupBy({
      by: ['source'],
      where: {
        ...where,
        source: {
          not: null
        }
      },
      _count: {
        source: true
      },
      orderBy: {
        _count: {
          source: 'desc'
        }
      }
    });

    const sources = sourceCounts.map(item => ({
      source: item.source,
      count: item._count.source
    }));

    res.json({
      success: true,
      data: sources,
      meta: {
        timeRangeHours: hours === 'all' ? 'all' : parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching log sources:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/logs/timeline - Get log timeline data for charts
router.get('/timeline', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      hours = 24,
      interval = 'hour',
      level = 'all',
      agentId
    } = req.query;

    const hoursBack = parseInt(hours);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const where = {
      timestamp: { gte: since }
    };

    if (level !== 'all') {
      where.level = level.toUpperCase();
    }

    if (agentId && agentId !== 'all') {
      where.agentId = agentId;
    }

    const logs = await prisma.agentLog.findMany({
      where,
      select: {
        timestamp: true,
        level: true
      },
      orderBy: { timestamp: 'asc' }
    });

    // Group by time interval
    const timeline = groupLogsByInterval(logs, interval);

    res.json({
      success: true,
      data: timeline,
      meta: {
        interval,
        hours: hoursBack,
        level: level === 'all' ? 'all' : level,
        agentId: agentId || 'all',
        dataPoints: timeline.length,
        totalLogs: logs.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching log timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/logs/:id - Get specific log entry
router.get('/:id', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { id } = req.params;

    const log = await prisma.agentLog.findUnique({
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

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log entry not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: log,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching log entry:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/logs - Create new log entry (for agents to submit logs)
router.post('/', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      agentName,
      level = 'INFO',
      message,
      context,
      source,
      sessionId,
      userId 
    } = req.body;

    // Validate required fields
    if (!agentName || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentName, message',
        timestamp: new Date().toISOString()
      });
    }

    // Find the agent
    const agent = await prisma.agent.findUnique({
      where: { name: agentName }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentName} not found`,
        timestamp: new Date().toISOString()
      });
    }

    // Create log entry
    const log = await prisma.agentLog.create({
      data: {
        agentId: agent.id,
        level: level.toUpperCase(),
        message,
        context: context || {},
        source,
        sessionId,
        userId,
        timestamp: new Date()
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Broadcast to WebSocket clients if it's an error or warning
    if (['ERROR', 'WARN', 'FATAL'].includes(level.toUpperCase())) {
      req.app.locals.io?.emit('log:new', {
        id: log.id,
        agentName,
        level: log.level,
        message: log.message,
        timestamp: log.timestamp
      });
    }

    res.status(201).json({
      success: true,
      data: log,
      message: 'Log entry created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating log entry:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/logs - Bulk delete logs with filters
router.delete('/', async (req, res) => {
  try {
    const { prisma } = req.app.locals;
    const { 
      level,
      agentId,
      olderThan, // hours
      confirm = false 
    } = req.query;

    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Must set confirm=true to delete logs',
        timestamp: new Date().toISOString()
      });
    }

    const where = {};
    
    if (level && level !== 'all') {
      where.level = level.toUpperCase();
    }
    
    if (agentId && agentId !== 'all') {
      where.agentId = agentId;
    }
    
    if (olderThan) {
      const cutoff = new Date(Date.now() - parseInt(olderThan) * 60 * 60 * 1000);
      where.timestamp = { lt: cutoff };
    }

    const deletedCount = await prisma.agentLog.deleteMany({
      where
    });

    res.json({
      success: true,
      data: {
        deletedCount: deletedCount.count
      },
      message: `Deleted ${deletedCount.count} log entries`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to group logs by time interval
function groupLogsByInterval(logs, interval) {
  const grouped = {};
  
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    let key;
    
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
        total: 0,
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        FATAL: 0
      };
    }
    
    grouped[key].total++;
    grouped[key][log.level] = (grouped[key][log.level] || 0) + 1;
  });
  
  return Object.values(grouped).sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
}

module.exports = router;