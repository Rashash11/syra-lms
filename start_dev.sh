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
export PRISMA_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="super-secure-secret-change-me"
export NODE_ENV=development  # Explicitly set dev mode

# Frontend Specific
export PORT=$FRONTEND_PORT
export HOSTNAME="0.0.0.0"
export NEXT_PUBLIC_BASE_URL="http://localhost:$FRONTEND_PORT"
export BASE_URL="http://localhost:$FRONTEND_PORT"
export PYTHON_BACKEND_URL="http://localhost:$BACKEND_PORT"

echo "Starting LMS Server in DEVELOPMENT MODE..."

# 1. Start Backend (Background)
echo "Starting Backend (Uvicorn with --reload) on port $BACKEND_PORT..."
cd services/api || exit
if [ -d "venv" ]; then
    source venv/bin/activate
fi
# Using --reload for dev
nohup uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
cd ../..

# 2. Start Frontend (Background)
echo "Starting Frontend (Next.js --turbo) on port $FRONTEND_PORT..."

# Run from root using the npm script, passing --turbo
# "npm run dev" calls "node scripts/run-next.js dev"
# passing -- --turbo makes it "node scripts/run-next.js dev --turbo"
nohup npm run dev -- --turbo -p $FRONTEND_PORT > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo "Development Services are running!"
echo "Backend Logs: backend.log"
echo "Frontend Logs: frontend.log"
echo "To stop servers, run: kill $BACKEND_PID $FRONTEND_PID"
