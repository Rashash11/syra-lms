# 🚀 Quick Start Guide

Get Zedny LMS running in 5 minutes!

## Prerequisites

- Node.js 20+ 
- Python 3.10+
- PostgreSQL 15+ (or Docker)

## Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd zedny-lms

# 2. Start all services with Docker
docker-compose up -d

# 3. Wait for services to be ready (check logs)
docker-compose logs -f

# 4. Access the application
open http://localhost:3000
```

## Option 2: Manual Setup

### 1. Database Setup

**Using Docker:**
```bash
docker run --name lms_postgres \
  -e POSTGRES_DB=lms_db \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_password \
  -p 5433:5432 \
  -d postgres:15-alpine
```

**Or install PostgreSQL locally and create:**
```sql
CREATE DATABASE lms_db;
CREATE USER lms_user WITH PASSWORD 'lms_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env if needed

# Start backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local if needed

# Start frontend
npm run dev
```

## 🎯 Access the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000
3. **API Docs**: http://localhost:8000/api/docs

## 👤 Demo Accounts

Create accounts via signup or use these demo credentials:

- **Admin**: admin@lms.com / Admin123!
- **Instructor**: instructor@lms.com / Instructor123!  
- **Learner**: learner@lms.com / Learner123!

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps  # or pg_isready if installed locally

# Check connection
psql -h localhost -p 5433 -U lms_user -d lms_db
```

### Backend Issues
```bash
# Check backend logs
cd backend
python -m uvicorn app.main:app --reload --port 8000 --log-level debug
```

### Frontend Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

## 📚 Next Steps

1. **Explore the Admin Dashboard**: Create users and courses
2. **Test Different Roles**: Login as instructor and learner
3. **Check API Documentation**: Visit http://localhost:8000/api/docs
4. **Customize**: Modify the code to fit your needs

## 🆘 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the [Issues](../../issues) page
- Create a new issue with your problem

---

**You're all set! 🎉 Start building your learning platform!**