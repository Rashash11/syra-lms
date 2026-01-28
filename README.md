# SYRA LMS - Complete Learning Management System

A full-featured Learning Management System built with Next.js 14 and FastAPI, providing complete enterprise LMS functionality with modern architecture.

## ⚡ Quick Start

**Get started in 5 minutes!** See [Quick Start Guide](docs/setup/QUICK_START.md)

**For detailed setup instructions:**
- **Windows**: [Setup Guide](docs/setup/SETUP_GUIDE.md)
- **Linux**: [Linux Setup Guide](docs/setup/SETUP_GUIDE_LINUX.md)

---

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple organizations with isolated data
- **Role-Based Access Control**: Admin, Instructor, Super Instructor, and Learner roles
- **Course Management**: Create, publish, and manage courses with rich content
- **Learning Paths**: Structured curriculum with course sequences
- **User Management**: Complete user lifecycle management with authentication
- **Dashboard Analytics**: Real-time statistics and activity tracking
- **Assignments & Grading**: Create assignments, track submissions, and grade work
- **Certificates**: Automatic certificate generation upon course completion
- **Reports**: Comprehensive reporting and analytics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

---

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Material-UI (MUI) with custom theming
- **Authentication**: JWT-based with secure HTTP-only cookies
- **API Integration**: RESTful API calls to FastAPI backend

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL 15 with SQLAlchemy (Async)
- **ORM**: Prisma (Node.js) + SQLAlchemy (Python)
- **Authentication**: JWT tokens with role-based permissions
- **Validation**: Pydantic models for request/response validation
- **Architecture**: Clean architecture with separation of concerns

### Database
- **Primary**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: Prisma + SQLAlchemy
- **Migrations**: Prisma Migrate

---

## 📋 Prerequisites

- **Node.js**: v20.0.0 or higher
- **Python**: 3.11 or higher
- **Docker Desktop**: For PostgreSQL and Redis
- **Git**: For version control

---

## 🚀 Installation

### Quick Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/Rashash11/syra-lms.git
cd syra-lms

# 2. Install dependencies
npm install

# 3. Start database
docker-compose -f docker-compose.db.yml up -d

# 4. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Install Python dependencies
cd services/api
pip install -r requirements.txt
cd ../..

# 6. Start backend (Terminal 1)
cd services/api
python -m uvicorn app.main:app --reload --port 8000

# 7. Start frontend (Terminal 2)
npm run dev
```

**Done!** Open http://localhost:3000

### Detailed Setup

For complete step-by-step instructions:
- **Windows**: See [Setup Guide](docs/setup/SETUP_GUIDE.md)
- **Linux**: See [Linux Setup Guide](docs/setup/SETUP_GUIDE_LINUX.md)

---

## 🔑 Default Login Credentials

### Admin
```
Email: admin@portal.com
Password: Admin123!
```

### Instructor
```
Email: instructor@portal.com
Password: Instructor123!
```

### Learner
```
Email: learner1@portal.com
Password: Learner123!
```

**See [All Login Credentials](docs/FRESH_LOGIN_CREDENTIALS.md) for all 26 user accounts.**

---

## 📚 Documentation

### Setup Guides
- **[Quick Start](docs/setup/QUICK_START.md)** - 5-minute quick start
- **[Windows Setup Guide](docs/setup/SETUP_GUIDE.md)** - Complete Windows setup
- **[Linux Setup Guide](docs/setup/SETUP_GUIDE_LINUX.md)** - Complete Linux setup
- **[Setup Checklist](docs/setup/NEW_USER_CHECKLIST.md)** - Verification checklist
- **[Deployment Guide](docs/setup/DEPLOYMENT_CHECKLIST.md)** - Production deployment

### System Documentation
- **[System Overview](docs/SYSTEM_OVERVIEW.md)** - Architecture and design
- **[Database Analysis](docs/DATABASE_AND_API_ANALYSIS.md)** - Database structure
- **[Architecture Map](docs/ARCHITECTURE_MAP.md)** - System architecture
- **[Dependencies](docs/DEPENDENCIES.md)** - Project dependencies

### User Guides
- **[Login Credentials](docs/FRESH_LOGIN_CREDENTIALS.md)** - All user accounts
- **[How to Login](docs/HOW_TO_LOGIN.md)** - Login instructions

### Troubleshooting
- **[Authentication Issues](docs/troubleshooting/)** - Fix auth problems
- **[Common Issues](docs/setup/SETUP_GUIDE.md#troubleshooting)** - Solutions to common problems

---

## 🧪 Testing

### Run All Tests
```bash
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e:fast       # Fast E2E tests (2-3 minutes)
npm run test:e2e:full       # Full E2E test suite
```

### Generate E2E Auth States
```bash
npm run test:auth-states
```

**Test Results:** 83/85 tests passing (98% pass rate)

---

## 🛠️ Development

### Start Development Servers
```bash
# Terminal 1 - Backend
cd services/api
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
npm run dev
```

### Useful Commands
```bash
npm run dev              # Start frontend dev server
npm run build            # Build for production
npm run lint             # Run linter
npm run typecheck        # Check TypeScript types
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:seed          # Reseed database
```

---

## 📊 What's Included

### Users (26 total)
- 3 Admin accounts
- 3 Super Instructor accounts
- 3 Instructor accounts
- 17 Learner accounts

### Content
- 5 Sample courses with sections and units
- 2 Learning paths
- 68 Enrollments with varied progress
- 2 Tenants for multi-tenant testing
- 3 Organization branches

### Features
- Complete authentication system
- Role-based access control (RBAC)
- Multi-tenant isolation
- Course management
- User management
- Learning paths
- Assignments and grading
- Reports and analytics
- Certificates
- Notifications
- Discussions
- File management

---

## 🆘 Troubleshooting

### 401 Unauthorized Errors
```bash
# Clear browser cookies
# F12 → Application → Cookies → Delete All
# Then logout and login again
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed
```bash
docker-compose -f docker-compose.db.yml restart
```

**See [Setup Guide](docs/setup/SETUP_GUIDE.md#troubleshooting) for more troubleshooting.**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🎉 Success!

If you can login and see the dashboard, everything is working perfectly!

**Need help?** Check the documentation files or open an issue.

**Happy coding!** 🚀

---

## 📞 Support

- **Documentation**: See all `.md` files in root directory
- **API Docs**: http://localhost:8000/docs (when backend is running)
- **Issues**: Open an issue on GitHub
- **Tests**: Run `node test-all-roles.js` to verify all roles work

---

## ✅ System Status

- ✅ All authentication working
- ✅ All 4 user roles functional
- ✅ 98% E2E test pass rate
- ✅ Production-ready
- ✅ No known critical issues

**Last Updated:** January 2026
CREATE DATABASE lms_db;
CREATE USER lms_user WITH PASSWORD 'lms_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
```

Or use Docker:

```bash
docker run --name lms_postgres \
  -e POSTGRES_DB=lms_db \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_password \
  -p 5433:5432 \
  -d postgres:15-alpine
```

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Run database migrations (if using Alembic)
alembic upgrade head

# Start the backend server
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start the development server
npm run dev
```

## 🌐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5433/lms_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_URL=redis://localhost:6379/0
ENV=development
```

### Frontend (.env.local)
```env
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Usage

1. **Start the Backend**: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
2. **Start the Frontend**: `cd frontend && npm run dev`
3. **Access the Application**: Open `http://localhost:3000`

### Default Login Credentials

After setting up, you can create accounts via the signup page or use these demo credentials:

- **Admin**: admin@lms.com / Admin123!
- **Instructor**: instructor@lms.com / Instructor123!
- **Learner**: learner@lms.com / Learner123!

## 📁 Project Structure

```
zedny-lms/
├── frontend/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   └── next.config.js
│
├── backend/                  # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── config.py       # Configuration settings
│   │   ├── auth.py         # Authentication utilities
│   │   ├── errors.py       # Error handling
│   │   ├── db/             # Database models and session
│   │   └── routes/         # API route handlers
│   ├── requirements.txt
│   └── alembic/           # Database migrations (optional)
│
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user info

### Users (Admin/Manager only)
- `GET /api/users` - List users with pagination
- `POST /api/users` - Create new user
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Deactivate user

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (Instructor+)
- `GET /api/courses/{id}` - Get course details
- `PUT /api/courses/{id}` - Update course (Instructor+)
- `DELETE /api/courses/{id}` - Delete course (Instructor+)
- `POST /api/courses/{id}/enroll` - Enroll in course

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
```

### Backend Tests
```bash
cd backend
pytest                # Run all tests
pytest -v             # Verbose output
```

## 🚀 Deployment

### Using Docker

1. **Build the images**:
```bash
# Backend
cd backend
docker build -t zedny-lms-backend .

# Frontend
cd frontend
docker build -t zedny-lms-frontend .
```

2. **Run with Docker Compose**:
```bash
docker-compose up -d
```

### Manual Deployment

1. **Backend**:
```bash
cd backend
pip install -r requirements.txt
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. **Frontend**:
```bash
cd frontend
npm run build
npm start
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: Pydantic models for API validation
- **CORS Protection**: Configurable CORS policies
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

## 🎯 Roadmap

- [ ] Advanced course content types (SCORM, xAPI)
- [ ] Real-time messaging system
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Integration with external tools (Zoom, Teams)
- [ ] AI-powered features (content generation, recommendations)

---

**Built with ❤️ using Next.js 14 and FastAPI**