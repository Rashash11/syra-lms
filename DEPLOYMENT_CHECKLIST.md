# 🚀 Server Deployment Checklist

## ✅ **Pre-Deployment Verification**

### **Step 1: System Requirements**

```bash
# Check Node.js version (MUST be >= 20.0.0)
node --version

# Check npm version
npm --version

# Check Python version (>= 3.9)
python3 --version

# Check Docker
docker --version
docker-compose --version

# Check available disk space (need at least 5GB)
df -h
```

**Required Versions:**
- ✅ Node.js >= 20.0.0
- ✅ npm >= 9.0.0
- ✅ Python >= 3.9
- ✅ Docker >= 20.0
- ✅ Docker Compose >= 2.0

---

### **Step 2: Clone & Navigate**

```bash
# Clone repository
git clone <your-repo-url> /opt/lms
cd /opt/lms

# Verify files exist
ls -la package.json
ls -la services/api/requirements.txt
ls -la docker-compose.db.yml
```

---

### **Step 3: Environment Configuration**

```bash
# Check if .env files exist
ls -la .env
ls -la services/api/.env

# If not, copy from examples:
cp .env.example .env
cp services/api/.env.example services/api/.env

# Edit environment files
nano .env
nano services/api/.env
```

**Required Environment Variables:**
```env
# .env
DATABASE_URL="postgresql://lms_user:password@localhost:5433/lms_db"
JWT_SECRET="change-this-in-production"
REDIS_URL="redis://localhost:6379"
PYTHON_BACKEND_URL="http://localhost:8071"

# services/api/.env
DATABASE_URL=postgresql+asyncpg://lms_user:password@localhost:5433/lms_db
JWT_SECRET=change-this-in-production
```

---

### **Step 4: Install Dependencies**

```bash
cd /opt/lms

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Verify Next.js is installed
if [ -f "node_modules/next/dist/bin/next" ]; then
    echo "✅ Next.js installed successfully"
else
    echo "❌ Next.js installation failed"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd services/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Verify uvicorn is installed
if command -v uvicorn &> /dev/null; then
    echo "✅ uvicorn installed successfully"
else
    echo "❌ uvicorn installation failed"
    exit 1
fi

deactivate
cd ../..
```

---

### **Step 5: Build Verification (Local)**

```bash
cd /opt/lms

# Build the frontend
echo "Building frontend..."
npm run build

# Check build exit code
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Verify build output
ls -la apps/web/.next/standalone
```

---

### **Step 6: Database Setup**

```bash
cd /opt/lms

# Start PostgreSQL
echo "Starting database..."
docker-compose -f docker-compose.db.yml up -d

# Wait for database to be ready
echo "Waiting for database..."
sleep 15

# Check database is running
docker ps | grep lms_postgres

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed database
npm run db:seed
```

---

### **Step 7: Test Services**

```bash
# Test Backend (with venv activated)
cd /opt/lms/services/api
source venv/bin/activate
echo "Testing backend..."
timeout 10s uvicorn app.main:app --host 127.0.0.1 --port 8071 &
sleep 5
curl http://localhost:8071/api/health
kill %1
deactivate
cd ../..

# Test Frontend (production build)
echo "Testing frontend..."
timeout 10s npm run start -- -p 3071 &
sleep 5
curl http://localhost:3071
kill %1
```

---

## 🎯 **Deployment Modes**

### **Option A: Development Mode**

```bash
# Start database
docker-compose -f docker-compose.db.yml up -d

# Start backend
cd services/api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8071

# Start frontend (new terminal)
npm run dev -- --turbo -p 3071 --hostname 0.0.0.0
```

### **Option B: Production Mode (Recommended)**

```bash
# 1. Build frontend
npm run build

# 2. Start database
docker-compose -f docker-compose.db.yml up -d

# 3. Start backend with PM2
cd services/api
source venv/bin/activate
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8071 --workers 4" --name lms-backend

# 4. Start frontend with PM2
cd ../..
pm2 start npm --name lms-frontend -- start -- -p 3071 --hostname 0.0.0.0

# Save PM2 config
pm2 save
pm2 startup
```

### **Option C: Docker (Full Stack)**

```bash
# Use production docker-compose
docker-compose -f infra/docker-compose.prod.yml up -d
```

---

## 🔍 **Post-Deployment Verification**

```bash
# Check all services
docker ps                        # Database should be running
pm2 list                        # Frontend & Backend should be running

# Check ports
netstat -tulpn | grep 3071      # Frontend
netstat -tulpn | grep 8071      # Backend  
netstat -tulpn | grep 5433      # Database

# Test endpoints
curl http://localhost:3071                      # Frontend
curl http://localhost:8071/docs                 # Backend API docs
curl http://localhost:8071/api/health          # Health check

# Check logs
pm2 logs lms-frontend --lines 50
pm2 logs lms-backend --lines 50
docker logs lms_postgres --tail 50
```

---

## 🛡️ **Security Checklist**

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update database password in production
- [ ] Configure firewall (allow only 80, 443, SSH)
- [ ] Setup SSL/TLS certificates (Let's Encrypt)
- [ ] Configure environment-specific `.env` files
- [ ] Enable Docker security scanning
- [ ] Setup log rotation
- [ ] Configure backup strategy
- [ ] Review CORS settings in backend
- [ ] Setup monitoring (optional: Prometheus/Grafana)

---

## 📊 **Monitoring Commands**

```bash
# View logs
pm2 logs                                # All PM2 services
pm2 logs lms-frontend --lines 100      # Frontend logs
pm2 logs lms-backend --lines 100       # Backend logs
docker logs lms_postgres --tail 100    # Database logs

# Resource usage
pm2 monit                              # PM2 monitoring
docker stats                           # Container stats
htop                                   # System resources

# Service status
pm2 status                             # PM2 services
docker ps                              # Docker containers
systemctl status docker                # Docker daemon
```

---

## 🚨 **Common Issues & Fixes**

### **Issue: Node.js version too old**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

### **Issue: uvicorn not found**
```bash
cd /opt/lms/services/api
source venv/bin/activate
pip install uvicorn --force-reinstall
```

### **Issue: Port already in use**
```bash
# Find process using port
lsof -i :3071
lsof -i :8071

# Kill process
kill -9 <PID>
```

### **Issue: Database connection failed**
```bash
# Restart database
docker-compose -f docker-compose.db.yml restart

# Check database logs
docker logs lms_postgres

# Test connection
docker exec lms_postgres pg_isready -U lms_user -d lms_db
```

### **Issue: Build fails**
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json apps/web/.next
npm install
npm run build
```

---

## ✅ **Final Verification Script**

```bash
#!/bin/bash

echo "🔍 LMS Deployment Verification"
echo "=============================="
echo ""

# Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js version too old: $(node --version) (need >= 20.0.0)"
fi

# Dependencies
if [ -f "node_modules/next/dist/bin/next" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend dependencies missing"
fi

if [ -f "services/api/venv/bin/uvicorn" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependencies missing"
fi

# Database
if docker ps | grep -q lms_postgres; then
    echo "✅ Database is running"
else
    echo "❌ Database not running"
fi

# Build
if [ -d "apps/web/.next" ]; then
    echo "✅ Frontend build exists"
else
    echo "⚠️  Frontend not built (run: npm run build)"
fi

echo ""
echo "Deployment Status:"
curl -s http://localhost:3071 > /dev/null && echo "✅ Frontend: ONLINE" || echo "❌ Frontend: OFFLINE"
curl -s http://localhost:8071/api/health > /dev/null && echo "✅ Backend: ONLINE" || echo "❌ Backend: OFFLINE"
```

---

## 🎉 **You're Ready When:**

- ✅ All system requirements met
- ✅ Dependencies installed (npm install + pip install)
- ✅ Build completes successfully (npm run build)
- ✅ Database running and accessible
- ✅ Backend responds to health check
- ✅ Frontend loads in browser
- ✅ Environment variables configured
- ✅ SSL certificates setup (for production)

---

**Good luck with your deployment! 🚀**
