import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import PixelAgentDesk from '../components/PixelAgentDesk';

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

  return <PixelAgentDesk agents={agents} activities={activities} />;
}