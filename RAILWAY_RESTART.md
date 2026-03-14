# Railway Manual Restart Needed

## Problema:
Railway no está deployando la nueva versión del servidor simple.

## Solución Manual:
1. Ve a Railway dashboard
2. Backend service → **Deployments** 
3. Click en "**Redeploy**" del último deployment
4. O en **Settings** → **General** → **Restart**

## Alternativa:
Cambiar **Start Command** directamente en Railway:

**Backend Settings → Deploy → Start Command:**
```
node simple-api-server.js
```

## Verificar:
Una vez que reinicie, verificar:
```
curl https://wtf-agents-backend-production.up.railway.app/api/agents
```

Debería devolver JSON con agentes mock, no 404.