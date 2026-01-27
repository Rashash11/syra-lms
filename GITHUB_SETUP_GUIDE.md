# Zedny LMS - GitHub Setup Guide

## 🚨 Important: What's NOT in GitHub

When you clone this project, the following are **intentionally excluded** from GitHub:

| Item | Reason | What to Do |
|------|--------|------------|
| `.env` files | Contains secrets (passwords, API keys) | Copy from `.env.example` |
| `node_modules/` | Too large (100+ MB) | Run `npm install` |
| `.venv/` | Python virtual env | Run `python -m venv .venv` |
| Database data | Lives in Docker volumes | Run `docker-compose up` + seed |
| `uploads/` | User-uploaded content | Empty after fresh clone |
| `.next/` | Build cache | Regenerated on build |
| `@prisma/client` | Generated code | Run `npx prisma generate` |

---

## 🚀 Quick Setup (Automated)

### Windows (PowerShell)
```powershell
cd e:\lms
.\setup.ps1
```

### Linux/Mac (Bash)
```bash
cd /path/to/lms
chmod +x setup.sh
./setup.sh
```

---

## 📋 Manual Setup Steps

### Prerequisites
- **Node.js 20+** - [Download](https://nodejs.org)
- **Python 3.11+** - [Download](https://python.org)
- **Docker Desktop** - [Download](https://docker.com)
- **Git** - [Download](https://git-scm.com)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/zedny-lms.git
cd zedny-lms
```

### Step 2: Create Environment Files
```powershell
# Root .env
Copy-Item .env.example .env

# Backend .env
Copy-Item services\api\.env.example services\api\.env
```

**⚠️ IMPORTANT:** Edit both `.env` files with your actual values!

### Step 3: Install Dependencies

**Frontend (Node.js):**
```powershell
npm install
```

**Backend (Python):**
```powershell
cd services\api
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
cd ..\..
```

### Step 4: Start Database
```powershell
docker-compose -f docker-compose.db.yml up -d
```

Wait 10-15 seconds for PostgreSQL to initialize.

### Step 5: Setup Database Schema
```powershell
# Generate Prisma client
npx prisma generate

# Create tables in database
npx prisma db push

# Seed with initial data (admin user, permissions, etc.)
npx prisma db seed
```

### Step 6: Start Development Servers

**Terminal 1 - Backend API:**
```powershell
cd services\api
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### Step 7: Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Default Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@zedny.com | Admin123! |

---

## 🔧 Environment Variables Reference

### Root `.env`
```env
# Database
DATABASE_URL="postgresql://lms_user:lms_password@localhost:5433/lms_db"

# Redis (for background jobs)
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-key-change-me"

# Application URLs
BASE_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Optional: AI Features
OPENAI_API_KEY="sk-..."

# Optional: Email
SENDGRID_API_KEY="SG...."
FROM_EMAIL="noreply@yourdomain.com"
```

### Backend `.env` (`services/api/.env`)
```env
DATABASE_URL=postgresql://lms_user:lms_password@localhost:5433/lms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-me
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 🐛 Troubleshooting

### "Database connection failed"
1. Make sure Docker is running
2. Check if PostgreSQL container is up: `docker ps`
3. Verify DATABASE_URL in both `.env` files

### "Prisma client not generated"
```powershell
npx prisma generate
```

### "Missing permissions after login"
Run the database seeding again:
```powershell
npx prisma db seed
```

Or manually seed RBAC:
```powershell
cd services\api
python -c "from app.db.seed import seed_rbac; seed_rbac()"
```

### "Frontend shows 500 errors"
1. Check backend is running on port 8000
2. Check `next.config.js` proxy settings
3. Clear browser cookies and re-login

### "Python dependencies fail to install"
```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v
```

---

## 📦 What Gets Created After Setup

```
lms/
├── .env                    ← Created from .env.example
├── node_modules/           ← npm install
├── apps/web/.next/         ← npm run dev/build
├── services/api/
│   ├── .env               ← Created from .env.example
│   └── .venv/             ← Python virtual environment
└── [Docker volumes]        ← PostgreSQL & Redis data
```

---

## 🔄 Resetting Everything

If you need to start fresh:

```powershell
# Stop all containers
docker-compose -f docker-compose.db.yml down -v

# Remove node modules
Remove-Item -Recurse -Force node_modules

# Remove Python venv
Remove-Item -Recurse -Force services\api\.venv

# Remove Next.js cache
Remove-Item -Recurse -Force apps\web\.next

# Run setup again
.\setup.ps1
```

---

## 📝 For Developers: What to Commit

**Always commit:**
- Source code (`*.ts`, `*.tsx`, `*.py`, `*.css`)
- Configuration templates (`.env.example`)
- Schema files (`schema.prisma`)
- Package manifests (`package.json`, `requirements.txt`)
- Documentation (`*.md`)

**Never commit:**
- `.env` (secrets!)
- `node_modules/` (too large)
- `.venv/` (platform-specific)
- `uploads/` (user data)
- Build outputs (`.next/`, `dist/`)
- Log files (`*.log`)
