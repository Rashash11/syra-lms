"""
Error Handling

Custom exceptions and error handlers for the FastAPI application.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class LMSError(Exception):
    """Base exception for LMS errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthError(LMSError):
    """Authentication error."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class RBACError(LMSError):
    """Role-based access control error."""
    def __init__(self, permission: str = ""):
        message = f"Access denied. Required permission: {permission}" if permission else "Access denied"
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundError(LMSError):
    """Resource not found error."""
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", status.HTTP_404_NOT_FOUND)


class BadRequestError(LMSError):
    """Bad request error."""
    def __init__(self, message: str = "Bad request"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class ConflictError(LMSError):
    """Conflict error."""
    def __init__(self, message: str = "Conflict"):
        super().__init__(message, status.HTTP_409_CONFLICT)


def register_exception_handlers(app: FastAPI):
    """Register custom exception handlers."""

    @app.exception_handler(LMSError)
    async def lms_error_handler(request: Request, exc: LMSError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.__class__.__name__,
                "message": exc.message,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "ValueError",
                "message": str(exc),
                "status_code": status.HTTP_400_BAD_REQUEST,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
        )