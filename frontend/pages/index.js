import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/agents`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🎮 WTF Control Panel</h1>
        <p style={{ color: '#666' }}>Agent Dashboard - Real-time monitoring</p>
      </header>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fetchAgents}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Agents
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading agents...
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#dc2626',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
          <br />
          <small>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</small>
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2 style={{ marginBottom: '15px' }}>Agents ({agents.length})</h2>
          
          {agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No agents found. Agents will appear here once they start sending heartbeats.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '15px',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{agent.name}</h3>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Type: {agent.type} • Status: {agent.status}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: agent.status === 'ONLINE' ? '#dcfce7' : '#fee2e2',
                        color: agent.status === 'ONLINE' ? '#166534' : '#dc2626'
                      }}
                    >
                      {agent.status}
                    </div>
                  </div>
                  
                  {agent.lastSeen && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                      Last seen: {new Date(agent.lastSeen).toLocaleString()}
                    </div>
                  )}

                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    Alerts: {agent.activeAlerts || 0} • 
                    Logs: {agent.totalLogs || 0} • 
                    Metrics: {agent.totalMetrics || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        <p>WTF Control Panel • Built with Next.js • Real-time agent monitoring</p>
      </footer>
    </div>
  );
}