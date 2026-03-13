const websocketHandler = (io, prisma, services) => {
  const { agentCollector, alertService } = services;
  
  console.log('🔌 WebSocket server initialized');

  io.on('connection', (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // Send initial data when client connects
    socket.emit('connection:established', {
      message: 'Connected to Agent Dashboard',
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });

    // Send current system status
    sendInitialData(socket);

    // Handle client subscription to specific agent updates
    socket.on('subscribe:agent', (agentId) => {
      socket.join(`agent:${agentId}`);
      console.log(`👤 ${socket.id} subscribed to agent:${agentId}`);
    });

    // Handle client unsubscription
    socket.on('unsubscribe:agent', (agentId) => {
      socket.leave(`agent:${agentId}`);
      console.log(`👤 ${socket.id} unsubscribed from agent:${agentId}`);
    });

    // Handle subscription to all alerts
    socket.on('subscribe:alerts', () => {
      socket.join('alerts');
      console.log(`👤 ${socket.id} subscribed to alerts`);
    });

    // Handle subscription to system metrics
    socket.on('subscribe:system', () => {
      socket.join('system');
      console.log(`👤 ${socket.id} subscribed to system metrics`);
    });

    // Handle manual refresh request
    socket.on('refresh:agents', async () => {
      try {
        const agents = await agentCollector.getAgentSummary();
        socket.emit('agents:data', agents);
      } catch (error) {
        socket.emit('error', {
          type: 'refresh_failed',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle manual alert check
    socket.on('refresh:alerts', async () => {
      try {
        const activeAlerts = await alertService.getActiveAlerts();
        socket.emit('alerts:data', activeAlerts);
      } catch (error) {
        socket.emit('error', {
          type: 'refresh_failed',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle ping/pong for connection monitoring
    socket.on('ping', (timestamp) => {
      socket.emit('pong', {
        clientTimestamp: timestamp,
        serverTimestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`👤 Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle client errors
    socket.on('error', (error) => {
      console.error(`👤 Client error ${socket.id}:`, error);
    });
  });

  // Function to send initial data to newly connected clients
  async function sendInitialData(socket) {
    try {
      // Send current agents status
      const agents = await agentCollector.getAgentSummary();
      socket.emit('agents:data', agents);

      // Send active alerts
      const activeAlerts = await alertService.getActiveAlerts();
      socket.emit('alerts:data', activeAlerts);

      // Send system metrics
      const systemMetrics = await getLatestSystemMetrics();
      socket.emit('system:metrics', systemMetrics);

    } catch (error) {
      console.error('Error sending initial data:', error);
      socket.emit('error', {
        type: 'initial_data_failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Helper function to get latest system metrics
  async function getLatestSystemMetrics() {
    try {
      const latest = await prisma.systemMetric.findFirst({
        orderBy: { timestamp: 'desc' }
      });

      if (!latest) {
        return {
          totalAgents: 0,
          activeAgents: 0,
          totalMessages: 0,
          totalCost: 0,
          avgResponseTime: null
        };
      }

      return latest;
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return null;
    }
  }

  // Broadcast functions for services to use
  const broadcast = {
    // Agent status updates
    agentStatus: (agentData) => {
      io.emit('agent:status', agentData);
      io.to(`agent:${agentData.agentId}`).emit('agent:update', agentData);
    },

    // Agent heartbeat
    agentHeartbeat: (heartbeatData) => {
      io.emit('agent:heartbeat', heartbeatData);
      io.to(`agent:${heartbeatData.agentId}`).emit('agent:heartbeat', heartbeatData);
    },

    // New alert
    newAlert: (alertData) => {
      io.to('alerts').emit('alert:new', alertData);
      io.emit('alert:new', alertData); // Also send to all clients
    },

    // Alert acknowledged
    alertAcknowledged: (alertData) => {
      io.to('alerts').emit('alert:acknowledged', alertData);
      io.emit('alert:acknowledged', alertData);
    },

    // Alert resolved
    alertResolved: (alertData) => {
      io.to('alerts').emit('alert:resolved', alertData);
      io.emit('alert:resolved', alertData);
    },

    // System metrics update
    systemMetrics: (metricsData) => {
      io.to('system').emit('system:metrics', metricsData);
      io.emit('system:metrics', metricsData);
    },

    // General system notification
    systemNotification: (notification) => {
      io.emit('system:notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Periodic heartbeat to all clients
  setInterval(() => {
    io.emit('server:heartbeat', {
      timestamp: new Date().toISOString(),
      connectedClients: io.engine.clientsCount
    });
  }, 30000); // Every 30 seconds

  // Stats logging
  setInterval(() => {
    const clientCount = io.engine.clientsCount;
    if (clientCount > 0) {
      console.log(`📊 WebSocket stats: ${clientCount} connected clients`);
    }
  }, 60000); // Every minute

  return broadcast;
};

module.exports = websocketHandler;