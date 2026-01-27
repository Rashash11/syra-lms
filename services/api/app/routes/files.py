import mimetypes
from pathlib import Path
from typing import Annotated

from app.auth import RequireAuth
from app.db.session import get_db
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


def resolve_repo_root() -> Path:
    p = Path(__file__).resolve().parent
    for _ in range(8):
        if (p / "public").exists() or (p / "apps" / "web" / "public").exists():
            return p
        p = p.parent
    return Path(__file__).resolve().parents[5]


ROOT_DIR = resolve_repo_root()
PRIMARY_UPLOADS_DIR = ROOT_DIR / "public" / "uploads"
SECONDARY_UPLOADS_DIR = ROOT_DIR / "apps" / "web" / "public" / "uploads"
TERTIARY_UPLOADS_DIR = ROOT_DIR / "services" / "api" / "public" / "uploads"


def find_file_path(file_id: str) -> Path | None:
    candidates = [
        PRIMARY_UPLOADS_DIR / file_id,
        SECONDARY_UPLOADS_DIR / file_id,
        TERTIARY_UPLOADS_DIR / file_id,
    ]
    for c in candidates:
        if c.exists() and c.is_file():
            return c
    return None


@router.get("/{file_id}")
async def get_file(
    file_id: str,
    request: Request,
    response: Response,
):
    file_path = find_file_path(file_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    mime, _ = mimetypes.guess_type(str(file_path))
    if not mime:
        mime = "application/octet-stream"

    # Read the file into memory (small files) or stream; for dev simplicity
    # we stream from disk
    data = file_path.read_bytes()

    # Range support
    range_header = request.headers.get("range")
    headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600, must-revalidate",
    }
    if range_header and range_header.startswith("bytes="):
        try:
            start_end = range_header.replace("bytes=", "").split("-")
            start = int(start_end[0]) if start_end[0] else 0
            end = (
                int(start_end[1])
                if (len(start_end) > 1 and start_end[1])
                else len(data) - 1
            )
            if start > end or start < 0 or end >= len(data):
                raise ValueError()
        except Exception:
            # Malformed range; serve whole file
            return StreamingResponse(iter([data]), media_type=mime, headers=headers)
        chunk = data[start : end + 1]
        headers["Content-Range"] = f"bytes {start}-{end}/{len(data)}"
        return StreamingResponse(
            iter([chunk]), status_code=206, media_type=mime, headers=headers
        )

    return StreamingResponse(iter([data]), media_type=mime, headers=headers)


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    fp = find_file_path(file_id)
    if not fp:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        fp.unlink(missing_ok=True)
    except Exception:
        pass
    return {"success": True}
