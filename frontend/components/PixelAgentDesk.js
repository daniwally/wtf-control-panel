import { useState, useEffect, useRef } from 'react';

export default function PixelAgentDesk({ agents, activities }) {
  const canvasRef = useRef(null);
  const [currentView, setCurrentView] = useState('office');
  const [connected, setConnected] = useState(true);
  const [agentStats, setAgentStats] = useState({
    total: 0,
    active: 0,
    totalTokens: 0,
    totalCost: 0,
    errorCount: 0
  });

  // Office simulation state
  const [officeAgents, setOfficeAgents] = useState(new Map());
  const [rooms] = useState({
    kitchen: { x: 100, y: 50, width: 180, height: 120 },
    meeting: { x: 320, y: 50, width: 160, height: 120 },
    workspace: { x: 100, y: 200, width: 380, height: 180 }
  });

  useEffect(() => {
    // Update agent stats
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'ONLINE').length;
    const totalTokens = agents.reduce((sum, a) => sum + (a.totalMetrics || 0), 0);
    const totalCost = agents.reduce((sum, a) => sum + ((a.totalMetrics || 0) * 0.002), 0);

    setAgentStats({
      total: totalAgents,
      active: activeAgents,
      totalTokens,
      totalCost,
      errorCount: agents.filter(a => a.activeAlerts > 0).length
    });

    // Update office agents with room assignments
    const newOfficeAgents = new Map();
    agents.forEach(agent => {
      const location = getAgentLocation(agent, activities);
      newOfficeAgents.set(agent.id, {
        ...agent,
        x: location.x,
        y: location.y,
        room: location.room,
        moving: false,
        sprite: getAgentSprite(agent.name)
      });
    });
    setOfficeAgents(newOfficeAgents);
  }, [agents, activities]);

  useEffect(() => {
    drawOffice();
  }, [officeAgents, currentView]);

  const getAgentLocation = (agent, activities) => {
    const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
    
    if (!recentActivity) {
      // Default workspace positions
      const basePositions = {
        dora: { x: 150, y: 280, room: 'workspace' },
        oscar: { x: 250, y: 280, room: 'workspace' },
        fermin: { x: 350, y: 280, room: 'workspace' }
      };
      return basePositions[agent.name] || { x: 200, y: 280, room: 'workspace' };
    }

    const desc = recentActivity.description.toLowerCase();
    if (desc.includes('email') || desc.includes('message') || desc.includes('communication')) {
      return { x: 380, y: 110, room: 'meeting' }; // Communication in meeting room
    }
    if (desc.includes('coffee') || desc.includes('break') || agent.status === 'OFFLINE') {
      return { x: 180, y: 110, room: 'kitchen' }; // Kitchen for breaks/offline
    }
    
    // Default to workspace
    const workPositions = {
      dora: { x: 150, y: 280 },
      oscar: { x: 250, y: 280 },
      fermin: { x: 350, y: 280 }
    };
    return { ...(workPositions[agent.name] || { x: 200, y: 280 }), room: 'workspace' };
  };

  const getAgentSprite = (agentName) => {
    const spriteMap = {
      dora: 'https://raw.githubusercontent.com/Mgpixelart/pixel-agent-desk/master/public/characters/avatar_0.webp',
      oscar: 'https://raw.githubusercontent.com/Mgpixelart/pixel-agent-desk/master/public/characters/avatar_1.webp',
      fermin: 'https://raw.githubusercontent.com/Mgpixelart/pixel-agent-desk/master/public/characters/avatar_2.webp'
    };
    return spriteMap[agentName] || spriteMap.dora;
  };

  const drawOffice = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#0a0c0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw rooms
    drawRoom(ctx, 'Kitchen', rooms.kitchen, '#2d4a3e');
    drawRoom(ctx, 'Meeting', rooms.meeting, '#3d2a4a');
    drawRoom(ctx, 'Workspace', rooms.workspace, '#4a3d2a');
    
    // Draw agents
    officeAgents.forEach(agent => {
      drawAgent(ctx, agent);
    });
  };

  const drawRoom = (ctx, name, room, color) => {
    // Room background
    ctx.fillStyle = color;
    ctx.fillRect(room.x, room.y, room.width, room.height);
    
    // Room border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.width, room.height);
    
    // Room label
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(name, room.x + 10, room.y + 20);
    
    // Add furniture based on room type
    if (name === 'Kitchen') {
      // Counter
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(room.x + 20, room.y + 40, 120, 20);
      // Appliances
      ctx.fillStyle = '#555';
      ctx.fillRect(room.x + 30, room.y + 70, 15, 15);
      ctx.fillRect(room.x + 55, room.y + 70, 15, 15);
    } else if (name === 'Meeting') {
      // Table
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(room.x + 30, room.y + 50, 100, 60);
      // Chairs
      ctx.fillStyle = '#444';
      ctx.fillRect(room.x + 20, room.y + 40, 12, 12);
      ctx.fillRect(room.x + 138, room.y + 40, 12, 12);
      ctx.fillRect(room.x + 20, room.y + 118, 12, 12);
      ctx.fillRect(room.x + 138, room.y + 118, 12, 12);
    } else if (name === 'Workspace') {
      // Desks
      const deskPositions = [
        { x: room.x + 30, y: room.y + 60 },
        { x: room.x + 130, y: room.y + 60 },
        { x: room.x + 230, y: room.y + 60 },
        { x: room.x + 330, y: room.y + 60 }
      ];
      
      deskPositions.forEach(desk => {
        // Desk surface
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(desk.x, desk.y, 60, 40);
        // Monitor
        ctx.fillStyle = '#333';
        ctx.fillRect(desk.x + 15, desk.y + 5, 30, 20);
        // Monitor screen (active if agent is working)
        ctx.fillStyle = '#0066ff';
        ctx.fillRect(desk.x + 17, desk.y + 7, 26, 16);
        // Keyboard
        ctx.fillStyle = '#444';
        ctx.fillRect(desk.x + 20, desk.y + 28, 20, 8);
      });
    }
  };

  const drawAgent = (ctx, agent) => {
    const size = 24;
    
    // Agent shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(agent.x, agent.y + size/2, size/3, size/6, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Agent sprite (simplified as colored circle with emoji)
    const agentColors = {
      dora: '#10b981',
      oscar: '#8b5cf6',
      fermin: '#f59e0b'
    };
    
    const agentEmojis = {
      dora: '🗺️',
      oscar: '🎭', 
      fermin: '🔧'
    };
    
    // Agent body
    ctx.fillStyle = agentColors[agent.name] || '#666';
    if (agent.status === 'OFFLINE') {
      ctx.fillStyle = '#444';
    }
    
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, size/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Agent border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Agent emoji face
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(agentEmojis[agent.name] || '🤖', agent.x, agent.y);
    
    // Status indicator
    const statusColors = {
      ONLINE: '#22c55e',
      OFFLINE: '#ef4444'
    };
    ctx.fillStyle = statusColors[agent.status] || '#666';
    ctx.beginPath();
    ctx.arc(agent.x + size/3, agent.y - size/3, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Agent name
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(agent.name.toUpperCase(), agent.x, agent.y + size);
    
    // Speech bubble for activity
    if (agent.status === 'ONLINE') {
      const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
      if (recentActivity) {
        drawSpeechBubble(ctx, agent.x, agent.y - 30, recentActivity.description.slice(0, 20) + '...');
      }
    }
  };

  const drawSpeechBubble = (ctx, x, y, text) => {
    const padding = 8;
    const bubbleWidth = Math.max(80, text.length * 6);
    const bubbleHeight = 20;
    
    // Bubble background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(x - bubbleWidth/2, y - bubbleHeight, bubbleWidth, bubbleHeight);
    
    // Bubble border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - bubbleWidth/2, y - bubbleHeight, bubbleWidth, bubbleHeight);
    
    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Text
    ctx.fillStyle = '#333';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - bubbleHeight/2 + 3);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getActivityStatus = (agent) => {
    const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
    if (recentActivity) {
      if (recentActivity.type === 'tool_call') return 'working';
      if (recentActivity.type === 'command') return 'thinking';
      return 'working';
    }
    return agent.status === 'ONLINE' ? 'waiting' : 'offline';
  };

  return (
    <div className="app-layout" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{
        width: '240px',
        background: '#0b0d0f',
        borderRight: '1px solid #2d333b',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="sidebar-header" style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #2d333b',
          fontWeight: '700',
          fontSize: '0.95rem',
          gap: '10px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #2f81f7, #a371f7)'
          }}></div>
          WTF Control Panel
        </div>
        
        <div className="sidebar-nav" style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: '600',
            color: '#484f58',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '12px 0 4px 8px'
          }}>
            DASHBOARD
          </div>
          
          {['office', 'heatmap', 'usage'].map(view => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`nav-item ${currentView === view ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                color: currentView === view ? '#fff' : '#8b949e',
                fontSize: '0.825rem',
                fontWeight: '500',
                cursor: 'pointer',
                border: '1px solid transparent',
                background: currentView === view ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                borderColor: currentView === view ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              {view === 'office' && '🏢'} {view === 'heatmap' && '📊'} {view === 'usage' && '📈'}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="sidebar-footer" style={{
          padding: '16px',
          borderTop: '1px solid #2d333b',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#8b949e'
        }}>
          <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: connected ? '#238636' : '#f85149',
            boxShadow: connected ? '0 0 8px rgba(35, 134, 54, 0.15)' : '0 0 8px rgba(248, 81, 73, 0.15)'
          }}></div>
          {connected ? 'Gateway Online' : 'Disconnected'}
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#090b0d'
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* KPI Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            marginBottom: '12px'
          }}>
            {[
              { title: 'Active Agents', value: `${agentStats.active} / ${agentStats.total}`, color: '#2f81f7' },
              { title: 'Total Tokens', value: formatNumber(agentStats.totalTokens), color: '#a371f7' },
              { title: 'Total Cost', value: `$${agentStats.totalCost.toFixed(2)}`, color: '#f97316' },
              { title: 'Errors', value: agentStats.errorCount.toString(), color: '#f85149' }
            ].map(kpi => (
              <div key={kpi.title} style={{
                background: '#15191c',
                border: '1px solid #2d333b',
                borderRadius: '10px',
                padding: '12px 16px'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#8b949e',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  {kpi.title}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  lineHeight: '1.2',
                  color: kpi.color
                }}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Office Layout */}
          {currentView === 'office' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '16px',
              height: 'calc(100vh - 200px)',
              minHeight: '460px'
            }}>
              {/* Office Canvas */}
              <div style={{
                background: '#15191c',
                border: '1px solid #2d333b',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '9px 16px',
                  borderBottom: '1px solid #2d333b',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.01)',
                  color: '#ffffff'
                }}>
                  🏢 Virtual Office
                  <span style={{
                    background: 'rgba(35, 134, 54, 0.15)',
                    color: '#238636',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    marginLeft: '10px'
                  }}>
                    LIVE
                  </span>
                </div>
                <div style={{
                  flex: 1,
                  padding: '0',
                  background: '#050709',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      imageRendering: 'pixelated',
                      imageRendering: 'crisp-edges',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  />
                </div>
              </div>

              {/* Agent Roster */}
              <div style={{
                background: '#15191c',
                border: '1px solid #2d333b',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '9px 16px',
                  borderBottom: '1px solid #2d333b',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  System Status
                </div>
                <div style={{
                  padding: '20px',
                  flex: 1,
                  overflowY: 'auto'
                }}>
                  {agents.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: '#484f58',
                      marginTop: '40px',
                      fontSize: '0.8rem'
                    }}>
                      Awaiting agent sessions...
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {agents.map(agent => {
                        const status = getActivityStatus(agent);
                        const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
                        
                        return (
                          <div key={agent.id} style={{
                            background: '#0b0d0f',
                            border: '1px solid #2d333b',
                            borderRadius: '6px',
                            padding: '12px 16px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '10px'
                            }}>
                              <div style={{
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ffffff'
                              }}>
                                {agent.name}
                                <span style={{
                                  background: '#2d333b',
                                  color: '#8b949e',
                                  fontSize: '0.6rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  fontWeight: '700'
                                }}>
                                  MAIN
                                </span>
                              </div>
                              <div style={{
                                fontSize: '0.65rem',
                                fontFamily: 'JetBrains Mono, monospace',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                background: status === 'working' ? 'rgba(249, 115, 22, 0.1)' : 
                                           status === 'thinking' ? 'rgba(163, 113, 247, 0.1)' : 
                                           'rgba(255, 255, 255, 0.05)',
                                color: status === 'working' ? '#f97316' : 
                                       status === 'thinking' ? '#a371f7' : 
                                       '#8b949e'
                              }}>
                                {status}
                              </div>
                            </div>
                            
                            <div style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '0.7rem',
                              color: '#8b949e',
                              background: 'rgba(0, 0, 0, 0.3)',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '10px'
                            }}>
                              CMD> {recentActivity ? 
                                <span style={{ color: '#ffffff' }}>{recentActivity.description.slice(0, 25)}...</span> : 
                                'Idling...'
                              }
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.7rem',
                              color: '#8b949e',
                              borderTop: '1px solid #2d333b',
                              paddingTop: '8px'
                            }}>
                              <span>TX: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ffffff', fontWeight: '500' }}>{formatNumber(agent.totalMetrics || 0)}</span> tok</span>
                              <span>$<span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ffffff', fontWeight: '500' }}>{((agent.totalMetrics || 0) * 0.002).toFixed(4)}</span></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other Views */}
          {currentView === 'heatmap' && (
            <div style={{
              background: '#15191c',
              border: '1px solid #2d333b',
              borderRadius: '10px',
              padding: '24px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>Activity Heatmap</h3>
              <div style={{ color: '#8b949e' }}>Feature coming soon...</div>
            </div>
          )}
          
          {currentView === 'usage' && (
            <div style={{
              background: '#15191c',
              border: '1px solid #2d333b',
              borderRadius: '10px',
              padding: '24px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>Usage Analytics</h3>
              <div style={{ color: '#8b949e' }}>Feature coming soon...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}