import uuid
from pathlib import Path
from typing import Annotated

from app.auth import RequireAuth
from app.db.session import get_db
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


def resolve_repo_root() -> Path:
    p = Path(__file__).resolve().parent
    for _ in range(10):
        if (p / "apps" / "web").exists() and (p / "services" / "api").exists():
            return p
        p = p.parent
    # Fallback: 5 levels up from routes/ -> repo root
    return Path(__file__).resolve().parents[5]


ROOT_DIR = resolve_repo_root()
PRIMARY_UPLOADS_DIR = ROOT_DIR / "public" / "uploads"
SECONDARY_UPLOADS_DIR = ROOT_DIR / "apps" / "web" / "public" / "uploads"
PRIMARY_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SECONDARY_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    context: RequireAuth = None,  # type: ignore
    db: Annotated[AsyncSession, Depends(get_db)] = None,  # type: ignore
) -> dict:
    # Generate a stable unique name to avoid collisions
    suffix = Path(str(file.filename)).suffix or ""
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    target_primary = PRIMARY_UPLOADS_DIR / unique_name
    target_secondary = SECONDARY_UPLOADS_DIR / unique_name

    # Persist file to disk for frontend to serve at /files/<unique_name>
    contents = await file.read()
    # Write to primary
    try:
        with open(target_primary, "wb") as f:
            f.write(contents)
    except Exception:
        pass
    # Also write to secondary for compatibility
    try:
        with open(target_secondary, "wb") as f:
            f.write(contents)
    except Exception:
        pass

    return {
        "file": {
            "url": f"/files/{unique_name}",
            "name": unique_name,
            "size": len(contents),
        }
    }
