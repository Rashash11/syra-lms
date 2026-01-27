#!/bin/bash

# Configuration
DB_PORT=5433
DB_HOST=localhost
DB_USER=lms_user
DB_PASSWORD=password
DB_NAME=lms_db

# Ports
FRONTEND_PORT=3071
BACKEND_PORT=8071

# Environment Variables
export DATABASE_URL="postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
# For Prisma (needs synchronous driver)
export PRISMA_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="super-secure-secret-change-me"  # REQUIRED for backend
export NODE_ENV=production

# Frontend Specific
export PORT=$FRONTEND_PORT
export HOSTNAME="0.0.0.0"
export NEXT_PUBLIC_BASE_URL="http://localhost:$FRONTEND_PORT"
export BASE_URL="http://localhost:$FRONTEND_PORT"
export PYTHON_BACKEND_URL="http://localhost:$BACKEND_PORT"

echo "Starting LMS Server..."
echo "Database: $DB_HOST:$DB_PORT"
echo "Redis: localhost:6379"

# 1. Start Backend (Background)
echo "Starting Backend on port $BACKEND_PORT..."
cd services/api || exit
# Activate venv if it exists, otherwise assume global/user python
if [ -d "venv" ]; then
    source venv/bin/activate
fi
# Run Uvicorn in background
nohup uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
cd ../..

# 2. Start Frontend (Background)
echo "Starting Frontend on port $FRONTEND_PORT..."

# Check key build artifacts
if [ ! -f "apps/web/.next/BUILD_ID" ]; then
    echo "WARNING: Frontend build artifacts (BUILD_ID) not found!"
    echo "Please run: ./install.sh"
fi

# Try standalone first (most robust for prod)
STANDALONE_PATH="apps/web/.next/standalone/apps/web/server.js"
ALT_STANDALONE_PATH="apps/web/.next/standalone/server.js"

if [ -f "$STANDALONE_PATH" ]; then
    echo "Using standalone build ($STANDALONE_PATH)..."
    # Copy public/static to standalone directory to ensure assets load
    cp -r apps/web/public apps/web/.next/standalone/apps/web/ 2>/dev/null
    cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/ 2>/dev/null
    
    nohup node $STANDALONE_PATH > frontend.log 2>&1 &
elif [ -f "$ALT_STANDALONE_PATH" ]; then
    echo "Using fallback standalone build ($ALT_STANDALONE_PATH)..."
    cp -r apps/web/public apps/web/.next/standalone/ 2>/dev/null
    cp -r apps/web/.next/static apps/web/.next/standalone/.next/ 2>/dev/null
    
    nohup node $ALT_STANDALONE_PATH > frontend.log 2>&1 &
else
    # Using npm start from ROOT (since package.json is in root)
    # The root package.json has "start": "node scripts/run-next.js start"
    # This script handles the Next.js execution for apps/web
    nohup npm start > frontend.log 2>&1 &
fi
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo "Services are running!"
echo "Backend Logs: backend.log"
echo "Frontend Logs: frontend.log"
echo "To stop servers, run: kill $BACKEND_PID $FRONTEND_PID"
