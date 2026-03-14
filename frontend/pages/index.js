import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set mock data after component mounts (client-side only)
    const now = Date.now();
    
    setActivities([
      {
        id: 'temp_1',
        timestamp: new Date(now - 120000),
        description: '🔧 Reading HEARTBEAT.md',
        agentName: 'dora',
        status: 'completed'
      },
      {
        id: 'temp_2', 
        timestamp: new Date(now - 60000),
        description: '⚡ Executing: check-vencimientos-completo.sh',
        agentName: 'dora',
        status: 'active'
      },
      {
        id: 'temp_3',
        timestamp: new Date(now - 180000),
        description: '🔧 Using message tool - sending to Telegram',
        agentName: 'oscar',
        status: 'completed'
      },
      {
        id: 'temp_4',
        timestamp: new Date(now - 45000),
        description: '🌐 Web search: "railway deployment status"',
        agentName: 'dora',
        status: 'active'
      },
      {
        id: 'temp_5',
        timestamp: new Date(now - 300000),
        description: '📁 Reading file: memory/2026-03-14.md',
        agentName: 'fermin',
        status: 'completed'
      }
    ]);

    setAgents([
      {
        id: 'dora-001',
        name: 'dora',
        type: 'main',
        status: 'ONLINE',
        activeAlerts: 0,
        totalLogs: 15,
        totalMetrics: 42
      },
      {
        id: 'oscar-001',
        name: 'oscar',
        type: 'communication',
        status: 'OFFLINE',
        activeAlerts: 1,
        totalLogs: 8,
        totalMetrics: 23
      },
      {
        id: 'fermin-001',
        name: 'fermin',
        type: 'assistant',
        status: 'ONLINE',
        activeAlerts: 0,
        totalLogs: 32,
        totalMetrics: 67
      }
    ]);

    setMetrics({
      agents: { total: 3, active: 2 },
      performance: {
        messagesProcessed: 156,
        tokensConsumed: 15420,
        avgResponseTimeMs: 245,
        avgSuccessRate: 0.961,
        avgErrorRate: 0.039
      },
      costs: { totalUsd: 12.34 }
    });
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#0b0d0f', 
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Inter, system-ui, sans-serif', 
      background: '#0b0d0f', 
      color: '#ffffff', 
      minHeight: '100vh', 
      padding: '20px' 
    }}>
      {/* Header */}
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '32px', fontWeight: 'bold' }}>
          🎮 WTF Control Panel
        </h1>
        <p style={{ color: '#8b949e', margin: 0, fontSize: '16px' }}>
          Real-time Agent Monitoring Dashboard
          {connected && <span style={{ color: '#22c55e', marginLeft: '10px' }}>🟢 Live</span>}
        </p>
      </header>

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[
          { title: 'Active Agents', value: `${metrics?.agents?.active || 0} / ${metrics?.agents?.total || agents.length}`, color: '#2f81f7' },
          { title: 'Messages Processed', value: formatNumber(metrics?.performance?.messagesProcessed || 0), color: '#a371f7' },
          { title: 'Total Cost', value: `$${(metrics?.costs?.totalUsd || 0).toFixed(2)}`, color: '#f97316' },
          { title: 'Success Rate', value: `${((metrics?.performance?.avgSuccessRate || 0) * 100).toFixed(1)}%`, color: '#22c55e' }
        ].map(kpi => (
          <div key={kpi.title} style={{
            background: '#15191c',
            border: '1px solid #2d333b',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#8b949e',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              {kpi.title}
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '28px',
              fontWeight: '700',
              lineHeight: '1.2',
              color: kpi.color
            }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Agents Panel */}
        <div style={{ background: '#15191c', border: '1px solid #2d333b', borderRadius: '12px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #2d333b' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>
              👥 Agents ({agents.length})
            </h3>
          </div>
          
          <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
            {agents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#484f58', padding: '40px 20px' }}>
                Awaiting agent sessions...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {agents.map((agent) => {
                  const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
                  const status = recentActivity ? 'working' : agent.status === 'ONLINE' ? 'waiting' : 'offline';
                  
                  return (
                    <div key={agent.id} style={{
                      background: '#0b0d0f',
                      border: '1px solid #2d333b',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '16px',
                          color: '#ffffff'
                        }}>
                          {agent.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontFamily: 'JetBrains Mono, monospace',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: status === 'working' ? 'rgba(249, 115, 22, 0.15)' : 
                                     status === 'waiting' ? 'rgba(139, 148, 158, 0.15)' : 
                                     'rgba(248, 81, 73, 0.15)',
                          color: status === 'working' ? '#f97316' : 
                                 status === 'waiting' ? '#8b949e' : 
                                 '#f85149'
                        }}>
                          {status}
                        </div>
                      </div>
                      
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#8b949e',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '12px'
                      }}>
                        {recentActivity ? recentActivity.description : 'Idling...'}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#8b949e'
                      }}>
                        <span>Logs: <span style={{ color: '#ffffff' }}>{agent.totalLogs || 0}</span></span>
                        <span>Metrics: <span style={{ color: '#ffffff' }}>{agent.totalMetrics || 0}</span></span>
                        <span>Alerts: <span style={{ color: agent.activeAlerts > 0 ? '#f85149' : '#22c55e' }}>{agent.activeAlerts || 0}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Activities Panel */}
        <div style={{ background: '#15191c', border: '1px solid #2d333b', borderRadius: '12px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #2d333b' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎬 Live Activities 
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: '#22c55e', 
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
            </h3>
          </div>
          
          <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#484f58', padding: '40px 20px' }}>
                No recent activities
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.slice(0, 15).map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '12px',
                      background: activity.status === 'active' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(139, 148, 158, 0.1)',
                      border: `1px solid ${activity.status === 'active' ? '#f97316' : '#2d333b'}`,
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: activity.agentName === 'dora' ? '#22c55e' : activity.agentName === 'oscar' ? '#a371f7' : '#f97316',
                        textTransform: 'uppercase'
                      }}>
                        {activity.agentName}
                      </span>
                      <span style={{ color: '#8b949e', fontSize: '11px' }}>
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ color: '#ffffff', lineHeight: '1.4' }}>
                      {activity.description}
                    </div>
                    {activity.status === 'active' && (
                      <div style={{ 
                        marginTop: '6px', 
                        fontSize: '10px', 
                        color: '#f97316',
                        fontWeight: '600'
                      }}>
                        ⚡ RUNNING
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Status Panel */}
        <div style={{ background: '#15191c', border: '1px solid #2d333b', borderRadius: '12px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #2d333b' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>
              ⚙️ System Status
            </h3>
          </div>
          
          <div style={{ padding: '20px' }}>
            {/* Alerts */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#8b949e', fontSize: '14px' }}>Active Alerts</h4>
              <div style={{ color: '#22c55e', fontSize: '14px' }}>
                ✅ No active alerts
              </div>
            </div>

            {/* System Metrics */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#8b949e', fontSize: '14px' }}>Performance</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e', fontSize: '13px' }}>Response Time</span>
                  <span style={{ color: '#ffffff', fontSize: '13px' }}>
                    {(metrics?.performance?.avgResponseTimeMs || 0).toFixed(0)}ms
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e', fontSize: '13px' }}>Tokens Used</span>
                  <span style={{ color: '#ffffff', fontSize: '13px' }}>
                    {formatNumber(metrics?.performance?.tokensConsumed || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e', fontSize: '13px' }}>Error Rate</span>
                  <span style={{ 
                    color: (metrics?.performance?.avgErrorRate || 0) > 0.05 ? '#f85149' : '#22c55e', 
                    fontSize: '13px' 
                  }}>
                    {((metrics?.performance?.avgErrorRate || 0) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}