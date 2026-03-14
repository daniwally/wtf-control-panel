#!/bin/bash

echo "🧪 Testing single API endpoint..."
echo "================================="

URL="https://wtf-agents-backend-production.up.railway.app"

echo "Testing: $URL/api/agents"
echo "------------------------"

curl -v "$URL/api/agents" 2>&1

echo ""
echo "Testing: $URL/"
echo "------------------------"

curl -v "$URL/" 2>&1