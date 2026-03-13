# Deploying to Railway

Este documento explica cómo deployar el Agent Dashboard a Railway.

## 🚂 Railway Setup

### 1. Preparar el Proyecto

```bash
# Clone o sube el código a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Crear Servicios en Railway

#### Base de Datos (PostgreSQL)
1. New Project → Add PostgreSQL
2. Apuntar la variable `DATABASE_URL`

#### Backend API
1. New Service → GitHub Repo
2. Select: `/backend` directory
3. Variables de entorno:
   ```
   NODE_ENV=production
   DATABASE_URL=<from postgres service>
   TELEGRAM_BOT_TOKEN=<your_token>
   TELEGRAM_CHAT_ID=5054931521
   OPENCLAW_API_URL=<your_openclaw_url>
   FRONTEND_URL=<frontend_railway_url>
   JWT_SECRET=<random_secret>
   ```

#### Frontend Dashboard  
1. New Service → GitHub Repo
2. Select: `/frontend` directory
3. Variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=<backend_railway_url>/api
   NEXT_PUBLIC_WS_URL=wss://<backend_railway_domain>
   ```

### 3. Build Commands

#### Backend (railway.json en /backend)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npx prisma migrate deploy"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Frontend (railway.json en /frontend)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

## 🔧 Configuración de Dominio

### Custom Domains
1. Backend: `dashboard-api.tudominio.com`
2. Frontend: `dashboard.tudominio.com`

### Variables de Entorno Actualizadas
```bash
# Backend
FRONTEND_URL=https://dashboard.tudominio.com

# Frontend  
NEXT_PUBLIC_API_URL=https://dashboard-api.tudominio.com/api
NEXT_PUBLIC_WS_URL=wss://dashboard-api.tudominio.com
```

## 🗄️ Base de Datos

### Migrations en Production
Railway ejecuta automáticamente:
```bash
npx prisma migrate deploy
```

### Seed Data (opcional)
```bash
# En el backend, crear src/seed.js
npx prisma db seed
```

## 📊 Monitoreo

### Health Checks
- Backend: `https://dashboard-api.tudominio.com/health`
- Frontend: `https://dashboard.tudominio.com`

### Logs
```bash
railway logs --service backend
railway logs --service frontend
```

### Métricas
- Railway dashboard para CPU/Memory
- Tu dashboard para métricas de agentes

## 🔒 Seguridad

### Environment Variables
```bash
# Secrets seguros
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://... # Railway maneja automáticamente

# API Keys
TELEGRAM_BOT_TOKEN=...
```

### CORS
Configurado automáticamente para tu dominio frontend.

## 🚀 Deploy Workflow

### Automatic Deployments
Railway se conecta a GitHub y hace redeploy automático en push a main.

### Manual Deploy
```bash
# CLI de Railway
npm install -g @railway/cli
railway login
railway deploy
```

## 🔄 Updates y Rollbacks

### Rolling Updates
Railway hace rolling deployments automáticamente.

### Rollback
```bash
railway rollback <deployment-id>
```

## 📈 Scaling

### Vertical Scaling
Railway escala automáticamente basado en uso.

### Horizontal Scaling
Para traffic alto, duplicar servicios:
- `backend-1`, `backend-2` 
- Load balancer (Cloudflare)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
railway connect postgresql
# Test connection
```

#### Environment Variables
```bash
railway variables
# Verificar todas las variables
```

#### Build Failures
```bash
railway logs --deployment <id>
# Ver logs de build
```

### Support
- Railway Discord
- Railway Docs
- GitHub Issues

## 📝 Checklist de Deploy

- [ ] PostgreSQL service creado
- [ ] Backend service configurado
- [ ] Frontend service configurado
- [ ] Variables de entorno configuradas
- [ ] Database migrations ejecutadas
- [ ] Health checks funcionando
- [ ] Dominios configurados (opcional)
- [ ] CORS configurado
- [ ] Logs funcionando
- [ ] WebSockets funcionando

## 💰 Costos Estimados

### Railway Pricing
- PostgreSQL: ~$5/mes (512MB)
- Backend: ~$5/mes (básico)
- Frontend: ~$5/mes (básico)

**Total: ~$15/mes**

### Optimización de Costos
- Usar plan Developer si es desarrollo
- Configurar sleep para servicios no críticos
- Monitoring para evitar overruns

## 🎯 Post-Deploy

1. **Verificar servicios**:
   - Health checks
   - Conectividad entre servicios
   - WebSocket connections

2. **Configurar agentes**:
   - Update heartbeat URLs
   - Test agent connections

3. **Monitoring**:
   - Set up alerts
   - Monitor costs
   - Check performance

¡Listo! Tu dashboard está funcionando en Railway. 🎉