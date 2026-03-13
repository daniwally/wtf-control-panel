# Agent Dashboard - Panel de Control OpenClaw

Dashboard completo para monitorear actividad de agentes OpenClaw en tiempo real.

## 🎯 Features

### Core Monitoring
- ✅ Status de agentes (online/offline/última actividad)
- ✅ Heartbeats en tiempo real
- ✅ Logs de actividad reciente 
- ✅ Métricas de uso (tokens, costos, mensajes)
- ✅ Checks automáticos (vencimientos, mail, disco, AWS)

### Analytics
- 📊 Mensajes procesados por agente
- 📈 Tareas completadas/fallidas
- ⏱️ Tiempo de respuesta promedio
- 🚨 Alertas activas y historial
- 📅 Graphs de actividad (día/semana/mes)

### Administration
- ⚙️ Config de agentes desde panel
- 🔧 Restart/stop agentes remotamente
- 📱 Notificaciones a Telegram
- 💾 Export de logs y métricas

## 🏗️ Arquitectura

### Backend (Node.js + Express)
- **API REST:** Endpoints para métricas y config
- **WebSocket Server:** Updates en tiempo real
- **Database:** PostgreSQL para logs y métricas
- **Agent Collector:** Recolecta datos de agentes vía OpenClaw API
- **Alert System:** Notificaciones automáticas

### Frontend (Next.js + React)
- **Dashboard Home:** Overview general + métricas clave
- **Agent Detail:** Vista detallada por agente
- **Logs Viewer:** Explorador de logs con filtros
- **Config Panel:** Configuración de agentes
- **Alerts Center:** Gestión de alertas

### Deploy (Railway)
- **Backend Service:** API + WebSocket server
- **Frontend Service:** Next.js app
- **Database:** PostgreSQL addon
- **Environment:** Variables de config

## 🚀 Stack Tecnológico

- **Backend:** Node.js, Express, Socket.IO, Prisma ORM
- **Frontend:** Next.js, React, TailwindCSS, Chart.js, React Query
- **Database:** PostgreSQL
- **Real-time:** WebSockets (Socket.IO)
- **Deploy:** Railway
- **Notifications:** Telegram Bot API

## 📁 Estructura del Proyecto

```
agent-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Agent collector, alerts
│   │   ├── models/         # Database models
│   │   ├── websocket/      # Socket.IO handlers
│   │   └── utils/          # Helpers
│   ├── prisma/
│   │   └── schema.prisma   # DB schema
│   └── package.json
├── frontend/
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── hooks/             # React hooks
│   ├── utils/             # Frontend helpers
│   └── package.json
├── docker-compose.yml     # Local development
└── railway.json          # Railway config
```

## 🔄 Data Flow

1. **Agent Collector** consulta APIs de OpenClaw cada 30s
2. **Backend** procesa y almacena datos en PostgreSQL
3. **WebSocket** broadcastea updates a clientes conectados
4. **Frontend** recibe updates y actualiza UI en tiempo real
5. **Alert System** evalúa condiciones y notifica vía Telegram

## 📊 Métricas Principales

### Agent Status
- Online/Offline status
- Última actividad (timestamp)
- Uptime total
- Restart count

### Performance
- Messages processed/hour
- Response time avg/p95/p99
- Success rate
- Error rate + tipos

### Resource Usage
- Tokens consumed
- Cost per agent
- Memory usage (si disponible)
- API calls/hour

### Business Metrics
- Vencimientos procesados
- Mails procesados
- Alertas generadas
- Tareas completadas

## 🚨 Alert Rules

### Critical
- Agent offline > 5 min
- Error rate > 10%
- Vencimiento detectado
- Disco < 15%

### Warning  
- Response time > 30s
- No heartbeat en 10 min
- Cost spike > 50%

### Info
- Agent restart
- New version deployed
- Daily summary

## 🎨 UI Design

### Color Scheme
- Primary: Azul OpenClaw (#2563eb)
- Success: Verde (#10b981)
- Warning: Amarillo (#f59e0b)
- Error: Rojo (#ef4444)
- Background: Gris oscuro (#1f2937)

### Components
- **StatusCard:** Agent status con colores
- **MetricChart:** Gráficos de tiempo
- **LogTable:** Tabla de logs filtrable
- **AlertBadge:** Badges de alertas
- **ConfigForm:** Formularios de config

## 🚀 Development Plan

### Fase 1: MVP (Semana 1)
- ✅ Backend API básico
- ✅ Frontend con dashboard simple
- ✅ Agent status monitoring
- ✅ Basic logs viewer

### Fase 2: Real-time (Semana 2)  
- ✅ WebSocket integration
- ✅ Live updates en UI
- ✅ Alert system básico
- ✅ Telegram notifications

### Fase 3: Analytics (Semana 3)
- ✅ Métricas avanzadas
- ✅ Charts y graphs
- ✅ Historical data
- ✅ Export functionality

### Fase 4: Admin (Semana 4)
- ✅ Agent configuration
- ✅ Remote control
- ✅ User management
- ✅ Advanced alerting

## 🛠️ Installation & Setup

```bash
# Clone repo
git clone <repo>
cd agent-dashboard

# Backend setup
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend setup (nueva terminal)
cd frontend
npm install
npm run dev

# Access dashboard
open http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql://...
OPENCLAW_API_URL=http://localhost:8080
TELEGRAM_BOT_TOKEN=...
JWT_SECRET=...
NODE_ENV=development
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## 📝 Next Steps

1. **Crear estructura básica** del proyecto
2. **Setup database** con Prisma
3. **Implementar API** de métricas
4. **Construir frontend** con componentes base
5. **Deploy a Railway** y testing
6. **Integrar WebSockets** para real-time
7. **Agregar system de alertas**
8. **Refinamiento y features avanzadas**

¿Arrancamos con la estructura y el backend?