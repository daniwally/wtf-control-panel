const axios = require('axios');

class AlertService {
  constructor(prisma, io) {
    this.prisma = prisma;
    this.io = io;
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || '5054931521'; // Wally's chat ID
    this.alertRules = this.initializeAlertRules();
    
    console.log('🚨 AlertService initialized');
  }

  initializeAlertRules() {
    return {
      agentOffline: {
        type: 'AGENT_OFFLINE',
        severity: 'CRITICAL',
        condition: (agent) => {
          if (!agent.lastSeen) return false;
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return agent.status === 'OFFLINE' && agent.lastSeen < fiveMinutesAgo;
        },
        message: (agent) => `🔴 AGENTE OFFLINE: ${agent.name} lleva más de 5 minutos sin responder`,
        cooldown: 15 * 60 * 1000 // 15 minutes
      },

      highErrorRate: {
        type: 'HIGH_ERROR_RATE',
        severity: 'WARNING',
        condition: async (agent) => {
          const recent = await this.getRecentMetrics(agent.id, 15); // Last 15 minutes
          if (recent.length === 0) return false;
          const avgErrorRate = recent.reduce((sum, m) => sum + (m.errorRate || 0), 0) / recent.length;
          return avgErrorRate > 0.1; // 10% error rate
        },
        message: (agent, data) => `⚠️ ALTA TASA DE ERRORES: ${agent.name} tiene ${(data.errorRate * 100).toFixed(1)}% de errores`,
        cooldown: 30 * 60 * 1000 // 30 minutes
      },

      slowResponse: {
        type: 'SLOW_RESPONSE',
        severity: 'WARNING',
        condition: async (agent) => {
          const recent = await this.getRecentMetrics(agent.id, 10); // Last 10 minutes
          if (recent.length === 0) return false;
          const avgResponseTime = recent.reduce((sum, m) => sum + (m.responseTimeMs || 0), 0) / recent.length;
          return avgResponseTime > 30000; // 30 seconds
        },
        message: (agent, data) => `🐌 RESPUESTA LENTA: ${agent.name} responde en ${(data.responseTime / 1000).toFixed(1)}s promedio`,
        cooldown: 20 * 60 * 1000 // 20 minutes
      },

      costSpike: {
        type: 'COST_SPIKE',
        severity: 'WARNING',
        condition: async (agent) => {
          const lastHour = await this.getRecentMetrics(agent.id, 60); // Last hour
          const previousHour = await this.getMetricsFromTo(agent.id, 120, 60); // Hour before that
          
          if (lastHour.length === 0 || previousHour.length === 0) return false;
          
          const currentCost = lastHour.reduce((sum, m) => sum + m.costUsd, 0);
          const previousCost = previousHour.reduce((sum, m) => sum + m.costUsd, 0);
          
          return previousCost > 0 && (currentCost / previousCost) > 1.5; // 50% increase
        },
        message: (agent, data) => `💰 PICO DE COSTOS: ${agent.name} incrementó gastos ${((data.increase - 1) * 100).toFixed(0)}%`,
        cooldown: 60 * 60 * 1000 // 1 hour
      },

      heartbeatMissed: {
        type: 'HEARTBEAT_MISSED',
        severity: 'WARNING',
        condition: async (agent) => {
          const lastHeartbeat = await this.prisma.heartbeat.findFirst({
            where: { agentId: agent.id },
            orderBy: { timestamp: 'desc' }
          });
          
          if (!lastHeartbeat) return false;
          
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          return lastHeartbeat.timestamp < tenMinutesAgo;
        },
        message: (agent) => `💓 HEARTBEAT PERDIDO: ${agent.name} no envía heartbeat hace más de 10 minutos`,
        cooldown: 15 * 60 * 1000 // 15 minutes
      }
    };
  }

  async evaluateAlertRules() {
    try {
      const agents = await this.prisma.agent.findMany();
      
      for (const agent of agents) {
        for (const [ruleName, rule] of Object.entries(this.alertRules)) {
          await this.evaluateRule(agent, rule);
        }
      }
      
    } catch (error) {
      console.error('Error evaluating alert rules:', error);
    }
  }

  async evaluateRule(agent, rule) {
    try {
      // Check if we're in cooldown for this rule
      const recentAlert = await this.prisma.alert.findFirst({
        where: {
          agentId: agent.id,
          type: rule.type,
          createdAt: {
            gte: new Date(Date.now() - rule.cooldown)
          }
        }
      });

      if (recentAlert) {
        return; // Still in cooldown
      }

      // Evaluate the condition
      let conditionMet = false;
      let conditionData = {};

      if (typeof rule.condition === 'function') {
        const result = await rule.condition(agent);
        if (typeof result === 'object') {
          conditionMet = result.met;
          conditionData = result.data || {};
        } else {
          conditionMet = result;
        }
      }

      if (conditionMet) {
        await this.createAlert(agent, rule, conditionData);
      }

    } catch (error) {
      console.error(`Error evaluating rule ${rule.type} for agent ${agent.name}:`, error);
    }
  }

  async createAlert(agent, rule, data = {}) {
    try {
      const alert = await this.prisma.alert.create({
        data: {
          agentId: agent.id,
          type: rule.type,
          severity: rule.severity,
          title: `${rule.type.replace(/_/g, ' ')} - ${agent.name}`,
          message: rule.message(agent, data),
          details: { ...data, agent: { name: agent.name, type: agent.type } },
          status: 'ACTIVE'
        }
      });

      console.log(`🚨 Alert created: ${alert.message}`);

      // Send notifications
      await this.sendNotifications(alert);

      // Broadcast via WebSocket
      this.io.emit('alert:new', {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        agentName: agent.name,
        timestamp: alert.createdAt
      });

      return alert;

    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async sendNotifications(alert) {
    const notifications = [];

    try {
      // Send Telegram notification
      if (this.telegramBotToken) {
        const telegramResult = await this.sendTelegramNotification(alert);
        notifications.push({ type: 'telegram', success: telegramResult });
      }

      // Update alert with notification tracking
      await this.prisma.alert.update({
        where: { id: alert.id },
        data: {
          notificationsSent: notifications
        }
      });

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  async sendTelegramNotification(alert) {
    try {
      if (!this.telegramBotToken || !this.telegramChatId) {
        console.warn('Telegram bot token or chat ID not configured');
        return false;
      }

      const severityEmoji = {
        'CRITICAL': '🔴',
        'WARNING': '🟡', 
        'INFO': '🔵'
      };

      const message = `${severityEmoji[alert.severity]} **DASHBOARD ALERT**

${alert.title}

${alert.message}

Timestamp: ${alert.createdAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`;

      const response = await axios.post(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'Markdown'
        },
        { timeout: 5000 }
      );

      return response.data.ok;

    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      return false;
    }
  }

  // Helper methods
  async getRecentMetrics(agentId, minutesBack) {
    const since = new Date(Date.now() - minutesBack * 60 * 1000);
    return await this.prisma.agentMetric.findMany({
      where: {
        agentId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getMetricsFromTo(agentId, minutesBackStart, minutesBackEnd) {
    const start = new Date(Date.now() - minutesBackStart * 60 * 1000);
    const end = new Date(Date.now() - minutesBackEnd * 60 * 1000);
    
    return await this.prisma.agentMetric.findMany({
      where: {
        agentId,
        timestamp: {
          gte: end,
          lte: start
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  // API methods
  async getActiveAlerts() {
    return await this.prisma.alert.findMany({
      where: { status: 'ACTIVE' },
      include: { agent: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy
      }
    });

    this.io.emit('alert:acknowledged', {
      id: alertId,
      acknowledgedBy,
      timestamp: new Date()
    });

    return alert;
  }

  async resolveAlert(alertId, resolvedBy) {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy
      }
    });

    this.io.emit('alert:resolved', {
      id: alertId,
      resolvedBy,
      timestamp: new Date()
    });

    return alert;
  }

  // Manual alert creation
  async createManualAlert(agentId, type, severity, title, message, details = {}) {
    const agent = agentId ? await this.prisma.agent.findUnique({
      where: { id: agentId }
    }) : null;

    return await this.createAlert(
      agent || { id: null, name: 'System' },
      {
        type,
        severity,
        message: () => message
      },
      { manual: true, ...details }
    );
  }

  // Get alert statistics
  async getAlertStats(timeRangeHours = 24) {
    const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    
    const stats = await this.prisma.alert.groupBy({
      by: ['severity', 'status'],
      where: {
        createdAt: { gte: since }
      },
      _count: true
    });

    return stats.reduce((acc, stat) => {
      if (!acc[stat.severity]) {
        acc[stat.severity] = {};
      }
      acc[stat.severity][stat.status] = stat._count;
      return acc;
    }, {});
  }
}

module.exports = AlertService;