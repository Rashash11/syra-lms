# 🚀 Complete Startup Guide - SYRA LMS

This guide provides all the commands needed to run the complete LMS system.

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** >= 20.0.0
- **Python** >= 3.9
- **Docker** and Docker Compose (for database)
- **Git** (for cloning)

---

## 🏁 Quick Start (All Services)

### Option 1: One-Command Startup (Recommended)

Run everything in one go:

```bash
# Windows PowerShell
docker-compose -f docker-compose.db.yml up -d; `
npm install; `
cd services/api; pip install -r requirements.txt; cd ../..; `
npx prisma generate; `
npx prisma db push; `
Start-Job -ScriptBlock { cd $pwd; python -m uvicorn app.main:app --reload --port 8000 --app-dir services/api }; `
npm run dev --turbo
```

### Option 2: Step-by-Step (Better for troubleshooting)

Follow the detailed steps below ⬇️

---

## 📦 Step 1: Initial Setup (One-time only)

### 1.1 Clone the Repository
```bash
git clone <your-repo-url>
cd lms
```

### 1.2 Install Dependencies

**Frontend/Node:**
```bash
npm install
```

**Backend/Python:**
```bash
cd services/api
pip install -r requirements.txt
cd ../..
```

### 1.3 Environment Configuration

Copy and configure environment files:

```bash
# Copy example env files (if they don't exist)
cp .env.example .env
cp services/api/.env.example services/api/.env
```

**Edit `.env` file** - Update these if needed:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Change in production
- `REDIS_URL` - Redis connection

### 1.4 Generate Prisma Client
```bash
npx prisma generate
```

---

## 🗄️ Step 2: Start Database

### Using Docker (Recommended)

**Start PostgreSQL:**
```bash
docker-compose -f docker-compose.db.yml up -d
```

**Check database is running:**
```bash
docker ps
# Should show: lms_postgres
```

**View database logs:**
```bash
docker logs lms_postgres
```

**Stop database when done:**
```bash
docker-compose -f docker-compose.db.yml down
```

### Optional: Start Redis (if using jobs/messaging)

```bash
docker run -d --name lms_redis -p 6379:6379 redis:alpine
```

---

## 🔧 Step 3: Database Migration & Seeding

### 3.1 Push Database Schema
```bash
npx prisma db push
```

### 3.2 Seed Database (Optional)
```bash
npm run db:seed
```

### 3.3 Open Prisma Studio (Visual Database Editor)
```bash
npm run db:studio
# Opens at http://localhost:5555
```

---

## ⚙️ Step 4: Start Backend API (Python/FastAPI)

### Development Mode (with hot reload)

**Windows PowerShell:**
```powershell
cd services/api
python -m uvicorn app.main:app --reload --port 8000
```

**Linux/Mac:**
```bash
cd services/api
python -m uvicorn app.main:app --reload --port 8000
```

**Backend will run on:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs (Swagger UI)

---

## 🌐 Step 5: Start Frontend (Next.js)

In a **new terminal** (keep backend running):

```bash
npm run dev --turbo
```

**Frontend will run on:** http://localhost:3000

**With turbo mode** for faster builds!

---

## 📊 All Services Running

Once everything is started, you should have:

| Service | Port | URL | Status Check |
|---------|------|-----|--------------|
| **Frontend** | 3000 | http://localhost:3000 | Open in browser |
| **Backend API** | 8000 | http://localhost:8000/docs | Swagger UI |
| **PostgreSQL** | 5433 | localhost:5433 | `docker ps` |
| **Redis** | 6379 | localhost:6379 | `docker ps` |
| **Prisma Studio** | 5555 | http://localhost:5555 | If running |

---

## 🛠️ Development Commands

### Frontend Commands

```bash
# Development server with turbo
npm run dev --turbo

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Backend Commands

```bash
# Run backend (from services/api directory)
python -m uvicorn app.main:app --reload --port 8000

# Run with specific host
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
cd services/api
pytest tests/ -v
```

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name <migration_name>

# Reset database
npx prisma db push --force-reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

---

## 🔄 Daily Development Workflow

### Morning Startup (Fresh Start)

```bash
# Terminal 1: Start Database
docker-compose -f docker-compose.db.yml up -d

# Terminal 2: Start Backend
cd services/api
python -m uvicorn app.main:app --reload --port 8000

# Terminal 3: Start Frontend
npm run dev --turbo
```

### Evening Shutdown

```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)

# Stop and remove database
docker-compose -f docker-compose.db.yml down

# Or keep database running for next day:
# (Just Ctrl+C the other services)
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Frontend (3000):**
```powershell
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Start again
npm run dev --turbo
```

**Backend (8000):**
```powershell
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Database Connection Issues

```bash
# Check database is running
docker ps

# Restart database
docker-compose -f docker-compose.db.yml restart

# Check database logs
docker logs lms_postgres

# Test database connection
npx prisma db push
```

### Missing Dependencies

```bash
# Reinstall node modules
rm -rf node_modules package-lock.json
npm install

# Reinstall Python dependencies
cd services/api
pip install -r requirements.txt --force-reinstall
```

### Build Errors

```bash
# Clean Next.js cache
rm -rf .next
rm -rf apps/web/.next

# Rebuild
npm run build
```

---

## 🎯 Quick Reference

### Access Points

- **Application:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Prisma Studio:** http://localhost:5555
- **Database:** localhost:5433

### Default Login (After Seeding)

Check `prisma/seed.ts` for default users or create via:
```bash
npm run db:seed
```

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `PYTHON_BACKEND_URL` - Backend API URL

**Optional:**
- `REDIS_URL` - For background jobs
- `OPENAI_API_KEY` - AI features
- `SENDGRID_API_KEY` - Email sending

---

## 🚢 Production Deployment

### Build for Production

```bash
# Build frontend
npm run build

# Start production server
npm run start

# Or use PM2
pm2 start npm --name "lms-frontend" -- start
```

### Backend Production

```bash
cd services/api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Docker (Full Stack)

```bash
# Build and run all services
docker-compose -f infra/docker-compose.prod.yml up -d
```

---

## 📚 Additional Resources

- **API Documentation:** Visit http://localhost:8000/docs when backend is running
- **Database Schema:** See `packages/db/prisma/schema.prisma`
- **Environment Examples:** See `.env.example` files

---

## ✅ Health Checks

Verify all services are running:

```bash
# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:8000/api/health

# Check database
docker exec lms_postgres pg_isready -U lms_user -d lms_db
```

---

**Happy Coding! 🎉**
