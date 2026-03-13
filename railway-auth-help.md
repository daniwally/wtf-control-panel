# 🔐 Railway Authentication Guide

Railway necesita autenticación para deployar. Aquí están las opciones:

## Opción 1: Browser Authentication (Recomendado)

```bash
cd /home/ubuntu/.openclaw/workspace/agent-dashboard
railway login
```

Esto va a:
1. Abrir tu browser
2. Pedirte que te loguees con GitHub/Google
3. Autorizar la conexión

## Opción 2: Token Authentication

Si no tenés acceso a browser desde este servidor:

1. Ve a [railway.app](https://railway.app) en tu browser
2. Logueate normalmente
3. Ve a Settings → Tokens
4. Genera un nuevo token
5. Usalo acá:

```bash
export RAILWAY_TOKEN=tu_token_aquí
railway login
```

## Opción 3: GitHub Integration

1. Subí el código a GitHub primero:

```bash
# Crear repo en GitHub: agent-dashboard
git remote add origin https://github.com/tu-usuario/agent-dashboard.git
git branch -M main
git push -u origin main
```

2. En Railway dashboard:
   - New Project → Deploy from GitHub repo
   - Seleccionar tu repo
   - Railway detectará automáticamente los servicios

## Próximos Pasos

Una vez autenticado, ejecutar:

```bash
./deploy-now.sh
```

O manual:

```bash
railway new                    # Crear proyecto
railway add postgresql         # Agregar DB
cd backend && railway up       # Deploy backend
cd ../frontend && railway up   # Deploy frontend
```

## URLs de Resultado

Después del deploy tendrás:
- Backend API: `https://[random].railway.app`
- Frontend Dashboard: `https://[random].railway.app`
- PostgreSQL: URL interna automática

## Environment Variables a Configurar

En Railway dashboard:

**Backend Service:**
```
NODE_ENV=production
TELEGRAM_BOT_TOKEN=tu_token
TELEGRAM_CHAT_ID=5054931521
OPENCLAW_API_URL=tu_openclaw_url
FRONTEND_URL=[frontend_url_después_del_deploy]
```

**Frontend Service:**
```
NEXT_PUBLIC_API_URL=[backend_url]/api
NEXT_PUBLIC_WS_URL=wss://[backend_url]
```