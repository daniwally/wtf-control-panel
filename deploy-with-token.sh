#!/bin/bash

echo "🔐 Railway Token Deploy"
echo "====================="

if [ -z "$1" ]; then
    echo "❌ Necesitamos tu Railway token"
    echo ""
    echo "🔗 Pasos:"
    echo "1. Ve a https://railway.app"
    echo "2. Login → Settings → Tokens"
    echo "3. Genera nuevo token"
    echo "4. Ejecuta: ./deploy-with-token.sh TU_TOKEN_AQUÍ"
    echo ""
    exit 1
fi

RAILWAY_TOKEN=$1

echo "⚙️ Setting Railway token..."
export RAILWAY_TOKEN=$RAILWAY_TOKEN

echo "🔍 Testing connection..."
railway auth

if [ $? -ne 0 ]; then
    echo "❌ Token authentication failed"
    exit 1
fi

echo "✅ Authentication successful!"
echo ""

echo "🆕 Creating project..."
railway new --name "agent-dashboard"

echo "🗄️ Adding PostgreSQL..."
railway add postgresql

echo ""
echo "🔧 Deploying backend..."
cd backend
railway up --service backend

echo ""
echo "🎨 Deploying frontend..." 
cd ../frontend
railway up --service frontend

echo ""
echo "🎉 Deploy complete!"
echo ""
echo "🌐 Check your Railway dashboard for URLs"
echo "📖 Follow DEPLOY-GUIDE.md for final config"