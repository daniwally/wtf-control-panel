#!/bin/bash

API_URL="https://wtf-agents-backend-production.up.railway.app"

echo "🧪 Testing WTF Control Panel APIs"
echo "================================"
echo "Backend: $API_URL"
echo ""

echo "1️⃣ Health Check:"
curl -s "$API_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

echo "2️⃣ Agents:"
curl -s "$API_URL/api/agents" | jq '.' || echo "❌ Agents API failed"
echo ""

echo "3️⃣ System Metrics:"
curl -s "$API_URL/api/metrics/overview" | jq '.' || echo "❌ Metrics API failed"
echo ""

echo "4️⃣ Active Alerts:"
curl -s "$API_URL/api/alerts/active" | jq '.' || echo "❌ Alerts API failed"
echo ""

echo "5️⃣ System Status:"
curl -s "$API_URL/api/system/status" | jq '.' || echo "❌ System status failed"
echo ""

echo "✅ API testing complete!"