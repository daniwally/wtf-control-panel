# 🚂 Railway CLI Commands

Una vez deployado, estos comandos te ayudan a gestionar los servicios.

## 🔧 Setup Inicial

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto existente
railway link [project-id]
```

## 📊 Monitoring

```bash
# Ver logs en tiempo real
railway logs --service backend
railway logs --service frontend
railway logs --service postgresql

# Logs específicos de deployment
railway logs --deployment [deployment-id]

# Status de servicios
railway status
```

## 🔧 Configuration

```bash
# Ver variables de entorno
railway variables

# Agregar variable
railway variables set KEY=value

# Variables por servicio
railway variables set KEY=value --service backend
railway variables set KEY=value --service frontend

# Conectar a PostgreSQL
railway connect postgresql
```

## 🚀 Deploy Operations

```bash
# Deploy forzado
railway up --service backend
railway up --service frontend

# Restart servicio
railway restart --service backend

# Ver deployments
railway history

# Rollback
railway rollback [deployment-id]
```

## 📈 Scaling & Performance

```bash
# Ver métricas
railway metrics

# Ver usage
railway usage

# Info del proyecto
railway info
```

## 🗄️ Database Operations

```bash
# Conectar a DB
railway connect postgresql

# Backup (manual)
railway connect postgresql -- pg_dump > backup.sql

# Ejecutar migrations
railway run --service backend npx prisma migrate deploy

# Reset DB (cuidado!)
railway run --service backend npx prisma migrate reset --force
```

## 🌐 Domain Management

```bash
# Generar dominio
railway domain

# Custom domain
railway domain add your-domain.com

# Ver dominios
railway domain list
```

## 🔍 Debugging

```bash
# Shell en contenedor
railway shell --service backend

# Ejecutar comando remoto
railway run --service backend npm run debug

# Variables de entorno de un servicio
railway variables --service backend

# Connect to service directly
railway connect [service-name]
```

## 💾 Backup & Recovery

```bash
# Backup completo del proyecto
railway backup create

# Restore from backup
railway backup restore [backup-id]

# Export project config
railway export > project-config.json
```

## 🔄 Development Workflow

```bash
# Desarrollo local conectado
railway run --service backend npm run dev

# Environment sync
railway vars pull > .env.local

# Deploy preview
railway up --detach
```

## 🚨 Emergency Commands

```bash
# Emergency stop
railway down

# Force restart all
railway restart

# Scale down to 0 (pause)
railway scale 0

# Scale back up
railway scale 1

# Emergency logs
railway logs --tail 100 --service backend
```

## 📋 Quick Reference

### Variables Necesarias

**Backend:**
```bash
railway variables set NODE_ENV=production --service backend
railway variables set TELEGRAM_BOT_TOKEN=your_token --service backend
railway variables set TELEGRAM_CHAT_ID=5054931521 --service backend
railway variables set OPENCLAW_API_URL=your_openclaw_url --service backend
```

**Frontend:**
```bash
railway variables set NEXT_PUBLIC_API_URL=https://backend-xyz.railway.app/api --service frontend
railway variables set NEXT_PUBLIC_WS_URL=wss://backend-xyz.railway.app --service frontend
```

### Health Checks

```bash
# Backend health
curl $(railway url --service backend)/health

# Test API
curl $(railway url --service backend)/api/agents

# Frontend
curl $(railway url --service frontend)
```

### Quick Deploy

```bash
# Update y deploy
git add . && git commit -m "Update" && git push
# Railway auto-deploys en push a main
```

## 📞 Support

- Railway Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app