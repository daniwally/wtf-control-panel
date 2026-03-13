# 🚂 Railway Deploy Guide

## Step 1: Repository Setup

```bash
# Ya está inicializado el git repo
git add .
git commit -m "Initial Agent Dashboard commit"

# Conectar a GitHub (crea repo en GitHub primero)
git remote add origin https://github.com/tu-usuario/agent-dashboard.git
git branch -M main
git push -u origin main
```

## Step 2: Railway Project Setup

### 2.1 Crear Proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio `agent-dashboard`

### 2.2 Configurar Base de Datos
1. En tu proyecto Railway, click "Add Service"
2. Selecciona "PostgreSQL"
3. Railway creará automáticamente la variable `DATABASE_URL`

## Step 3: Deploy Backend API

### 3.1 Crear Servicio Backend
1. Click "Add Service" → "GitHub Repo"
2. Selecciona tu repo
3. **Root Directory**: `backend`
4. **Start Command**: `npm start`

### 3.2 Variables de Entorno Backend
Agregar en Railway dashboard:

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://[frontend-domain].railway.app
OPENCLAW_API_URL=https://tu-openclaw-instance.com
TELEGRAM_BOT_TOKEN=tu_bot_token_aquí
TELEGRAM_CHAT_ID=5054931521
JWT_SECRET=tu_jwt_secret_super_seguro
LOG_LEVEL=info
DATABASE_URL=[automático desde PostgreSQL service]
```

### 3.3 Generar Domain Backend
1. En el servicio backend, ve a "Settings" → "Domains"
2. Click "Generate Domain"
3. Apunta el dominio (ej: `backend-xyz.railway.app`)

## Step 4: Deploy Frontend

### 4.1 Crear Servicio Frontend
1. Click "Add Service" → "GitHub Repo"
2. Selecciona tu repo nuevamente
3. **Root Directory**: `frontend`
4. **Start Command**: `npm start`

### 4.2 Variables de Entorno Frontend
```env
NEXT_PUBLIC_API_URL=https://[backend-domain].railway.app/api
NEXT_PUBLIC_WS_URL=wss://[backend-domain].railway.app
```

### 4.3 Generar Domain Frontend
1. En el servicio frontend, ve a "Settings" → "Domains"
2. Click "Generate Domain" 
3. Este será tu dashboard URL

## Step 5: Verificación

### 5.1 Health Checks
```bash
# Backend health
curl https://[backend-domain].railway.app/health

# Frontend
curl https://[frontend-domain].railway.app
```

### 5.2 API Testing
```bash
# Agentes
curl https://[backend-domain].railway.app/api/agents

# Métricas
curl https://[backend-domain].railway.app/api/metrics/overview
```

### 5.3 WebSocket Test
Abrir el frontend y verificar que la conexión WebSocket funciona (check browser console).

## Step 6: Configuration Updates

### 6.1 Update Backend ENV
Una vez que tengas el dominio frontend:
```env
FRONTEND_URL=https://[frontend-domain].railway.app
```

### 6.2 Update Frontend ENV
Una vez que tengas el dominio backend:
```env
NEXT_PUBLIC_API_URL=https://[backend-domain].railway.app/api
NEXT_PUBLIC_WS_URL=wss://[backend-domain].railway.app
```

## Step 7: Agent Integration

### 7.1 Update Heartbeat URLs
En tus agentes OpenClaw, configurar:
```bash
DASHBOARD_API_URL=https://[backend-domain].railway.app/api
```

### 7.2 Test Agent Connection
```bash
# Enviar heartbeat test
curl -X POST https://[backend-domain].railway.app/api/agents/dora/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"status": "OK", "checks": {"test": true}}'
```

## 🎯 Final URLs

Una vez deployado tendrás:

```
🎨 Dashboard:  https://[frontend-domain].railway.app
🔗 Backend:    https://[backend-domain].railway.app
📊 API:        https://[backend-domain].railway.app/api
💗 Health:     https://[backend-domain].railway.app/health
```

## 🔧 Troubleshooting

### Build Issues
```bash
# Ver logs de build
railway logs --service backend
railway logs --service frontend
```

### Database Issues
```bash
# Conectar a DB
railway connect postgresql

# Reset migrations (si necesario)
railway run npx prisma migrate reset
```

### Environment Variables
```bash
# Listar todas las variables
railway variables
```

## 💰 Costos Estimados

- PostgreSQL: ~$5/mes
- Backend API: ~$5/mes  
- Frontend: ~$5/mes
- **Total: ~$15/mes**

## 🚀 Auto-Deploy

Railway hace redeploy automático en cada push a `main`. Para cambios:

```bash
git add .
git commit -m "Update dashboard"
git push origin main
# Railway deployrá automáticamente
```

¡Listo! Tu dashboard estará funcionando en Railway 🎉