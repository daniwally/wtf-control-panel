# 🚂 Deploy WTF Control Panel a Railway

## ✅ Código ya subido a GitHub
- **Repo**: https://github.com/daniwally/wtf-control-panel
- **Branch**: main
- **Status**: ✅ Ready to deploy

## 🚀 Pasos para Deploy en Railway

### 1. Ir a Railway Dashboard
🔗 **[railway.app](https://railway.app)**

### 2. Crear Nuevo Proyecto
- Click **"Start a New Project"**
- Seleccionar **"Deploy from GitHub repo"**
- Elegir **"daniwally/wtf-control-panel"**

### 3. Railway detectará automáticamente:
- ✅ **Backend API** (directorio `/backend`)
- ✅ **Frontend Dashboard** (directorio `/frontend`)
- ✅ **Railway configs** ya configurados

### 4. Agregar Base de Datos
- Click **"Add Service"**
- Seleccionar **"PostgreSQL"**
- Railway creará automáticamente `DATABASE_URL`

### 5. Configurar Variables de Entorno

#### 🔧 Backend Service
```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=<tu_bot_token>
TELEGRAM_CHAT_ID=5054931521
OPENCLAW_API_URL=<tu_openclaw_instance_url>
JWT_SECRET=<generar_random_32_chars>
```

#### 🎨 Frontend Service  
```env
NEXT_PUBLIC_API_URL=<backend_railway_url>/api
NEXT_PUBLIC_WS_URL=wss://<backend_railway_url>
```

### 6. Generar Dominios
- **Backend**: Settings → Domains → Generate Domain
- **Frontend**: Settings → Domains → Generate Domain
- **Apuntar URLs** para completar variables de entorno

### 7. Deploy Automático
Railway deployará automáticamente al detectar el repo.

## 🎯 URLs Finales

Después del deploy tendrás:

```
🎨 WTF Control Panel:    https://[frontend-xyz].railway.app
🔗 Backend API:          https://[backend-abc].railway.app
📊 API Endpoints:        https://[backend-abc].railway.app/api
💗 Health Check:         https://[backend-abc].railway.app/health
```

## 🔧 Testing del Deploy

### Health Check
```bash
curl https://[backend-url].railway.app/health
```

### API Test
```bash
curl https://[backend-url].railway.app/api/agents
curl https://[backend-url].railway.app/api/metrics/overview
```

### Dashboard
Abrí `https://[frontend-url].railway.app` en el browser.

## ⚙️ Variables de Entorno Específicas

### Backend (.env values needed):
```bash
NODE_ENV=production
DATABASE_URL=<auto_from_postgresql_service>
TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
TELEGRAM_CHAT_ID=5054931521
OPENCLAW_API_URL=<your_openclaw_instance>
FRONTEND_URL=<frontend_railway_url>
JWT_SECRET=<generate_random_secret>
```

### Frontend (.env values needed):
```bash
NEXT_PUBLIC_API_URL=<backend_railway_url>/api
NEXT_PUBLIC_WS_URL=wss://<backend_railway_url>
```

## 🔄 Auto-Deploy Configurado

Cada push a `main` en GitHub disparará un redeploy automático en Railway.

```bash
# Para updates futuros:
git add .
git commit -m "Update control panel"
git push origin main
# Railway redeploya automáticamente
```

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **GitHub Issues**: https://github.com/daniwally/wtf-control-panel/issues

## 🎉 Next Steps

1. **Deploy en Railway** (siguiendo pasos arriba)
2. **Configurar variables** de entorno
3. **Probar dashboard** funcionando
4. **Integrar agentes** OpenClaw con nuevas URLs
5. **Configurar alertas** a Telegram

¡El WTF Control Panel está listo para producción! 🚀