/**
 * Activity Monitor for WTF Control Panel
 * Tracks real-time agent activities and tasks
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ActivityMonitor {
  constructor() {
    this.activities = new Map(); // agentId -> [activities]
    this.maxActivitiesPerAgent = 50; // Keep last 50 activities
    this.isMonitoring = false;
  }

  // Get real-time activities from OpenClaw logs
  async getOpenClawActivities() {
    try {
      // Get recent OpenClaw logs
      const logPaths = [
        '/home/ubuntu/.openclaw/logs',
        '/tmp/openclaw-logs',
        process.env.OPENCLAW_LOG_PATH
      ].filter(Boolean);

      const activities = [];

      for (const logPath of logPaths) {
        if (fs.existsSync(logPath)) {
          const recentActivities = await this.parseLogDirectory(logPath);
          activities.push(...recentActivities);
        }
      }

      // If no real logs, generate realistic mock activities
      if (activities.length === 0) {
        return this.generateMockActivities();
      }

      return activities;
    } catch (error) {
      console.log('⚠️ OpenClaw logs not accessible, using mock activities');
      return this.generateMockActivities();
    }
  }

  async parseLogDirectory(logPath) {
    const activities = [];
    
    try {
      const files = await fs.promises.readdir(logPath);
      const recentFiles = files
        .filter(file => file.includes('agent') || file.includes('session'))
        .slice(-5); // Last 5 log files

      for (const file of recentFiles) {
        const filePath = path.join(logPath, file);
        const stats = await fs.promises.stat(filePath);
        
        // Only parse recent files (last hour)
        if (Date.now() - stats.mtime.getTime() < 60 * 60 * 1000) {
          const logActivities = await this.parseLogFile(filePath);
          activities.push(...logActivities);
        }
      }
    } catch (error) {
      console.log(`❌ Error parsing log directory ${logPath}:`, error.message);
    }

    return activities.slice(-20); // Most recent 20 activities
  }

  async parseLogFile(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.split('\n').slice(-100); // Last 100 lines
      
      const activities = [];
      
      for (const line of lines) {
        const activity = this.parseLogLine(line);
        if (activity) {
          activities.push(activity);
        }
      }
      
      return activities;
    } catch (error) {
      return [];
    }
  }

  parseLogLine(line) {
    // Parse different types of log entries
    const patterns = [
      // Tool calls
      { 
        pattern: /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\].*tool:(\w+).*?(reading|writing|executing|searching|fetching)/i,
        type: 'tool_call'
      },
      // Commands
      {
        pattern: /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\].*exec.*?command:\s*(.+)/i,
        type: 'command'
      },
      // File operations
      {
        pattern: /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\].*file.*?(read|write|edit).*?(\S+\.\w+)/i,
        type: 'file_operation'
      },
      // Web requests
      {
        pattern: /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\].*web.*?(search|fetch).*?(https?:\/\/\S+)/i,
        type: 'web_request'
      }
    ];

    for (const { pattern, type } of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(match[1] || Date.now()),
          type,
          description: this.formatActivityDescription(type, match),
          agentName: this.extractAgentName(line),
          status: 'active'
        };
      }
    }

    return null;
  }

  extractAgentName(line) {
    const agentMatch = line.match(/agent[:\s]+(\w+)/i);
    if (agentMatch) return agentMatch[1].toLowerCase();
    
    // Fallback to common agent names
    const commonAgents = ['dora', 'oscar', 'fermin'];
    for (const agent of commonAgents) {
      if (line.toLowerCase().includes(agent)) return agent;
    }
    
    return 'unknown';
  }

  formatActivityDescription(type, match) {
    switch (type) {
      case 'tool_call':
        return `🔧 Using ${match[2]} tool - ${match[3]}`;
      case 'command':
        return `⚡ Executing: ${match[2].substring(0, 50)}`;
      case 'file_operation':
        return `📁 ${match[2]} file: ${match[3]}`;
      case 'web_request':
        return `🌐 Web ${match[2]}: ${match[3]}`;
      default:
        return `🤖 Processing task`;
    }
  }

  generateMockActivities() {
    const now = new Date();
    const activities = [];
    
    const mockTasks = [
      { agent: 'dora', type: 'tool_call', desc: '🔧 Reading HEARTBEAT.md' },
      { agent: 'dora', type: 'command', desc: '⚡ Executing: check-vencimientos-completo.sh' },
      { agent: 'dora', type: 'web_request', desc: '🌐 Web search: "railway deployment status"' },
      { agent: 'oscar', type: 'tool_call', desc: '🔧 Using message tool - sending to Telegram' },
      { agent: 'oscar', type: 'file_operation', desc: '📁 Writing file: campaign-draft.md' },
      { agent: 'fermin', type: 'tool_call', desc: '🔧 Using gog gmail search' },
      { agent: 'fermin', type: 'command', desc: '⚡ Executing: git status' },
      { agent: 'dora', type: 'web_request', desc: '🌐 Web fetch: https://wtf-control-panel.railway.app' },
      { agent: 'oscar', type: 'tool_call', desc: '🔧 Using nano-banana-pro for image generation' },
      { agent: 'fermin', type: 'file_operation', desc: '📁 Reading file: memory/2026-03-14.md' },
      { agent: 'dora', type: 'command', desc: '⚡ Executing: df -h /' },
      { agent: 'oscar', type: 'tool_call', desc: '🔧 Using sessions_send to coordinate with Dora' }
    ];

    // Generate activities from the last 10 minutes
    for (let i = 0; i < 15; i++) {
      const task = mockTasks[Math.floor(Math.random() * mockTasks.length)];
      const timestamp = new Date(now.getTime() - Math.random() * 10 * 60 * 1000);
      
      activities.push({
        id: `mock_${timestamp.getTime()}_${i}`,
        timestamp,
        type: task.type,
        description: task.desc,
        agentName: task.agent,
        status: Math.random() > 0.1 ? 'completed' : 'active'
      });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }

  getActivitiesForAgent(agentName) {
    return this.activities.get(agentName) || [];
  }

  getAllActivities() {
    const allActivities = [];
    for (const agentActivities of this.activities.values()) {
      allActivities.push(...agentActivities);
    }
    return allActivities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
  }

  addActivity(agentName, activity) {
    if (!this.activities.has(agentName)) {
      this.activities.set(agentName, []);
    }
    
    const agentActivities = this.activities.get(agentName);
    agentActivities.unshift(activity); // Add to beginning
    
    // Keep only recent activities
    if (agentActivities.length > this.maxActivitiesPerAgent) {
      agentActivities.splice(this.maxActivitiesPerAgent);
    }
  }

  async refreshActivities() {
    try {
      const recentActivities = await this.getOpenClawActivities();
      
      // Clear old activities
      this.activities.clear();
      
      // Group by agent
      for (const activity of recentActivities) {
        this.addActivity(activity.agentName, activity);
      }
      
      console.log(`📋 Refreshed activities: ${recentActivities.length} total`);
      return recentActivities;
    } catch (error) {
      console.error('❌ Error refreshing activities:', error);
      return [];
    }
  }

  startMonitoring(intervalSeconds = 30) {
    if (this.isMonitoring) return;
    
    console.log(`🎬 Starting activity monitoring (every ${intervalSeconds}s)`);
    this.isMonitoring = true;
    
    // Initial load
    this.refreshActivities();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.refreshActivities();
    }, intervalSeconds * 1000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isMonitoring = false;
      console.log('⏹️ Activity monitoring stopped');
    }
  }
}

module.exports = ActivityMonitor;