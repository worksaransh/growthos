"""
auth.py — FastAPI dependency helpers
Reads workspace_id / user_id injected by AuthMiddleware into request.state
"""
from fastapi import Request, HTTPException


async def get_current_workspace(request: Request) -> str:
    """FastAPI dependency: returns workspace_id from JWT-authenticated request."""
    workspace_id = getattr(request.state, "workspace_id", None)
    if not workspace_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return workspace_id


async def get_current_user(request: Request) -> str:
    """FastAPI dependency: returns user_id from JWT-authenticated request."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id
