/**
 * Real Metrics Loader for WTF Control Panel
 * Loads real agent data from OpenClaw integrator
 */

const fs = require('fs');
const path = require('path');

class RealMetricsLoader {
  constructor() {
    this.dataPath = path.join(__dirname, '../real-agent-data.json');
    this.fallbackData = this.getFallbackData();
  }

  async loadRealData() {
    try {
      // Check if real data exists
      if (fs.existsSync(this.dataPath)) {
        const rawData = await fs.promises.readFile(this.dataPath, 'utf8');
        const data = JSON.parse(rawData);
        
        // Check if data is recent (less than 5 minutes old)
        const dataAge = Date.now() - new Date(data.metrics.timestamp).getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (dataAge < maxAge) {
          console.log('📊 Using real OpenClaw data');
          return data;
        } else {
          console.log('⚠️ Real data is stale, using enhanced fallback');
        }
      }
    } catch (error) {
      console.log('❌ Error loading real data:', error.message);
    }
    
    console.log('🎭 Using enhanced mock data');
    return this.fallbackData;
  }

  getFallbackData() {
    // Enhanced fallback with realistic variations
    const baseTime = Date.now();
    
    return {
      agents: [
        {
          id: 'dora-001',
          name: 'dora',
          type: 'main',
          status: 'ONLINE',
          lastSeen: new Date(baseTime),
          lastActivity: new Date(baseTime),
          uptime: 14400 + Math.floor(Math.random() * 3600),
          activeAlerts: 0,
          totalLogs: 45 + Math.floor(Math.random() * 15),
          totalMetrics: 128 + Math.floor(Math.random() * 30),
          realAgent: false,
          performance: {
            messagesProcessed: 89 + Math.floor(Math.random() * 20),
            tokensConsumed: 8750 + Math.floor(Math.random() * 2000),
            apiCalls: 45 + Math.floor(Math.random() * 10),
            avgResponseTimeMs: 180 + Math.floor(Math.random() * 100),
            successRate: 0.96 + Math.random() * 0.03,
            errorRate: Math.random() * 0.04,
            costUsd: 8.45 + Math.random() * 3
          }
        },
        {
          id: 'oscar-001',
          name: 'oscar',
          type: 'communication',
          status: Math.random() > 0.7 ? 'OFFLINE' : 'ONLINE',
          lastSeen: new Date(baseTime - (Math.random() > 0.7 ? 600000 : 0)),
          lastActivity: new Date(baseTime - (Math.random() > 0.7 ? 600000 : 30000)),
          uptime: 7200 + Math.floor(Math.random() * 1800),
          activeAlerts: Math.random() > 0.7 ? 1 : 0,
          totalLogs: 23 + Math.floor(Math.random() * 8),
          totalMetrics: 67 + Math.floor(Math.random() * 15),
          realAgent: false,
          performance: {
            messagesProcessed: 34 + Math.floor(Math.random() * 15),
            tokensConsumed: 3200 + Math.floor(Math.random() * 800),
            apiCalls: 18 + Math.floor(Math.random() * 8),
            avgResponseTimeMs: 220 + Math.floor(Math.random() * 80),
            successRate: 0.94 + Math.random() * 0.05,
            errorRate: Math.random() * 0.06,
            costUsd: 3.20 + Math.random() * 2
          }
        },
        {
          id: 'fermin-001',
          name: 'fermin',
          type: 'assistant',
          status: 'ONLINE',
          lastSeen: new Date(baseTime),
          lastActivity: new Date(baseTime - 120000),
          uptime: 9600 + Math.floor(Math.random() * 2400),
          activeAlerts: 0,
          totalLogs: 56 + Math.floor(Math.random() * 12),
          totalMetrics: 89 + Math.floor(Math.random() * 25),
          realAgent: false,
          performance: {
            messagesProcessed: 67 + Math.floor(Math.random() * 18),
            tokensConsumed: 6400 + Math.floor(Math.random() * 1500),
            apiCalls: 35 + Math.floor(Math.random() * 12),
            avgResponseTimeMs: 195 + Math.floor(Math.random() * 90),
            successRate: 0.97 + Math.random() * 0.02,
            errorRate: Math.random() * 0.03,
            costUsd: 5.67 + Math.random() * 2.5
          }
        }
      ],
      metrics: {
        timestamp: new Date(),
        realData: false
      }
    };
  }

  calculateAggregateMetrics(agents) {
    const activeAgents = agents.filter(a => a.status === 'ONLINE');
    const totalPerformance = agents.reduce((sum, agent) => {
      const perf = agent.performance || {};
      return {
        messagesProcessed: sum.messagesProcessed + (perf.messagesProcessed || 0),
        tokensConsumed: sum.tokensConsumed + (perf.tokensConsumed || 0),
        apiCalls: sum.apiCalls + (perf.apiCalls || 0),
        totalResponseTime: sum.totalResponseTime + (perf.avgResponseTimeMs || 250),
        totalSuccessRate: sum.totalSuccessRate + (perf.successRate || 0.95),
        totalErrorRate: sum.totalErrorRate + (perf.errorRate || 0.05),
        totalCost: sum.totalCost + (perf.costUsd || 0)
      };
    }, {
      messagesProcessed: 0,
      tokensConsumed: 0,
      apiCalls: 0,
      totalResponseTime: 0,
      totalSuccessRate: 0,
      totalErrorRate: 0,
      totalCost: 0
    });

    return {
      agents: {
        total: agents.length,
        active: activeAgents.length,
        offline: agents.filter(a => a.status === 'OFFLINE').length,
        error: agents.filter(a => a.status === 'ERROR').length
      },
      performance: {
        messagesProcessed: totalPerformance.messagesProcessed,
        tokensConsumed: totalPerformance.tokensConsumed,
        apiCalls: totalPerformance.apiCalls,
        avgResponseTimeMs: totalPerformance.totalResponseTime / agents.length,
        avgSuccessRate: totalPerformance.totalSuccessRate / agents.length,
        avgErrorRate: totalPerformance.totalErrorRate / agents.length
      },
      costs: {
        totalUsd: totalPerformance.totalCost,
        avgPerMessage: totalPerformance.totalCost / Math.max(totalPerformance.messagesProcessed, 1),
        avgPerToken: totalPerformance.totalCost / Math.max(totalPerformance.tokensConsumed, 1)
      },
      alerts: {
        active: agents.filter(a => a.activeAlerts > 0).length
      },
      timestamp: new Date()
    };
  }
}

module.exports = RealMetricsLoader;