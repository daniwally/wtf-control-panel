#!/bin/bash

# Railway Deploy Script para Agent Dashboard
echo "🚂 Deploying Agent Dashboard to Railway..."
echo "========================================="

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Logging into Railway..."
railway login

echo "📋 Preparing deployment..."

# Create new project
echo "🆕 Creating Railway project..."
railway new

# Add PostgreSQL addon
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql

# Deploy backend
echo "🔧 Deploying backend API..."
cd backend
railway up --service backend

# Deploy frontend  
echo "🎨 Deploying frontend dashboard..."
cd ../frontend
railway up --service frontend

echo ""
echo "🎉 Deployment initiated!"
echo "===================="
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Railway dashboard"
echo "2. Configure environment variables for each service"
echo "3. Generate domains for backend and frontend"
echo "4. Update cross-service URLs"
echo ""
echo "📖 See DEPLOY-GUIDE.md for detailed instructions"