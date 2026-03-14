import { useState, useEffect } from 'react';

export default function PixelOffice({ agents, activities }) {
  const [agentAnimations, setAgentAnimations] = useState({});
  
  useEffect(() => {
    // Update agent animations based on current activities
    const newAnimations = {};
    
    agents.forEach(agent => {
      const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
      newAnimations[agent.name] = {
        working: agent.status === 'ONLINE' && recentActivity,
        activity: recentActivity?.description || (agent.status === 'ONLINE' ? 'Monitoring...' : 'Offline'),
        type: recentActivity?.type || 'idle'
      };
    });
    
    setAgentAnimations(newAnimations);
  }, [agents, activities]);

  const getAgentPixelStyle = (agentName, isWorking, status) => {
    const baseStyle = {
      width: '48px',
      height: '48px',
      borderRadius: '4px',
      position: 'relative',
      margin: '8px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };

    if (status === 'OFFLINE') {
      return {
        ...baseStyle,
        background: '#6b7280',
        opacity: 0.5,
        filter: 'grayscale(100%)'
      };
    }

    const agentColors = {
      dora: isWorking ? '#10b981' : '#34d399',
      oscar: isWorking ? '#8b5cf6' : '#a78bfa', 
      fermin: isWorking ? '#f59e0b' : '#fbbf24'
    };

    return {
      ...baseStyle,
      background: `linear-gradient(45deg, ${agentColors[agentName]}, ${agentColors[agentName]}dd)`,
      boxShadow: isWorking 
        ? `0 0 20px ${agentColors[agentName]}66, inset 0 0 10px ${agentColors[agentName]}33`
        : `0 4px 12px ${agentColors[agentName]}44`,
      animation: isWorking ? 'workingPulse 2s infinite' : 'none',
      transform: isWorking ? 'scale(1.05)' : 'scale(1)'
    };
  };

  const getDeskStyle = (agentName, isWorking) => ({
    width: '80px',
    height: '60px',
    background: '#8B4513',
    borderRadius: '4px',
    position: 'relative',
    boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
    border: '2px solid #654321',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '8px',
      left: '8px',
      width: '12px',
      height: '8px',
      background: isWorking ? '#60a5fa' : '#374151',
      borderRadius: '2px',
      boxShadow: isWorking ? '0 0 8px #60a5faaa' : 'none'
    }
  });

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
      borderRadius: '12px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '320px'
    }}>
      {/* Office Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(90deg, #374151 1px, transparent 1px),
          linear-gradient(#374151 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        opacity: 0.1
      }}></div>
      
      {/* Office Title */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1
      }}>
        <h3 style={{ 
          color: '#f9fafb', 
          margin: 0, 
          fontSize: '18px',
          fontFamily: 'monospace',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🏢 WTF Agency - Digital Office
        </h3>
        <p style={{ 
          color: '#d1d5db', 
          margin: '4px 0 0 0', 
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          Live Agent Workspace • Pixel Art Style
        </p>
      </div>

      {/* Agents Workspace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '24px',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {agents.map((agent) => {
          const animation = agentAnimations[agent.name] || {};
          const isWorking = animation.working;
          
          return (
            <div key={agent.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Agent Name Tag */}
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                color: '#f9fafb',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                marginBottom: '8px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                border: '1px solid #374151'
              }}>
                {agent.name}
              </div>

              {/* Activity Bubble */}
              {isWorking && animation.activity && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.95)',
                  padding: '6px 10px',
                  borderRadius: '16px',
                  fontSize: '10px',
                  maxWidth: '120px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '2px solid #f3f4f6',
                  zIndex: 10,
                  fontWeight: '500',
                  animation: 'speechBubble 3s infinite',
                  color: '#1f2937'
                }}>
                  {animation.activity.slice(0, 30)}...
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '8px solid rgba(255,255,255,0.95)'
                  }}></div>
                </div>
              )}

              {/* Desk */}
              <div style={{
                width: '80px',
                height: '60px',
                background: '#8B4513',
                borderRadius: '4px',
                position: 'relative',
                boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
                border: '2px solid #654321',
                marginBottom: '8px'
              }}>
                {/* Computer Screen */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '14px',
                  background: isWorking ? '#60a5fa' : '#374151',
                  borderRadius: '2px',
                  border: '1px solid #1f2937',
                  boxShadow: isWorking ? '0 0 8px #60a5faaa' : 'none'
                }}>
                  {/* Screen glow */}
                  {isWorking && (
                    <div style={{
                      position: 'absolute',
                      inset: '1px',
                      background: 'linear-gradient(45deg, #60a5fa, #34d399)',
                      borderRadius: '1px',
                      opacity: 0.8,
                      animation: 'screenFlicker 1.5s infinite'
                    }}></div>
                  )}
                </div>

                {/* Keyboard */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '6px',
                  background: '#2d3748',
                  borderRadius: '1px',
                  border: '1px solid #1a202c'
                }}></div>
              </div>

              {/* Agent Avatar */}
              <div 
                style={getAgentPixelStyle(agent.name, isWorking, agent.status)}
                title={`${agent.name}: ${animation.activity}`}
              >
                {/* Agent Face */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '20px',
                  filter: agent.status === 'OFFLINE' ? 'grayscale(100%)' : 'none'
                }}>
                  {agent.name === 'dora' ? '🗺️' : agent.name === 'oscar' ? '🎭' : '🔧'}
                </div>

                {/* Working indicator */}
                {isWorking && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '12px',
                    height: '12px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    animation: 'workingIndicator 1s infinite'
                  }}></div>
                )}
              </div>

              {/* Status */}
              <div style={{
                marginTop: '8px',
                fontSize: '10px',
                color: agent.status === 'ONLINE' ? '#34d399' : '#ef4444',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textAlign: 'center'
              }}>
                {agent.status}
                {agent.status === 'ONLINE' && (
                  <div style={{ color: '#d1d5db', fontSize: '9px', marginTop: '2px' }}>
                    {agent.totalMetrics} metrics
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes workingPulse {
          0%, 100% { 
            transform: scale(1.05);
            box-shadow: 0 0 20px currentColor66, inset 0 0 10px currentColor33;
          }
          50% { 
            transform: scale(1.08);
            box-shadow: 0 0 30px currentColoraa, inset 0 0 15px currentColor55;
          }
        }

        @keyframes workingIndicator {
          0%, 100% { 
            transform: scale(1);
            background: #22c55e;
          }
          50% { 
            transform: scale(1.2);
            background: #16a34a;
          }
        }

        @keyframes screenFlicker {
          0%, 100% { opacity: 0.8; }
          25% { opacity: 1; }
          50% { opacity: 0.9; }
          75% { opacity: 1; }
        }

        @keyframes speechBubble {
          0%, 100% { 
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translateX(-50%) scale(1.05);
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
}