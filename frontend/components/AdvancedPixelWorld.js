import { useState, useEffect } from 'react';

export default function AdvancedPixelWorld({ agents, activities }) {
  const [worldState, setWorldState] = useState({});
  const [time, setTime] = useState(new Date());
  const [sprites, setSprites] = useState({});
  const [agentPositions, setAgentPositions] = useState({});

  // Base sprite URLs from the repository
  const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/Mgpixelart/pixel-agent-desk/master/public/characters/';
  
  // Agent sprite assignments
  const agentSprites = {
    dora: 'avatar_0.webp',
    oscar: 'avatar_1.webp', 
    fermin: 'avatar_2.webp'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Preload sprites
    const loadSprites = async () => {
      const loadedSprites = {};
      for (const [agent, spriteFile] of Object.entries(agentSprites)) {
        try {
          loadedSprites[agent] = `${SPRITE_BASE_URL}${spriteFile}`;
        } catch (error) {
          console.log(`Failed to load sprite for ${agent}`);
        }
      }
      setSprites(loadedSprites);
    };
    
    loadSprites();
  }, []);

  useEffect(() => {
    // Update world state and positions based on agent activities
    const newWorldState = {};
    const newPositions = {};
    
    agents.forEach(agent => {
      const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
      const location = getAgentLocation(agent.name, recentActivity);
      
      newWorldState[agent.name] = {
        working: agent.status === 'ONLINE' && recentActivity,
        activity: recentActivity?.description || (agent.status === 'ONLINE' ? 'Monitoring systems...' : 'Offline'),
        type: recentActivity?.type || 'idle',
        location,
        mood: getAgentMood(agent, recentActivity),
        moving: location !== (worldState[agent.name]?.location || 'desk')
      };

      // Calculate target position based on location
      newPositions[agent.name] = getLocationPosition(agent.name, location);
    });
    
    setWorldState(newWorldState);
    setAgentPositions(newPositions);
  }, [agents, activities]);

  const getAgentLocation = (agentName, activity) => {
    if (!activity || activity.status !== 'active') return 'desk';
    
    const desc = activity.description.toLowerCase();
    if (desc.includes('gmail') || desc.includes('email') || desc.includes('message')) return 'communication';
    if (desc.includes('web') || desc.includes('search') || desc.includes('fetch')) return 'research';
    if (desc.includes('file') || desc.includes('memory') || desc.includes('read') || desc.includes('write')) return 'archive';
    if (desc.includes('command') || desc.includes('executing') || desc.includes('exec')) return 'server';
    if (desc.includes('tool') && desc.includes('gog')) return 'communication';
    if (desc.includes('tool') && desc.includes('sessions')) return 'coordination';
    
    return 'desk';
  };

  const getLocationPosition = (agentName, location) => {
    const basePositions = {
      dora: { x: 120, y: 180 },
      oscar: { x: 220, y: 180 },
      fermin: { x: 320, y: 180 }
    };

    const locations = {
      desk: basePositions[agentName],
      communication: { x: 450, y: 120 },
      research: { x: 450, y: 200 },
      archive: { x: 520, y: 280 },
      server: { x: 450, y: 280 },
      coordination: { x: 150, y: 320 }
    };

    return locations[location] || basePositions[agentName];
  };

  const getAgentMood = (agent, activity) => {
    if (agent.status === 'OFFLINE') return 'sleeping';
    if (activity?.status === 'active') return 'working';
    if (agent.activeAlerts > 0) return 'alert';
    return 'idle';
  };

  const renderPixelAgent = (agent) => {
    const state = worldState[agent.name] || {};
    const position = agentPositions[agent.name] || { x: 100, y: 100 };
    const sprite = sprites[agent.name];
    
    return (
      <div
        key={agent.id}
        className={`pixel-agent ${state.mood} ${state.moving ? 'moving' : ''}`}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: '48px',
          height: '48px',
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10,
          transform: `scale(${agent.status === 'OFFLINE' ? 0.8 : 1})`,
          filter: agent.status === 'OFFLINE' ? 'grayscale(100%) brightness(0.6)' : 'none'
        }}
      >
        {/* Agent Shadow */}
        <div className="agent-shadow" style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '32px',
          height: '12px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '50%',
          filter: 'blur(4px)',
          opacity: agent.status === 'OFFLINE' ? 0.3 : 0.7
        }} />

        {/* Main Sprite */}
        <div style={{
          width: '48px',
          height: '48px',
          background: sprite ? `url(${sprite})` : `linear-gradient(45deg, ${getAgentColor(agent.name)}, ${getAgentColor(agent.name)}dd)`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          borderRadius: sprite ? '0' : '8px',
          position: 'relative',
          animation: state.working ? 'pixelWorking 2s infinite' : state.mood === 'sleeping' ? 'pixelSleeping 4s infinite' : 'pixelIdle 3s infinite'
        }}>
          {/* Fallback emoji if sprite fails to load */}
          {!sprite && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '24px'
            }}>
              {getAgentEmoji(agent.name)}
            </div>
          )}

          {/* Activity Indicator */}
          {state.working && (
            <div className="activity-indicator" style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '14px',
              height: '14px',
              background: '#22c55e',
              borderRadius: '50%',
              border: '2px solid #fff',
              animation: 'activityPulse 1.5s infinite',
              boxShadow: '0 0 12px #22c55e88'
            }} />
          )}

          {/* Status Indicator */}
          <div className={`status-indicator ${agent.status.toLowerCase()}`} style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: agent.status === 'ONLINE' ? '#22c55e' : '#ef4444',
            border: '1px solid #fff',
            boxShadow: `0 0 6px ${agent.status === 'ONLINE' ? '#22c55e' : '#ef4444'}`
          }} />
        </div>

        {/* Activity Bubble */}
        {state.activity && agent.status === 'ONLINE' && (
          <div className="activity-bubble" style={{
            position: 'absolute',
            bottom: '55px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '8px 12px',
            borderRadius: '16px',
            fontSize: '10px',
            maxWidth: '140px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '2px solid #e5e7eb',
            zIndex: 15,
            fontWeight: '600',
            color: '#1f2937',
            animation: 'bubbleFloat 3s infinite',
            backdropFilter: 'blur(8px)'
          }}>
            {state.activity.slice(0, 35)}...
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(255,255,255,0.95)'
            }} />
          </div>
        )}

        {/* Agent Name Tag */}
        <div className="name-tag" style={{
          position: 'absolute',
          top: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '9px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          border: '1px solid #374151'
        }}>
          {agent.name}
        </div>
      </div>
    );
  };

  const renderWorkstation = (type, position, isActive = false, label = '') => {
    return (
      <div className={`workstation ${type} ${isActive ? 'active' : ''}`} style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '64px',
        height: '48px',
        zIndex: 2
      }}>
        {/* Desk Surface */}
        <div style={{
          width: '64px',
          height: '40px',
          background: 'linear-gradient(135deg, #92400e, #a16207)',
          borderRadius: '6px',
          border: '2px solid #451a03',
          boxShadow: '4px 4px 12px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          {/* Monitor */}
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24px',
            height: '18px',
            background: isActive ? '#3b82f6' : '#374151',
            borderRadius: '3px',
            border: '2px solid #1f2937',
            boxShadow: isActive ? '0 0 12px #3b82f680' : 'none'
          }}>
            {isActive && (
              <div style={{
                position: 'absolute',
                inset: '2px',
                background: 'linear-gradient(45deg, #60a5fa, #34d399, #f59e0b)',
                borderRadius: '1px',
                opacity: 0.9,
                animation: 'screenFlow 3s infinite'
              }} />
            )}
          </div>

          {/* Keyboard */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '6px',
            background: '#2d3748',
            borderRadius: '2px',
            border: '1px solid #1a202c'
          }} />

          {/* Mouse */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '8px',
            width: '4px',
            height: '6px',
            background: '#4a5568',
            borderRadius: '2px'
          }} />
        </div>

        {/* Station Label */}
        {label && (
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#f9fafb',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '8px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </div>
        )}
      </div>
    );
  };

  const getAgentColor = (agentName) => {
    const colors = {
      dora: '#10b981',
      oscar: '#8b5cf6',
      fermin: '#f59e0b'
    };
    return colors[agentName] || '#6b7280';
  };

  const getAgentEmoji = (agentName) => {
    const emojis = {
      dora: '🗺️',
      oscar: '🎭',
      fermin: '🔧'
    };
    return emojis[agentName] || '🤖';
  };

  return (
    <div className="advanced-pixel-world" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '600px',
      width: '100%',
      fontFamily: 'monospace'
    }}>
      {/* Pixel Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(90deg, #334155 1px, transparent 1px),
          linear-gradient(#334155 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        opacity: 0.2
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        position: 'relative',
        zIndex: 1
      }}>
        <h3 style={{
          color: '#f1f5f9',
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          letterSpacing: '2px'
        }}>
          🎮 WTF AGENCY - PIXEL WORLD v2.0
        </h3>
        <p style={{
          color: '#cbd5e1',
          margin: '8px 0 0 0',
          fontSize: '13px'
        }}>
          Advanced Agent Visualization • Real-time AI Monitoring • {time.toLocaleTimeString()}
        </p>
      </div>

      {/* World Layout */}
      <div style={{ 
        position: 'relative',
        height: '500px',
        margin: '20px 0'
      }}>
        {/* Main Office Floor */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '50px',
          width: '400px',
          height: '300px',
          background: 'linear-gradient(135deg, #475569, #64748b)',
          borderRadius: '12px',
          border: '3px solid #1e293b',
          boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.7)',
            color: '#f1f5f9',
            padding: '4px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            MAIN OFFICE
          </div>
        </div>

        {/* Specialized Stations */}
        <div style={{
          position: 'absolute',
          left: '480px',
          top: '50px',
          width: '140px',
          height: '200px',
          background: 'linear-gradient(135deg, #374151, #4b5563)',
          borderRadius: '12px',
          border: '3px solid #1f2937',
          boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.7)',
            color: '#f1f5f9',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            TECH CENTER
          </div>
        </div>

        {/* Coordination Area */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '380px',
          width: '200px',
          height: '80px',
          background: 'linear-gradient(135deg, #581c87, #7c3aed)',
          borderRadius: '12px',
          border: '3px solid #3730a3',
          boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1
        }}>
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '9px',
            fontWeight: 'bold'
          }}>
            COORDINATION
          </div>
        </div>

        {/* Workstations */}
        {renderWorkstation('desk', { x: 100, y: 150 }, worldState.dora?.working, 'DORA')}
        {renderWorkstation('desk', { x: 200, y: 150 }, worldState.oscar?.working, 'OSCAR')}
        {renderWorkstation('desk', { x: 300, y: 150 }, worldState.fermin?.working, 'FERMIN')}
        {renderWorkstation('server', { x: 500, y: 90 }, true, 'COMMUNICATION')}
        {renderWorkstation('terminal', { x: 500, y: 170 }, false, 'RESEARCH')}
        {renderWorkstation('archive', { x: 540, y: 250 }, false, 'ARCHIVE')}

        {/* Render Agents */}
        {agents.map(agent => renderPixelAgent(agent))}

        {/* Activity Particles */}
        {activities.slice(0, 5).map((activity, i) => (
          <div
            key={`particle_${activity.id}`}
            className="activity-particle"
            style={{
              position: 'absolute',
              left: '50%',
              top: '25%',
              width: '6px',
              height: '6px',
              background: activity.status === 'active' ? '#22c55e' : '#3b82f6',
              borderRadius: '50%',
              animation: `dataFlow${i % 3} 4s infinite`,
              zIndex: 1,
              boxShadow: `0 0 8px ${activity.status === 'active' ? '#22c55e' : '#3b82f6'}`,
              opacity: 0.8
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pixelWorking {
          0%, 100% { transform: scale(1) translateY(0px); }
          25% { transform: scale(1.05) translateY(-2px); }
          75% { transform: scale(0.95) translateY(2px); }
        }

        @keyframes pixelIdle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes pixelSleeping {
          0%, 100% { transform: scale(0.8) translateY(3px); opacity: 0.5; }
          50% { transform: scale(0.85) translateY(2px); opacity: 0.7; }
        }

        @keyframes activityPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        @keyframes bubbleFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }

        @keyframes screenFlow {
          0% { background: linear-gradient(45deg, #60a5fa, #34d399); }
          33% { background: linear-gradient(45deg, #34d399, #f59e0b); }
          66% { background: linear-gradient(45deg, #f59e0b, #ef4444); }
          100% { background: linear-gradient(45deg, #ef4444, #8b5cf6); }
        }

        @keyframes dataFlow0 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(150px, -80px) scale(1.5); opacity: 1; }
          100% { transform: translate(300px, 0) scale(0); opacity: 0; }
        }

        @keyframes dataFlow1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(-120px, -100px) scale(1.3); opacity: 0.9; }
          100% { transform: translate(-200px, 50px) scale(0); opacity: 0; }
        }

        @keyframes dataFlow2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(80px, 120px) scale(1.4); opacity: 0.7; }
          100% { transform: translate(160px, 250px) scale(0); opacity: 0; }
        }

        .pixel-agent.moving {
          animation: pixelWalking 0.8s infinite !important;
        }

        @keyframes pixelWalking {
          0%, 100% { transform: scale(1) translateY(0px) rotate(0deg); }
          25% { transform: scale(1.02) translateY(-1px) rotate(-1deg); }
          75% { transform: scale(0.98) translateY(1px) rotate(1deg); }
        }

        .workstation.active {
          animation: stationActive 2s infinite;
        }

        @keyframes stationActive {
          0%, 100% { filter: drop-shadow(0 0 8px #3b82f680); }
          50% { filter: drop-shadow(0 0 16px #3b82f6aa); }
        }
      `}</style>
    </div>
  );
}