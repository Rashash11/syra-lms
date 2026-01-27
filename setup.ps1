# Zedny LMS - Windows Setup Script
# Run this after cloning the repository

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Zedny LMS - Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

# Check prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found! Please install Node.js 20+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "  ✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found! Please install Python 3.11+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "  ✓ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker not found! Please install Docker Desktop from https://docker.com" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create environment files
Write-Host "[2/8] Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path "$ProjectRoot\.env")) {
    Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
    Write-Host "  ✓ Created .env (root)" -ForegroundColor Green
    Write-Host "    ⚠ IMPORTANT: Edit .env with your actual values!" -ForegroundColor Yellow
} else {
    Write-Host "  → .env already exists (skipped)" -ForegroundColor Gray
}

if (-not (Test-Path "$ProjectRoot\services\api\.env")) {
    if (Test-Path "$ProjectRoot\services\api\.env.example") {
        Copy-Item "$ProjectRoot\services\api\.env.example" "$ProjectRoot\services\api\.env"
        Write-Host "  ✓ Created services/api/.env" -ForegroundColor Green
    } else {
        # Create a basic API .env
        @"
DATABASE_URL=postgresql://lms_user:lms_password@localhost:5433/lms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
"@ | Out-File -FilePath "$ProjectRoot\services\api\.env" -Encoding UTF8
        Write-Host "  ✓ Created services/api/.env with defaults" -ForegroundColor Green
    }
} else {
    Write-Host "  → services/api/.env already exists (skipped)" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Install Node dependencies
Write-Host "[3/8] Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npm install
Write-Host "  ✓ Node modules installed" -ForegroundColor Green
Write-Host ""

# Step 4: Setup Python virtual environment
Write-Host "[4/8] Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\services\api"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "  ✓ Virtual environment created" -ForegroundColor Green
}

# Activate and install dependencies
& ".venv\Scripts\Activate.ps1"
pip install --upgrade pip -q
pip install -r requirements.txt -q
Write-Host "  ✓ Python dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 5: Start Docker containers
Write-Host "[5/8] Starting Docker containers (PostgreSQL & Redis)..." -ForegroundColor Yellow
Set-Location $ProjectRoot

# Check if docker-compose.db.yml exists
if (Test-Path "docker-compose.db.yml") {
    docker-compose -f docker-compose.db.yml up -d
} elseif (Test-Path "infra/docker-compose.yml") {
    docker-compose -f infra/docker-compose.yml up -d
} else {
    Write-Host "  ⚠ No docker-compose file found. Please start PostgreSQL and Redis manually." -ForegroundColor Yellow
}

# Wait for database to be ready
Write-Host "  → Waiting for database to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Write-Host "  ✓ Docker containers started" -ForegroundColor Green
Write-Host ""

# Step 6: Generate Prisma client
Write-Host "[6/8] Generating Prisma client..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npx prisma generate
Write-Host "  ✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 7: Push database schema
Write-Host "[7/8] Creating database tables..." -ForegroundColor Yellow
try {
    npx prisma db push --accept-data-loss
    Write-Host "  ✓ Database schema created" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Database push failed. Make sure PostgreSQL is running." -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Seed database
Write-Host "[8/8] Seeding database with initial data..." -ForegroundColor Yellow
try {
    npx prisma db seed
    Write-Host "  ✓ Database seeded" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Seeding failed. You may need to run it manually: npx prisma db seed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env files with your actual configuration" -ForegroundColor Gray
Write-Host "  2. Start the backend:" -ForegroundColor Gray
Write-Host "     cd services\api" -ForegroundColor Yellow
Write-Host "     .venv\Scripts\activate" -ForegroundColor Yellow
Write-Host "     python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Start the frontend (new terminal):" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  4. Open http://localhost:3000 in your browser" -ForegroundColor Gray
Write-Host ""
Write-Host "Default admin credentials:" -ForegroundColor White
Write-Host "  Email: admin@zedny.com" -ForegroundColor Yellow
Write-Host "  Password: Admin123!" -ForegroundColor Yellow
Write-Host ""

Set-Location $ProjectRoot
