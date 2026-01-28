# 🛠️ Project Dependencies & Setup Guide

This document lists all the necessary tools, libraries, and environments required to run the **Zedny LMS** project.

---

## 🖥️ 1. System Requirements (Prerequisites)

Before installing the project, ensure your machine has the following installed:

| Tool | Version | Purpose | Download Link |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.0.0` or higher | Frontend runtime & build tools | [Download Node.js](https://nodejs.org/) |
| **Python** | `v3.10` or higher | Backend logic & API | [Download Python](https://www.python.org/downloads/) |
| **Docker** | Latest | Database & Cache containerization | [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Git** | Latest | Version control | [Download Git](https://git-scm.com/) |

> **Note:** Windows users should ensure **PowerShell** or **WSL2** is available.

---

## 🏗️ 2. Core Project Libraries

### **Frontend (Next.js)**
*Definitions in `package.json`*

| Package | Role | Key Libraries |
| :--- | :--- | :--- |
| **Framework** | Core App | `next`, `react`, `react-dom` |
| **UI System** | Components | `@mui/material`, `@emotion/react`, `lucide-react` |
| **Data & API** | Fetching | `swr` (implied), `axios` or native `fetch` |
| **Editor** | Rich Text | `@tiptap/react`, `@tiptap/starter-kit` |
| **Database** | ORM Client | `@prisma/client` |
| **Utilities** | Helpers | `zod` (Validation), `date-fns` (implied) |

### **Backend (FastAPI)**
*Definitions in `services/api/requirements.txt`*

| Package | Role | Key Libraries |
| :--- | :--- | :--- |
| **Framework** | API Server | `fastapi`, `uvicorn[standard]` |
| **Database** | ORM & Drivers | `sqlalchemy[asyncio]`, `asyncpg`, `alembic` |
| **Auth** | Security | `python-jose`, `passlib[bcrypt]`, `bcrypt` |
| **Validation** | Data Models | `pydantic`, `pydantic-settings` |
| **Generic** | Utilities | `python-dotenv`, `python-multipart` |
| **Jobs** | Background | `celery`, `redis` |

---

## 🗄️ 3. Infrastructure & Services

The project uses **Docker Compose** to manage data services. No manual installation of Postgres or Redis is vital if you use Docker.

*   **PostgreSQL**: v15 (Alpine image) - Primary Database on port `5433`
*   **Redis**: v7 (Alpine image) - Caching & Message Broker on port `6379`

---

## 📥 4. Installation Steps

### **Step 1: Install Frontend Dependencies**
```bash
# In project root
npm install
```

### **Step 2: Install Backend Dependencies**
```bash
# Navigate to backend folder
cd services/api

# (Optional) Create virtual environment
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### **Step 3: Database Setup**
```bash
# Start Docker Containers
docker-compose -f docker-compose.db.yml up -d

# Generate Prisma Client (Frontend)
npx prisma generate

# Push Schema to DB (No migrations needed for dev)
npx prisma db push
```

---

## 🧰 5. Recommended Development Tools

*   **VS Code** - Primary IDE.
    *   *Recommended Extensions:*
        *   Sorted (ESLint, Prettier)
        *   Python (Microsoft)
        *   Prisma (Prisma)
        *   Docker (Microsoft)
        *   Tailwind CSS (if applicable)
*   **Postman** or **Insomnia** - For testing API endpoints directly.
*   **DBeaver** or **pgAdmin** - For direct database management (connect to `localhost:5433`).

---

## ❓ Troubleshooting Common Dependency Issues

*   **"node-gyp" errors**: Usually related to missing build tools.
    *   *Windows*: `npm install --global --production windows-build-tools`
*   **Python "Module not found"**: Ensure your virtual environment (`.venv`) is activated.
*   **Docker Connection Refused**: Ensure Docker Desktop is actually running.

---
*Created for Zedny LMS - 2026*
