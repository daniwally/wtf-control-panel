import { useState, useEffect } from 'react';

export default function PixelWorld({ agents, activities }) {
  const [worldState, setWorldState] = useState({});
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update world state based on agent activities
    const newWorldState = {};
    
    agents.forEach(agent => {
      const recentActivity = activities.find(a => a.agentName === agent.name && a.status === 'active');
      newWorldState[agent.name] = {
        working: agent.status === 'ONLINE' && recentActivity,
        activity: recentActivity?.description || (agent.status === 'ONLINE' ? 'Monitoring...' : 'Offline'),
        type: recentActivity?.type || 'idle',
        location: getAgentLocation(agent.name, recentActivity),
        mood: getAgentMood(agent, recentActivity)
      };
    });
    
    setWorldState(newWorldState);
  }, [agents, activities]);

  const getAgentLocation = (agentName, activity) => {
    if (!activity) return 'desk';
    
    if (activity.description.includes('gmail') || activity.description.includes('email')) return 'communication';
    if (activity.description.includes('web') || activity.description.includes('search')) return 'research';
    if (activity.description.includes('file') || activity.description.includes('memory')) return 'archive';
    if (activity.description.includes('command') || activity.description.includes('executing')) return 'terminal';
    return 'desk';
  };

  const getAgentMood = (agent, activity) => {
    if (agent.status === 'OFFLINE') return 'sleeping';
    if (activity?.status === 'active') return 'focused';
    if (agent.activeAlerts > 0) return 'concerned';
    return 'content';
  };

  const renderAgent = (agent, position) => {
    const state = worldState[agent.name] || {};
    const isWorking = state.working;
    
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

    return (
      <div
        key={agent.id}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: '32px',
          height: '32px',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10
        }}
      >
        {/* Agent Shadow */}
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '50%',
          filter: 'blur(2px)'
        }} />

        {/* Agent Body */}
        <div style={{
          width: '32px',
          height: '32px',
          background: `linear-gradient(45deg, ${agentColors[agent.name]}, ${agentColors[agent.name]}dd)`,
          borderRadius: '6px',
          border: '2px solid #1f2937',
          position: 'relative',
          animation: isWorking ? 'agentWorking 2s infinite' : state.mood === 'sleeping' ? 'agentSleeping 4s infinite' : 'agentIdle 3s infinite',
          transform: agent.status === 'OFFLINE' ? 'scale(0.8)' : 'scale(1)',
          filter: agent.status === 'OFFLINE' ? 'grayscale(100%) brightness(0.7)' : 'none'
        }}>
          {/* Agent Face */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '16px',
            filter: agent.status === 'OFFLINE' ? 'grayscale(100%)' : 'none'
          }}>
            {agentEmojis[agent.name]}
          </div>

          {/* Activity Indicator */}
          {isWorking && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '12px',
              height: '12px',
              background: '#22c55e',
              borderRadius: '50%',
              border: '2px solid #fff',
              animation: 'activityPulse 1s infinite',
              boxShadow: '0 0 8px #22c55e66'
            }} />
          )}
        </div>

        {/* Speech Bubble */}
        {state.activity && agent.status === 'ONLINE' && (
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '6px 8px',
            borderRadius: '12px',
            fontSize: '9px',
            maxWidth: '100px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            border: '1px solid #e5e7eb',
            zIndex: 15,
            fontWeight: '500',
            color: '#1f2937',
            animation: 'speechFloat 3s infinite'
          }}>
            {state.activity.slice(0, 25)}...
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(255,255,255,0.95)'
            }} />
          </div>
        )}

        {/* Agent Name */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: '8px',
          fontSize: '8px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          {agent.name}
        </div>
      </div>
    );
  };

  const renderRoom = (room, style) => (
    <div style={{
      position: 'absolute',
      border: '3px solid #374151',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #4b5563, #6b7280)',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      ...style
    }}>
      {/* Room Label */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        background: 'rgba(0,0,0,0.7)',
        color: '#f9fafb',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        fontFamily: 'monospace'
      }}>
        {room}
      </div>
    </div>
  );

  const renderWorkstation = (type, position, isActive = false) => {
    const workstationColors = {
      desk: '#8B4513',
      server: '#2d3748', 
      terminal: '#1a202c',
      archive: '#744210'
    };

    return (
      <div style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '40px',
        height: '28px',
        background: workstationColors[type],
        borderRadius: '4px',
        border: '2px solid #1f2937',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.4)',
        zIndex: 2
      }}>
        {/* Screen/Monitor */}
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '16px',
          height: '12px',
          background: isActive ? '#60a5fa' : '#374151',
          borderRadius: '2px',
          border: '1px solid #1f2937',
          boxShadow: isActive ? '0 0 8px #60a5faaa' : 'none'
        }}>
          {isActive && (
            <div style={{
              position: 'absolute',
              inset: '1px',
              background: 'linear-gradient(45deg, #60a5fa, #34d399)',
              borderRadius: '1px',
              opacity: 0.8,
              animation: 'screenActivity 2s infinite'
            }} />
          )}
        </div>

        {/* Keyboard */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '4px',
          background: '#2d3748',
          borderRadius: '1px'
        }} />
      </div>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #1f2937 100%)',
      borderRadius: '12px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '500px',
      width: '100%'
    }}>
      {/* World Background Grid */}
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
        backgroundSize: '32px 32px',
        opacity: 0.15
      }} />

      {/* Time Display */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(0,0,0,0.8)',
        color: '#f9fafb',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid #374151'
      }}>
        🕒 {time.toLocaleTimeString()}
      </div>

      {/* World Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <h3 style={{
          color: '#f9fafb',
          margin: 0,
          fontSize: '20px',
          fontFamily: 'monospace',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          letterSpacing: '1px'
        }}>
          🌍 WTF AGENCY - PIXEL WORLD
        </h3>
        <p style={{
          color: '#d1d5db',
          margin: '4px 0 0 0',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          Live Agent Simulation • Real-time Activity Monitor
        </p>
      </div>

      {/* World Layout */}
      <div style={{ 
        position: 'relative',
        height: '400px',
        margin: '20px 0'
      }}>
        {/* Main Office Room */}
        {renderRoom('MAIN OFFICE', {
          left: '50px',
          top: '50px', 
          width: '300px',
          height: '200px'
        })}

        {/* Server Room */}
        {renderRoom('SERVER', {
          left: '400px',
          top: '50px',
          width: '120px', 
          height: '100px'
        })}

        {/* Archive Room */}
        {renderRoom('ARCHIVE', {
          left: '400px',
          top: '180px',
          width: '120px',
          height: '70px'
        })}

        {/* Meeting Room */}
        {renderRoom('MEETING', {
          left: '50px',
          top: '280px',
          width: '180px',
          height: '80px'
        })}

        {/* Workstations */}
        {renderWorkstation('desk', { x: 80, y: 100 }, worldState.dora?.working)}
        {renderWorkstation('desk', { x: 180, y: 100 }, worldState.oscar?.working)}
        {renderWorkstation('desk', { x: 280, y: 100 }, worldState.fermin?.working)}
        {renderWorkstation('server', { x: 420, y: 80 }, true)}
        {renderWorkstation('terminal', { x: 420, y: 120 }, false)}
        {renderWorkstation('archive', { x: 420, y: 200 }, false)}

        {/* Agents */}
        {agents.map(agent => {
          const basePositions = {
            dora: { x: 85, y: 120 },
            oscar: { x: 185, y: 120 },
            fermin: { x: 285, y: 120 }
          };

          const state = worldState[agent.name] || {};
          let position = basePositions[agent.name];

          // Move agents based on their activity
          if (state.location === 'communication') position = { x: 420, y: 80 };
          else if (state.location === 'research') position = { x: 420, y: 120 };
          else if (state.location === 'archive') position = { x: 420, y: 200 };

          return renderAgent(agent, position);
        })}

        {/* Activity Particles */}
        {activities.slice(0, 3).map((activity, i) => (
          <div
            key={`particle_${activity.id}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '30%',
              width: '4px',
              height: '4px',
              background: activity.status === 'active' ? '#22c55e' : '#60a5fa',
              borderRadius: '50%',
              animation: `particle${i} 3s infinite`,
              zIndex: 1,
              boxShadow: `0 0 6px ${activity.status === 'active' ? '#22c55e' : '#60a5fa'}`
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes agentWorking {
          0%, 100% { transform: scale(1) translateY(0px); }
          25% { transform: scale(1.02) translateY(-1px); }
          75% { transform: scale(0.98) translateY(1px); }
        }

        @keyframes agentIdle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }

        @keyframes agentSleeping {
          0%, 100% { transform: scale(0.8) translateY(2px); opacity: 0.6; }
          50% { transform: scale(0.82) translateY(1px); opacity: 0.8; }
        }

        @keyframes activityPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        @keyframes speechFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-2px); }
        }

        @keyframes screenActivity {
          0%, 100% { opacity: 0.8; background: linear-gradient(45deg, #60a5fa, #34d399); }
          25% { opacity: 1; background: linear-gradient(45deg, #34d399, #f59e0b); }
          50% { opacity: 0.9; background: linear-gradient(45deg, #f59e0b, #ef4444); }
          75% { opacity: 1; background: linear-gradient(45deg, #ef4444, #8b5cf6); }
        }

        @keyframes particle0 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(100px, -50px) scale(1.5); opacity: 0.7; }
          100% { transform: translate(200px, 0) scale(0); opacity: 0; }
        }

        @keyframes particle1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(-80px, -80px) scale(1.2); opacity: 0.8; }
          100% { transform: translate(-150px, 20px) scale(0); opacity: 0; }
        }

        @keyframes particle2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(50px, 100px) scale(1.3); opacity: 0.6; }
          100% { transform: translate(120px, 200px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}