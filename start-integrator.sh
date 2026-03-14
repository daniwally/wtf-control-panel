#!/bin/bash
# Start OpenClaw Real Agent Integrator
# This connects your real OpenClaw agents to the WTF Control Panel

echo "🚀 Starting OpenClaw Real Agent Integrator..."
echo "📡 This will monitor your real agents and send data to the Control Panel"

cd "$(dirname "$0")"

# Check if OpenClaw is available
if command -v openclaw >/dev/null 2>&1; then
    echo "✅ OpenClaw found"
    openclaw status
else
    echo "⚠️ OpenClaw not found, will use enhanced mock data"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install axios
fi

echo ""
echo "🎮 WTF Control Panel Integration"
echo "================================"
echo "📊 Dashboard: https://wtf-control-panel-production-295c.up.railway.app"
echo "📡 Backend: https://wtf-control-panel-production-6dc0.up.railway.app"
echo ""

# Start the integrator
echo "🔄 Starting real agent monitoring..."
node integrator.js start

echo ""
echo "⏹️ Integrator stopped"