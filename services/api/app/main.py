"""
FastAPI Application Entry Point

Main application setup with routers, middleware, and exception handlers.
"""

import os
from contextlib import asynccontextmanager
from typing import Any

from app.config import get_settings
from app.db.session import close_db, engine, init_db
from app.errors import register_exception_handlers
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    # Trigger reload
    await init_db()
    print("DEBUG: Listing all registered routes:")
    from fastapi.routing import APIRoute

    for route in app.routes:
        if isinstance(route, APIRoute):
            print(f"DEBUG_ROUTE: {route.path} {route.methods}")
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title="LMS API",
    description="Learning Management System API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable automatic docs in production
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url="/api/redoc" if not settings.is_production else None,
    openapi_url="/api/openapi.json" if not settings.is_production else None,
)

# Mount static files (for large media)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Register exception handlers for JSON-only responses
register_exception_handlers(app)

# ============= Middleware Stack =============
# Order matters: outermost middleware runs first
# Request flow: CORS -> RateLimit -> CSRF -> Tenant -> Route Handler
# Response flow: Route Handler -> Tenant -> CSRF -> RateLimit -> CORS

from app.middleware.csrf import CSRFMiddleware  # noqa: E402
from app.middleware.tenant import TenantMiddleware  # noqa: E402

# Tenant middleware (extracts tenant/user context from JWT)
app.add_middleware(TenantMiddleware)

# CSRF protection (validates double-submit cookie)
app.add_middleware(CSRFMiddleware)

# CORS middleware (must be outermost for preflight requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"] if not settings.is_production else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Range",
        "Accept-Ranges",
        "Content-Length",
        "X-Correlation-ID",
    ],
)


@app.middleware("http")
async def diagnostic_logging_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/submissions"):
        print(f"DIAGNOSTIC: Request {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        if request.url.path.startswith("/api/submissions"):
            print(f"DIAGNOSTIC: Response status {response.status_code}")
        return response
    except Exception as e:
        print(f"DIAGNOSTIC: Exception in middleware: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e


# Health check endpoint
@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "env": settings.env,
    }


# API health check (matches /api/* pattern)
@app.get("/api/health")
async def api_health_check() -> dict[str, Any]:
    """API health check endpoint with DB/RBAC checks."""
    checks: list[dict[str, Any]] = []
    db_ok = True
    rbac_ok = True
    try:
        from sqlalchemy import text

        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            # Check RBAC tables exist
            r = await conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_name IN ('auth_role','auth_permission','auth_role_permission')
            """))
            count = r.scalar() or 0
            rbac_ok = count >= 3
    except Exception as e:
        print(f"❌ API Health Check Error: {e}")
        db_ok = False
    checks.append({"name": "db:connection", "status": "ok" if db_ok else "error"})
    checks.append({"name": "rbac:tables", "status": "ok" if rbac_ok else "error"})
    return {
        "ok": True,
        "status": "healthy" if db_ok else "degraded",
        "checks": checks,
    }


# Import and include routers
from app.routes import automations  # noqa: E402
from app.routes import (  # noqa: E402
    admin,
    admin_options,
    assignments,
    auth,
    branches,
    calendar_events,
    catalog,
    categories,
    certificates,
    conferences,
    courses,
    courses_editor,
    dashboard,
    enrollments,
    files,
    groups,
    instructor,
    learner,
    learning_paths,
    learning_paths_ext,
    me,
    notifications,
    reports,
    skills,
    submissions,
    super_instructor,
    uploads,
    users,
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(me.router, prefix="/api", tags=["me"])
# Course editor routes MUST come before generic courses router for proper route matching
app.include_router(
    courses_editor.router, prefix="/api/courses", tags=["courses-editor"]
)
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(enrollments.router, prefix="/api/enrollments", tags=["enrollments"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(branches.router, prefix="/api/branches", tags=["branches"])
app.include_router(
    certificates.router, prefix="/api/certificates", tags=["certificates"]
)
app.include_router(
    learning_paths.router, prefix="/api/learning-paths", tags=["learning-paths"]
)
app.include_router(
    learning_paths_ext.router, prefix="/api/learning-paths", tags=["learning-paths-ext"]
)
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(
    notifications.router, prefix="/api/notifications", tags=["notifications"]
)
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_options.router, prefix="/api/admin", tags=["admin-options"])
app.include_router(instructor.router, prefix="/api/instructor", tags=["instructor"])
app.include_router(learner.router, prefix="/api/learner", tags=["learner"])
app.include_router(skills.router, prefix="/api/skills", tags=["skills"])
app.include_router(
    super_instructor.router, prefix="/api/super-instructor", tags=["super-instructor"]
)
app.include_router(conferences.router, prefix="/api/conferences", tags=["conferences"])
app.include_router(
    calendar_events.router, prefix="/api/calendar-events", tags=["calendar-events"]
)
app.include_router(automations.router, prefix="/api/automations", tags=["automations"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(uploads.router, prefix="/api/upload", tags=["uploads"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["submissions"])


# Catch-all for unknown /api/* routes - returns JSON 404
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def api_not_found(path: str, request: Request) -> JSONResponse:
    """Return JSON 404 for unknown API routes."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "NOT_FOUND",
            "message": f"API endpoint not found: /{path}",
        },
    )
