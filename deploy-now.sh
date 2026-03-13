#!/bin/bash

echo "🚂 Railway Deploy Script - Agent Dashboard"
echo "========================================="

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

echo ""
echo "🔐 Railway Authentication Required"
echo "=================================="
echo ""
echo "Para deployar necesitamos conectar con Railway:"
echo "1. Abrí el browser que se va a abrir"
echo "2. Logueate con GitHub/Google"
echo "3. Volvé acá para continuar"
echo ""

# Login
railway login

if [ $? -ne 0 ]; then
    echo "❌ Railway login failed"
    exit 1
fi

echo ""
echo "✅ Login successful!"

# Create new project
echo ""
echo "🆕 Creating Railway project..."
railway new

if [ $? -ne 0 ]; then
    echo "❌ Failed to create Railway project"
    exit 1
fi

echo "✅ Project created"

# Add PostgreSQL
echo ""
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql

echo "✅ PostgreSQL added"

# Get project info
PROJECT_INFO=$(railway status 2>/dev/null || echo "Project created")
echo "📋 Project info: $PROJECT_INFO"

echo ""
echo "📦 Deploying services..."
echo "========================"

# Deploy backend
echo ""
echo "🔧 Deploying backend API..."
cd backend

# Set environment variables for backend
echo "⚙️ Setting backend environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=4000

# Deploy backend
railway up --detach

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed"
    exit 1
fi

echo "✅ Backend deployed"

# Deploy frontend
echo ""
echo "🎨 Deploying frontend dashboard..."
cd ../frontend

# Deploy frontend
railway up --detach

if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed"
    exit 1
fi

echo "✅ Frontend deployed"

cd ..

echo ""
echo "🎉 Initial deployment complete!"
echo "=============================="
echo ""
echo "🔧 Next steps needed:"
echo "1. Configure environment variables"
echo "2. Set up domains" 
echo "3. Update cross-service URLs"
echo ""
echo "🌐 Railway dashboard: https://railway.app/dashboard"
echo ""
echo "📖 Follow DEPLOY-GUIDE.md for complete setup"