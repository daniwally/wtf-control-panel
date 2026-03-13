#!/bin/bash

# Agent Dashboard - Installation Script
# Automatiza la instalación completa del dashboard de agentes OpenClaw

set -e

echo "🚀 Agent Dashboard - Installation Script"
echo "========================================"

# Check requirements
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Requirements check passed"

# Get environment variables
echo ""
echo "📝 Configuration Setup"
echo "======================"

read -p "Enter your Telegram Bot Token (optional): " TELEGRAM_BOT_TOKEN
read -p "Enter your Telegram Chat ID [5054931521]: " TELEGRAM_CHAT_ID
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:-5054931521}

read -p "Enter OpenClaw API URL [http://localhost:8080]: " OPENCLAW_API_URL
OPENCLAW_API_URL=${OPENCLAW_API_URL:-http://localhost:8080}

read -p "Enter Database URL [postgresql://dashboard:dashboard123@localhost:5432/agent_dashboard]: " DATABASE_URL
DATABASE_URL=${DATABASE_URL:-postgresql://dashboard:dashboard123@localhost:5432/agent_dashboard}

echo ""
echo "🔧 Installing Dependencies"
echo "=========================="

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "📄 Creating Environment Files"
echo "============================="

# Create backend .env
cat > backend/.env << EOL
# Database
DATABASE_URL=$DATABASE_URL

# Server
NODE_ENV=development
PORT=4000

# Frontend
FRONTEND_URL=http://localhost:3000

# OpenClaw API
OPENCLAW_API_URL=$OPENCLAW_API_URL

# Telegram Notifications
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# Logging
LOG_LEVEL=info
EOL

# Create frontend .env.local
cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000
EOL

echo "✅ Environment files created"

echo ""
echo "🐳 Starting Database"
echo "==================="

# Start database with docker-compose
docker-compose up -d postgres

echo "⏳ Waiting for database to be ready..."
sleep 10

echo ""
echo "🗄️ Database Setup"
echo "================="

cd backend
echo "📊 Running database migrations..."
npx prisma migrate dev --name init

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Database setup complete"

cd ..

echo ""
echo "🎯 Creating Service Scripts"
echo "=========================="

# Create start script
cat > start.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Agent Dashboard..."

# Start database if not running
docker-compose up -d postgres

# Wait for DB
echo "⏳ Waiting for database..."
sleep 5

# Start backend
echo "🔧 Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend
sleep 10

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Dashboard started!"
echo "📊 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:4000/api"
echo "💗 Health Check: http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose stop; exit 0" INT
wait
EOL

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOL'
#!/bin/bash
echo "🛑 Stopping Agent Dashboard..."

# Kill any running processes
pkill -f "npm run dev" || true
pkill -f "next-server" || true
pkill -f "nodemon" || true

# Stop docker services
docker-compose down

echo "✅ All services stopped"
EOL

chmod +x stop.sh

# Create development script
cat > dev.sh << 'EOL'
#!/bin/bash
echo "🔨 Starting Development Environment..."

# Ensure database is running
docker-compose up -d postgres

# Start both services in separate terminals
if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --tab --title="Backend" -- bash -c "cd backend && npm run dev; exec bash"
    gnome-terminal --tab --title="Frontend" -- bash -c "cd frontend && npm run dev; exec bash"
elif command -v xterm >/dev/null 2>&1; then
    xterm -T "Backend" -e "cd backend && npm run dev; exec bash" &
    xterm -T "Frontend" -e "cd frontend && npm run dev; exec bash" &
else
    echo "⚠️  No terminal emulator found. Run manually:"
    echo "Terminal 1: cd backend && npm run dev"
    echo "Terminal 2: cd frontend && npm run dev"
fi

echo "🎯 Development environment started!"
EOL

chmod +x dev.sh

echo "✅ Service scripts created"

echo ""
echo "📖 Creating Documentation"
echo "========================"

cat > QUICKSTART.md << 'EOL'
# Agent Dashboard - Quick Start

## 🚀 Running the Dashboard

### Option 1: Single Terminal (Production-like)
```bash
./start.sh
```

### Option 2: Development Mode (Separate Terminals)
```bash
./dev.sh
```

### Option 3: Manual
```bash
# Terminal 1 - Database
docker-compose up -d postgres

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## 🔗 URLs

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Health Check**: http://localhost:4000/health

## 🛑 Stopping

```bash
./stop.sh
```

## 📊 Database Management

```bash
# View database
cd backend
npx prisma studio

# Reset database
npx prisma migrate reset

# Apply migrations
npx prisma migrate deploy
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Database only
docker-compose up -d postgres
```

## 🔧 Configuration

- Backend: `backend/.env`
- Frontend: `frontend/.env.local`
- Database: `docker-compose.yml`

## 📝 Development

```bash
# Add new API route
# 1. Create in backend/src/routes/
# 2. Register in backend/src/server.js

# Add new Prisma model
# 1. Edit backend/prisma/schema.prisma
# 2. Run: npx prisma migrate dev

# Frontend development
# Components in frontend/components/
# Pages in frontend/pages/
```

## 🚨 Troubleshooting

### Database connection issues
```bash
docker-compose down
docker-compose up -d postgres
sleep 10
cd backend && npx prisma migrate deploy
```

### Port conflicts
- Change ports in docker-compose.yml
- Update .env files accordingly

### Missing dependencies
```bash
cd backend && npm install
cd frontend && npm install
```

## 🔍 API Testing

```bash
# Health check
curl http://localhost:4000/health

# Get agents
curl http://localhost:4000/api/agents

# Get metrics
curl http://localhost:4000/api/metrics/overview
```
EOL

echo ""
echo "🎉 Installation Complete!"
echo "========================="
echo ""
echo "📊 Dashboard URLs:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:4000/api"
echo "  Health:      http://localhost:4000/health"
echo ""
echo "🚀 Quick Start:"
echo "  ./start.sh       # Start all services"
echo "  ./dev.sh         # Development mode"
echo "  ./stop.sh        # Stop all services"
echo ""
echo "📖 Documentation:"
echo "  README.md        # Complete documentation"
echo "  QUICKSTART.md    # Quick reference"
echo ""
echo "🔍 Next Steps:"
echo "1. Run './start.sh' to launch the dashboard"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Configure your OpenClaw agents to send heartbeats to the API"
echo ""
echo "🎯 Happy monitoring!"