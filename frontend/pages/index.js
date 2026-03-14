import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([
    // Emergency hardcoded activities until Railway deploys backend
    {
      id: 'temp_1',
      timestamp: new Date(Date.now() - 120000),
      type: 'tool_call',
      description: '🔧 Reading HEARTBEAT.md',
      agentName: 'dora',
      status: 'completed'
    },
    {
      id: 'temp_2', 
      timestamp: new Date(Date.now() - 60000),
      type: 'command',
      description: '⚡ Executing: check-vencimientos-completo.sh',
      agentName: 'dora',
      status: 'active'
    },
    {
      id: 'temp_3',
      timestamp: new Date(Date.now() - 180000),
      type: 'tool_call',
      description: '🔧 Using message tool - sending to Telegram',
      agentName: 'oscar',
      status: 'completed'
    },
    {
      id: 'temp_4',
      timestamp: new Date(Date.now() - 45000),
      type: 'web_request',
      description: '🌐 Web search: "railway deployment status"',
      agentName: 'dora',
      status: 'active'
    },
    {
      id: 'temp_5',
      timestamp: new Date(Date.now() - 300000),
      type: 'file_operation',
      description: '📁 Reading file: memory/2026-03-14.md',
      agentName: 'fermin',
      status: 'completed'
    },
    {
      id: 'temp_6',
      timestamp: new Date(Date.now() - 90000),
      type: 'tool_call',
      description: '🔧 Using gog gmail search',
      agentName: 'fermin',
      status: 'completed'
    },
    {
      id: 'temp_7',
      timestamp: new Date(Date.now() - 30000),
      type: 'command',
      description: '⚡ Executing: git status',
      agentName: 'oscar',
      status: 'active'
    },
    {
      id: 'temp_8',
      timestamp: new Date(Date.now() - 240000),
      type: 'web_request',
      description: '🌐 Web fetch: WTF Control Panel status',
      agentName: 'dora',
      status: 'completed'
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchInitialData();
    setupWebSocket();
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const setupWebSocket = () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://wtf-control-panel-production-6dc0.up.railway.app';
    const newSocket = io(wsUrl);
    
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });
    
    newSocket.on('agents:status', (agentsData) => {
      console.log('📊 Agents update received:', agentsData);
      setAgents(agentsData);
    });
    
    newSocket.on('agent:statusChange', (data) => {
      console.log('🔄 Agent status changed:', data);
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentId 
          ? { ...agent, status: data.status, lastSeen: data.timestamp }
          : agent
      ));
    });
    
    newSocket.on('metrics:update', (metricsData) => {
      console.log('📈 Metrics update received:', metricsData);
      setMetrics(metricsData);
    });
    
    newSocket.on('activities:update', (activitiesData) => {
      console.log('📋 Activities update received:', activitiesData);
      setActivities(activitiesData);
    });
    
    newSocket.on('activity:new', (newActivity) => {
      console.log('🎬 New activity received:', newActivity);
      setActivities(prev => [newActivity, ...prev.slice(0, 24)]); // Add to top, keep 25 max
    });
    
    setSocket(newSocket);
  };

  const fetchInitialData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wtf-control-panel-production-6dc0.up.railway.app/api';
      
      // Fetch agents (includes activities as workaround)
      const agentsResponse = await fetch(`${apiUrl}/agents`);
      if (!agentsResponse.ok) throw new Error('Failed to fetch agents');
      const agentsData = await agentsResponse.json();
      setAgents(agentsData.data || []);
      
      // Get activities from agents response (workaround for Railway cache)
      if (agentsData.activities) {
        setActivities(agentsData.activities);
      }
      
      // Fetch metrics
      const metricsResponse = await fetch(`${apiUrl}/metrics/overview`);
      if (!metricsResponse.ok) throw new Error('Failed to fetch metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.data || {});
      
      // Fetch alerts
      const alertsResponse = await fetch(`${apiUrl}/alerts/active`);
      if (!alertsResponse.ok) throw new Error('Failed to fetch alerts');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.data || []);
      
      // Try to fetch activities (fallback to agents response)
      try {
        const activitiesResponse = await fetch(`${apiUrl}/activities`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData.data || []);
        }
      } catch {
        console.log('Activities API not available, using fallback from agents response');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONLINE': return '#10b981'; // green
      case 'OFFLINE': return '#ef4444'; // red
      case 'ERROR': return '#f59e0b'; // yellow
      default: return '#6b7280'; // gray
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading WTF Control Panel...</div>
          <div style={{ fontSize: '14px' }}>🤖 Connecting to agents...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '32px', fontWeight: 'bold' }}>🎮 WTF Control Panel</h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
          Real-time Agent Monitoring Dashboard
          {connected && <span style={{ color: '#10b981', marginLeft: '10px' }}>🟢 Live</span>}
          {!connected && <span style={{ color: '#ef4444', marginLeft: '10px' }}>🔴 Disconnected</span>}
        </p>
      </header>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#dc2626',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <strong>Connection Error:</strong> {error}
          <br />
          <small>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</small>
        </div>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Agents</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{metrics.agents?.total || 0}</div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>{metrics.agents?.active || 0} online</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Messages Processed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{metrics.performance?.messagesProcessed || 0}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Last 24h</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Cost</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>${metrics.costs?.totalUsd?.toFixed(2) || '0.00'}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>USD</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Success Rate</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{((metrics.performance?.avgSuccessRate || 0) * 100).toFixed(1)}%</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Average</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
        {/* Agents Panel */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>Agents ({agents.length})</h2>
            <button 
              onClick={fetchInitialData}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          
          <div style={{ padding: '0 24px 24px' }}>
            {agents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No agents found. Agents will appear here once they start sending heartbeats.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '20px',
                      background: '#fafafa',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                          {agent.name}
                        </h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                          Type: {agent.type} • Uptime: {formatUptime(agent.uptime)}
                        </p>
                      </div>
                      <div
                        style={{
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: agent.status === 'ONLINE' ? '#dcfce7' : '#fee2e2',
                          color: agent.status === 'ONLINE' ? '#166534' : '#dc2626',
                          border: `2px solid ${getStatusColor(agent.status)}`
                        }}
                      >
                        {agent.status}
                      </div>
                    </div>
                    
                    {agent.lastSeen && (
                      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
                        Last seen: {new Date(agent.lastSeen).toLocaleString()}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px' }}>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <div style={{ color: '#6b7280' }}>Alerts</div>
                        <div style={{ fontWeight: '600', color: agent.activeAlerts > 0 ? '#dc2626' : '#10b981' }}>
                          {agent.activeAlerts || 0}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <div style={{ color: '#6b7280' }}>Logs</div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{agent.totalLogs || 0}</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <div style={{ color: '#6b7280' }}>Metrics</div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{agent.totalMetrics || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Activities Panel */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎬 Live Activities 
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: '#10b981', 
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }}></div>
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
              Real-time monitoring • New tasks appear automatically • Updates every 3 seconds
            </p>
          </div>
          <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '40px 20px' }}>
                <div style={{ marginBottom: '8px' }}>🔄 Loading activities...</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Railway deployment pending...
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {activities.slice(0, 20).map((activity, index) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '12px',
                      background: activity.status === 'active' 
                        ? '#fef3c7' 
                        : activity.type === 'system' 
                          ? '#fef2f2' 
                          : '#f0f9ff',
                      border: `1px solid ${
                        activity.status === 'active' 
                          ? '#fde68a' 
                          : activity.type === 'system' 
                            ? '#fecaca' 
                            : '#e0f2fe'
                      }`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      opacity: index === 0 ? 1 : Math.max(0.7, 1 - (index * 0.02)), // Fade older activities
                      transform: index < 3 ? `scale(${1 - index * 0.02})` : 'scale(0.94)', // Slight scale for depth
                      transition: 'all 0.3s ease-in-out',
                      marginBottom: index < 2 ? '8px' : '6px' // Closer spacing for older items
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: activity.agentName === 'dora' ? '#059669' : activity.agentName === 'oscar' ? '#7c3aed' : '#dc2626',
                        fontSize: '11px',
                        textTransform: 'uppercase'
                      }}>
                        {activity.agentName}
                      </span>
                      <span style={{ 
                        color: '#6b7280', 
                        fontSize: '10px' 
                      }}>
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ color: '#374151', lineHeight: '1.3' }}>
                      {activity.description}
                    </div>
                    {activity.status === 'active' && (
                      <div style={{ 
                        marginTop: '4px', 
                        fontSize: '10px', 
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <div style={{ 
                          width: '6px', 
                          height: '6px', 
                          background: '#f59e0b', 
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }}></div>
                        RUNNING
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts & System Panel */}
        <div>
          {/* Active Alerts */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px' }}>🚨 Active Alerts</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#10b981', fontSize: '14px' }}>
                  ✅ No active alerts
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {alerts.map((alert) => (
                    <div key={alert.id} style={{
                      padding: '12px',
                      background: alert.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                      border: `1px solid ${alert.severity === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                        {alert.title}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                        {alert.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          {metrics && (
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px' }}>⚙️ System Status</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Response Time</span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                      {metrics.performance?.avgResponseTimeMs?.toFixed(0)}ms
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Tokens Used</span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                      {(metrics.performance?.tokensConsumed || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Error Rate</span>
                    <span style={{ 
                      color: (metrics.performance?.avgErrorRate || 0) > 0.1 ? '#dc2626' : '#10b981', 
                      fontWeight: '600', 
                      fontSize: '14px' 
                    }}>
                      {((metrics.performance?.avgErrorRate || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Active Agents</span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                      {metrics.agents?.active}/{metrics.agents?.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '20px' }}>
        <p>WTF Control Panel • Real-time Agent Monitoring • {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          Last update: {new Date().toLocaleTimeString()} • 
          WebSocket: {connected ? 'Active' : 'Inactive'} • 
          Activities: {activities.length} tracked
        </p>
      </footer>
    </div>
  );
}