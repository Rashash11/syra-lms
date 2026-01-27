#!/bin/bash
# Zedny LMS - Linux/Mac Setup Script
# Run this after cloning the repository

set -e

echo "========================================"
echo "  Zedny LMS - Project Setup"
echo "========================================"
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✓ Node.js: $NODE_VERSION${NC}"
else
    echo -e "  ${RED}✗ Node.js not found! Please install Node.js 20+ from https://nodejs.org${NC}"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "  ${GREEN}✓ Python: $PYTHON_VERSION${NC}"
else
    echo -e "  ${RED}✗ Python not found! Please install Python 3.11+${NC}"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "  ${GREEN}✓ Docker: $DOCKER_VERSION${NC}"
else
    echo -e "  ${RED}✗ Docker not found! Please install Docker${NC}"
    exit 1
fi

echo ""

# Step 2: Create environment files
echo -e "${YELLOW}[2/8] Setting up environment files...${NC}"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo -e "  ${GREEN}✓ Created .env (root)${NC}"
    echo -e "  ${YELLOW}⚠ IMPORTANT: Edit .env with your actual values!${NC}"
else
    echo -e "  → .env already exists (skipped)"
fi

if [ ! -f "$PROJECT_ROOT/services/api/.env" ]; then
    if [ -f "$PROJECT_ROOT/services/api/.env.example" ]; then
        cp "$PROJECT_ROOT/services/api/.env.example" "$PROJECT_ROOT/services/api/.env"
        echo -e "  ${GREEN}✓ Created services/api/.env${NC}"
    else
        cat > "$PROJECT_ROOT/services/api/.env" << EOF
DATABASE_URL=postgresql://lms_user:lms_password@localhost:5433/lms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
        echo -e "  ${GREEN}✓ Created services/api/.env with defaults${NC}"
    fi
else
    echo -e "  → services/api/.env already exists (skipped)"
fi

echo ""

# Step 3: Install Node dependencies
echo -e "${YELLOW}[3/8] Installing Node.js dependencies...${NC}"
cd "$PROJECT_ROOT"
npm install
echo -e "  ${GREEN}✓ Node modules installed${NC}"
echo ""

# Step 4: Setup Python virtual environment
echo -e "${YELLOW}[4/8] Setting up Python virtual environment...${NC}"
cd "$PROJECT_ROOT/services/api"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "  ${GREEN}✓ Virtual environment created${NC}"
fi

source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "  ${GREEN}✓ Python dependencies installed${NC}"
echo ""

# Step 5: Start Docker containers
echo -e "${YELLOW}[5/8] Starting Docker containers (PostgreSQL & Redis)...${NC}"
cd "$PROJECT_ROOT"

if [ -f "docker-compose.db.yml" ]; then
    docker-compose -f docker-compose.db.yml up -d
elif [ -f "infra/docker-compose.yml" ]; then
    docker-compose -f infra/docker-compose.yml up -d
else
    echo -e "  ${YELLOW}⚠ No docker-compose file found. Please start PostgreSQL and Redis manually.${NC}"
fi

echo -e "  → Waiting for database to be ready..."
sleep 5
echo -e "  ${GREEN}✓ Docker containers started${NC}"
echo ""

# Step 6: Generate Prisma client
echo -e "${YELLOW}[6/8] Generating Prisma client...${NC}"
cd "$PROJECT_ROOT"
npx prisma generate
echo -e "  ${GREEN}✓ Prisma client generated${NC}"
echo ""

# Step 7: Push database schema
echo -e "${YELLOW}[7/8] Creating database tables...${NC}"
npx prisma db push --accept-data-loss || echo -e "  ${YELLOW}⚠ Database push failed. Make sure PostgreSQL is running.${NC}"
echo ""

# Step 8: Seed database
echo -e "${YELLOW}[8/8] Seeding database with initial data...${NC}"
npx prisma db seed || echo -e "  ${YELLOW}⚠ Seeding failed. You may need to run it manually: npx prisma db seed${NC}"
echo ""

echo "========================================"
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env files with your actual configuration"
echo "  2. Start the backend:"
echo -e "     ${YELLOW}cd services/api${NC}"
echo -e "     ${YELLOW}source .venv/bin/activate${NC}"
echo -e "     ${YELLOW}python -m uvicorn app.main:app --reload --port 8000${NC}"
echo ""
echo "  3. Start the frontend (new terminal):"
echo -e "     ${YELLOW}npm run dev${NC}"
echo ""
echo "  4. Open http://localhost:3000 in your browser"
echo ""
echo "Default admin credentials:"
echo -e "  Email: ${YELLOW}admin@zedny.com${NC}"
echo -e "  Password: ${YELLOW}Admin123!${NC}"
echo ""

cd "$PROJECT_ROOT"
