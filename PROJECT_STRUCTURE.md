# 📁 Project Structure

This document describes the organization of the SYRA LMS project.

## Root Directory

```
syra-lms/
├── 📄 Configuration Files
│   ├── .env                      # Environment variables (not in git)
│   ├── .env.example              # Environment template
│   ├── .eslintrc.json            # ESLint configuration
│   ├── .flake8                   # Python linting configuration
│   ├── .gitignore                # Git ignore rules
│   ├── docker-compose.db.yml     # Database services (PostgreSQL, Redis)
│   ├── docker-compose.yml        # Full stack services
│   ├── Dockerfile                # Docker image definition
│   ├── package.json              # Node.js dependencies
│   ├── playwright.config.ts      # E2E test configuration
│   ├── railway.json              # Railway deployment config
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vitest.config.ts          # Unit test configuration
│   └── README.md                 # Main documentation
│
├── 📂 apps/                      # Application code
│   └── web/                      # Next.js frontend application
│       ├── src/
│       │   ├── app/              # Next.js App Router pages
│       │   ├── lib/              # Utility functions
│       │   ├── modules/          # Feature modules
│       │   ├── server/           # Server-side code
│       │   └── shared/           # Shared components
│       ├── middleware.ts         # Next.js middleware
│       ├── next.config.js        # Next.js configuration
│       └── tsconfig.json         # TypeScript config
│
├── 📂 services/                  # Backend services
│   └── api/                      # FastAPI backend
│       ├── app/
│       │   ├── main.py           # FastAPI entry point
│       │   ├── config.py         # Configuration
│       │   ├── auth/             # Authentication
│       │   ├── db/               # Database models
│       │   ├── routes/           # API endpoints
│       │   ├── rbac/             # Role-based access control
│       │   └── middleware/       # API middleware
│       ├── alembic/              # Database migrations
│       ├── requirements.txt      # Python dependencies
│       └── Dockerfile            # Backend Docker image
│
├── 📂 packages/                  # Shared packages
│   └── db/                       # Database package
│       └── prisma/
│           ├── schema.prisma     # Database schema
│           ├── seed.ts           # Database seeding
│           └── migrations/       # Prisma migrations
│
├── 📂 tests/                     # Test suites
│   ├── e2e/                      # End-to-end tests
│   │   ├── fast/                 # Fast E2E tests (~2 min)
│   │   ├── full/                 # Full E2E tests (~10 min)
│   │   ├── helpers/              # Test helpers
│   │   └── storage/              # Auth states
│   ├── integration/              # Integration tests
│   ├── unit/                     # Unit tests
│   └── helpers/                  # Shared test utilities
│
├── 📂 scripts/                   # Utility scripts
│   ├── debug/                    # Debug scripts
│   │   ├── check-*.ts/js         # Database checks
│   │   ├── diagnose-*.py         # Diagnostic scripts
│   │   ├── fix-*.sql/py          # Fix scripts
│   │   └── gen-token.ts          # Token generation
│   ├── test/                     # Test scripts
│   │   ├── test-*.js             # API test scripts
│   │   └── *.html                # Browser test pages
│   └── verification/             # Verification scripts
│       └── verify-*.js/py        # Verification utilities
│
├── 📂 docs/                      # Documentation
│   ├── setup/                    # Setup guides
│   │   ├── SETUP_GUIDE.md        # Windows setup
│   │   ├── SETUP_GUIDE_LINUX.md  # Linux setup
│   │   ├── QUICK_START.md        # Quick start guide
│   │   ├── NEW_USER_CHECKLIST.md # Setup checklist
│   │   ├── DEPLOYMENT_CHECKLIST.md # Deployment guide
│   │   ├── GITHUB_SETUP_GUIDE.md # GitHub setup
│   │   ├── SERVER_SETUP.md       # Server setup
│   │   ├── STARTUP_GUIDE.md      # Startup guide
│   │   └── RAILWAY_DEPLOY.md     # Railway deployment
│   ├── troubleshooting/          # Troubleshooting guides
│   │   ├── AUTHENTICATION_FIX_SUMMARY.md
│   │   ├── FINAL_AUTHENTICATION_FIX_SUMMARY.md
│   │   ├── FIX_401_ERRORS_ALL_USERS.md
│   │   ├── FORCE_RELOGIN_INSTRUCTIONS.md
│   │   ├── USERS_PAGE_DEBUG_INSTRUCTIONS.md
│   │   ├── USERS_PAGE_ISSUE_SUMMARY.md
│   │   └── QUICK_FIX_USERS_PAGE.md
│   ├── archive/                  # Historical documents
│   │   ├── DATABASE_RESET_COMPLETE.md
│   │   ├── E2E_TEST_RESULTS.md
│   │   ├── FINAL_TEST_REPORT.md
│   │   ├── GIT_COMMIT_SUMMARY.md
│   │   └── TEST_REPORT.md
│   ├── SYSTEM_OVERVIEW.md        # System architecture
│   ├── SYSTEM_ANALYSIS_SUMMARY.md # System analysis
│   ├── DATABASE_AND_API_ANALYSIS.md # Database docs
│   ├── ARCHITECTURE_MAP.md       # Architecture map
│   ├── DEPENDENCIES.md           # Dependencies list
│   ├── api-audit.md              # API audit
│   ├── HOW_TO_LOGIN.md           # Login instructions
│   ├── FRESH_LOGIN_CREDENTIALS.md # All user credentials
│   ├── AUTH_TESTING.md           # Auth testing guide
│   ├── RBAC_TESTING.md           # RBAC testing guide
│   ├── PRODUCTION_CHECKLIST.md   # Production checklist
│   └── runbooks/                 # Operational runbooks
│       └── repo-hygiene.md       # Repository maintenance
│
├── 📂 tools/                     # Development tools
│   ├── scripts/                  # Tool scripts
│   │   ├── audit/                # Audit scripts
│   │   ├── db/                   # Database scripts
│   │   ├── debug/                # Debug tools
│   │   ├── smoke/                # Smoke tests
│   │   └── runners/              # Test runners
│   └── sql/                      # SQL scripts
│       └── *.sql                 # Database utilities
│
├── 📂 artifacts/                 # Generated artifacts
│   ├── api-callgraph.json        # API call graph
│   ├── api-callgraph.md          # API documentation
│   └── full-connection-audit.md  # Connection audit
│
├── 📂 reports/                   # Test reports
│   ├── API_COVERAGE.md           # API coverage report
│   ├── api_smoke.json            # Smoke test results
│   ├── api_smoke.md              # Smoke test report
│   └── AUTOFIX_REPORT.md         # Auto-fix report
│
├── 📂 test-results/              # Playwright test results
│   └── .last-run.json            # Last test run info
│
├── 📂 public/                    # Static assets
│   └── uploads/                  # User uploads
│
├── 📂 infra/                     # Infrastructure code
│   ├── docker-compose.prod.yml   # Production compose
│   ├── docker-compose.yml        # Development compose
│   └── Dockerfile                # Infrastructure Dockerfile
│
└── 📂 .vscode/                   # VS Code settings
    └── settings.json             # Editor configuration
```

## Key Directories

### `/apps/web` - Frontend Application
The Next.js 14 application with App Router. Contains all UI components, pages, and client-side logic.

**Key subdirectories:**
- `src/app/` - Next.js pages and layouts
- `src/modules/` - Feature-specific modules
- `src/shared/` - Shared components and utilities
- `src/lib/` - Utility functions and helpers

### `/services/api` - Backend API
The FastAPI backend service handling all business logic, authentication, and database operations.

**Key subdirectories:**
- `app/routes/` - API endpoint definitions
- `app/db/` - Database models and session management
- `app/auth/` - Authentication and authorization
- `app/rbac/` - Role-based access control
- `app/middleware/` - Request/response middleware

### `/packages/db` - Database Package
Shared database schema and utilities using Prisma ORM.

**Key files:**
- `prisma/schema.prisma` - Database schema definition
- `prisma/seed.ts` - Database seeding script
- `prisma/migrations/` - Database migration history

### `/tests` - Test Suites
Comprehensive test coverage including unit, integration, and E2E tests.

**Test types:**
- `e2e/fast/` - Fast E2E tests (~2 minutes)
- `e2e/full/` - Full E2E test suite (~10 minutes)
- `integration/` - Integration tests
- `unit/` - Unit tests

### `/scripts` - Utility Scripts
Development and debugging scripts organized by purpose.

**Categories:**
- `debug/` - Debugging and diagnostic scripts
- `test/` - Manual testing scripts
- `verification/` - Verification utilities

### `/docs` - Documentation
All project documentation organized by category.

**Categories:**
- `setup/` - Installation and setup guides
- `troubleshooting/` - Problem-solving guides
- `archive/` - Historical documents and reports

## File Naming Conventions

### TypeScript/JavaScript Files
- **Components**: PascalCase (e.g., `UserList.tsx`)
- **Utilities**: camelCase (e.g., `apiClient.ts`)
- **Pages**: kebab-case (e.g., `user-profile.tsx`)
- **Tests**: `*.test.ts` or `*.spec.ts`

### Python Files
- **Modules**: snake_case (e.g., `user_service.py`)
- **Tests**: `test_*.py`
- **Scripts**: snake_case (e.g., `check_db.py`)

### Documentation
- **Guides**: SCREAMING_SNAKE_CASE (e.g., `SETUP_GUIDE.md`)
- **Technical docs**: kebab-case (e.g., `api-documentation.md`)

## Configuration Files

### Root Level
- `.env` - Environment variables (gitignored)
- `.env.example` - Environment template
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `docker-compose.db.yml` - Database services only
- `docker-compose.yml` - Full application stack

### Application Level
- `apps/web/next.config.js` - Next.js configuration
- `services/api/requirements.txt` - Python dependencies
- `packages/db/prisma/schema.prisma` - Database schema

## Scripts and Commands

### Development
```bash
npm run dev              # Start frontend
npm run build            # Build for production
npm run lint             # Run linter
npm run typecheck        # Type checking
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

### Testing
```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e:fast    # Fast E2E tests
npm run test:e2e:full    # Full E2E suite
npm run test:auth-states # Generate auth states
```

## Clean Project Guidelines

### What to Keep in Root
- ✅ Configuration files (`.env.example`, `package.json`, etc.)
- ✅ Docker compose files
- ✅ Main README.md
- ✅ Setup scripts (`install.sh`, `setup.sh`)
- ✅ TypeScript/build configs

### What to Organize
- 📁 Documentation → `/docs`
- 📁 Test scripts → `/scripts/test`
- 📁 Debug scripts → `/scripts/debug`
- 📁 Verification scripts → `/scripts/verification`
- 📁 Test results → `/test-results`
- 📁 Reports → `/reports`

### What to Delete
- ❌ Temporary files (`*.tmp`, `*.log`)
- ❌ Error dumps (`error.txt`, `error_trace.txt`)
- ❌ Duplicate files
- ❌ Obsolete documentation
- ❌ Old test results

## Maintenance

### Regular Cleanup
1. Remove old test results from `/test-results`
2. Archive old reports to `/docs/archive`
3. Clean up temporary debug scripts
4. Update documentation as features change

### Before Committing
1. Run linter: `npm run lint`
2. Run type check: `npm run typecheck`
3. Run tests: `npm run test:unit`
4. Check for sensitive data in `.env` files
5. Update documentation if needed

## Getting Help

- **Setup Issues**: See `/docs/setup/`
- **Troubleshooting**: See `/docs/troubleshooting/`
- **System Architecture**: See `/docs/SYSTEM_OVERVIEW.md`
- **Database Schema**: See `/docs/DATABASE_AND_API_ANALYSIS.md`
- **API Documentation**: http://localhost:8000/docs (when running)

---

**Last Updated:** January 2026
