const axios = require('axios');

class AgentCollectorService {
  constructor(prisma, io) {
    this.prisma = prisma;
    this.io = io;
    this.openclawApiUrl = process.env.OPENCLAW_API_URL || 'http://localhost:8080';
    this.isCollecting = false;
    
    console.log('🤖 AgentCollectorService initialized');
  }

  async initialize() {
    // Ensure we have the main agents in the database
    await this.ensureMainAgents();
  }

  async ensureMainAgents() {
    try {
      // Dora (main agent)
      await this.prisma.agent.upsert({
        where: { name: 'dora' },
        update: { type: 'main' },
        create: {
          name: 'dora',
          type: 'main',
          status: 'OFFLINE',
          environment: process.env.NODE_ENV || 'development'
        }
      });

      // Oscar (communication agent)
      await this.prisma.agent.upsert({
        where: { name: 'oscar' },
        update: { type: 'communication' },
        create: {
          name: 'oscar',
          type: 'communication', 
          status: 'OFFLINE',
          environment: process.env.NODE_ENV || 'development'
        }
      });

      console.log('✅ Main agents ensured in database');
    } catch (error) {
      console.error('❌ Error ensuring main agents:', error);
    }
  }

  async collectAllAgents() {
    if (this.isCollecting) {
      return; // Prevent concurrent collections
    }

    this.isCollecting = true;

    try {
      // Get all known agents from database
      const agents = await this.prisma.agent.findMany();
      
      for (const agent of agents) {
        await this.collectAgentData(agent);
      }

      // Also discover any new agents from OpenClaw API
      await this.discoverNewAgents();

      // Update system metrics
      await this.updateSystemMetrics();

    } catch (error) {
      console.error('❌ Error collecting agents:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  async collectAgentData(agent) {
    try {
      // Try to get session info for this agent
      const sessionData = await this.getSessionData(agent.name);
      
      if (sessionData) {
        // Agent is online
        await this.updateAgentStatus(agent.id, 'ONLINE', sessionData);
        await this.collectAgentMetrics(agent.id, sessionData);
        
        // Broadcast update via WebSocket
        this.io.emit('agent:status', {
          agentId: agent.id,
          name: agent.name,
          status: 'ONLINE',
          lastSeen: new Date(),
          metrics: sessionData
        });

      } else {
        // Agent appears offline
        await this.updateAgentStatus(agent.id, 'OFFLINE');
        
        this.io.emit('agent:status', {
          agentId: agent.id,
          name: agent.name,
          status: 'OFFLINE',
          lastSeen: agent.lastSeen
        });
      }

    } catch (error) {
      console.error(`❌ Error collecting data for agent ${agent.name}:`, error);
      
      // Mark as error state
      await this.updateAgentStatus(agent.id, 'ERROR');
      
      this.io.emit('agent:status', {
        agentId: agent.id,
        name: agent.name,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  async getSessionData(agentName) {
    try {
      // This would be the actual OpenClaw API call
      // For now, we'll simulate it
      
      if (agentName === 'dora') {
        // Simulate Dora being online with some metrics
        return {
          status: 'active',
          lastActivity: new Date(),
          messagesProcessed: Math.floor(Math.random() * 50),
          responseTime: 150 + Math.random() * 100,
          tokensUsed: Math.floor(Math.random() * 1000),
          cost: Math.random() * 5,
          uptime: Math.floor(Math.random() * 86400), // seconds
        };
      }

      if (agentName === 'oscar') {
        // Simulate Oscar being online but less active
        return {
          status: 'active',
          lastActivity: new Date(),
          messagesProcessed: Math.floor(Math.random() * 20),
          responseTime: 200 + Math.random() * 150,
          tokensUsed: Math.floor(Math.random() * 500),
          cost: Math.random() * 2,
          uptime: Math.floor(Math.random() * 86400),
        };
      }

      // Agent not found/offline
      return null;

    } catch (error) {
      console.error(`Error getting session data for ${agentName}:`, error);
      return null;
    }
  }

  async updateAgentStatus(agentId, status, sessionData = null) {
    const updateData = {
      status,
      lastSeen: new Date()
    };

    if (sessionData) {
      updateData.lastActivity = sessionData.lastActivity || new Date();
      updateData.uptime = sessionData.uptime || 0;
    }

    await this.prisma.agent.update({
      where: { id: agentId },
      data: updateData
    });
  }

  async collectAgentMetrics(agentId, sessionData) {
    try {
      await this.prisma.agentMetric.create({
        data: {
          agentId,
          messagesProcessed: sessionData.messagesProcessed || 0,
          responseTimeMs: sessionData.responseTime || null,
          tokensConsumed: sessionData.tokensUsed || 0,
          costUsd: sessionData.cost || 0,
          apiCalls: sessionData.messagesProcessed || 0,
          successRate: 0.95 + Math.random() * 0.05, // Simulate 95-100% success
          errorRate: Math.random() * 0.05, // Simulate 0-5% error
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error(`Error saving metrics for agent ${agentId}:`, error);
    }
  }

  async discoverNewAgents() {
    try {
      // This would call OpenClaw API to discover running agents
      // For now, we'll skip this as we have our main agents defined
      
      console.log('🔍 Agent discovery completed');
    } catch (error) {
      console.error('Error discovering new agents:', error);
    }
  }

  async updateSystemMetrics() {
    try {
      const agents = await this.prisma.agent.findMany();
      const activeAgents = agents.filter(a => a.status === 'ONLINE');
      
      // Get recent metrics for totals
      const recentMetrics = await this.prisma.agentMetric.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      const totalMessages = recentMetrics.reduce((sum, m) => sum + m.messagesProcessed, 0);
      const totalCost = recentMetrics.reduce((sum, m) => sum + m.costUsd, 0);
      const avgResponseTime = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + (m.responseTimeMs || 0), 0) / recentMetrics.length
        : null;

      await this.prisma.systemMetric.create({
        data: {
          totalAgents: agents.length,
          activeAgents: activeAgents.length,
          totalMessages,
          totalCost,
          avgResponseTime,
          timestamp: new Date()
        }
      });

      // Broadcast system update
      this.io.emit('system:metrics', {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        totalMessages,
        totalCost,
        avgResponseTime
      });

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  // Method to simulate heartbeat from agents
  async recordHeartbeat(agentName, status, checks = {}) {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { name: agentName }
      });

      if (!agent) {
        console.warn(`Agent ${agentName} not found for heartbeat`);
        return;
      }

      await this.prisma.heartbeat.create({
        data: {
          agentId: agent.id,
          status: status.toUpperCase(),
          checks,
          timestamp: new Date()
        }
      });

      // Broadcast heartbeat
      this.io.emit('agent:heartbeat', {
        agentId: agent.id,
        name: agentName,
        status,
        checks,
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`Error recording heartbeat for ${agentName}:`, error);
    }
  }

  // Get agent summary for API
  async getAgentSummary() {
    try {
      const agents = await this.prisma.agent.findMany({
        include: {
          _count: {
            select: {
              metrics: true,
              logs: true,
              alerts: {
                where: { status: 'ACTIVE' }
              }
            }
          }
        }
      });

      return agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        lastSeen: agent.lastSeen,
        lastActivity: agent.lastActivity,
        uptime: agent.uptime,
        restartCount: agent.restartCount,
        activeAlerts: agent._count.alerts,
        totalLogs: agent._count.logs,
        totalMetrics: agent._count.metrics
      }));

    } catch (error) {
      console.error('Error getting agent summary:', error);
      throw error;
    }
  }
}

module.exports = AgentCollectorService;