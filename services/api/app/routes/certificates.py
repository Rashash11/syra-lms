from app.auth import RequireAuth
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("")
async def list_certificates(request: Request, context: RequireAuth):
    return {"data": []}
