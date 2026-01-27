# Zedny LMS - Complete Learning Management System

A full-featured Learning Management System built with Next.js 14 and FastAPI, providing complete TalentLMS functionality with modern architecture.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple organizations with isolated data
- **Role-Based Access Control**: Admin, Instructor, Super Instructor, and Learner roles
- **Course Management**: Create, publish, and manage courses with rich content
- **User Management**: Complete user lifecycle management with authentication
- **Dashboard Analytics**: Real-time statistics and activity tracking
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: CSS-in-JS with custom components
- **Authentication**: JWT-based with secure cookies
- **API Integration**: RESTful API calls to FastAPI backend

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.10+
- **Database**: PostgreSQL with SQLAlchemy (Async)
- **Authentication**: JWT tokens with role-based permissions
- **Validation**: Pydantic models for request/response validation
- **Architecture**: Clean architecture with separation of concerns

## 📋 Prerequisites

- **Node.js**: 20.0.0 or higher
- **Python**: 3.10 or higher
- **PostgreSQL**: 15 or higher
- **Redis**: 7 or higher (optional, for caching)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd zedny-lms
```

### 2. Setup Database

Start PostgreSQL and create a database:

```sql
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