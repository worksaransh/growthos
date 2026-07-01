import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from loguru import logger
from ...repositories.workspace_repo import get_workspace, update_workspace
from ...models.settings import WorkspaceResponse, WorkspaceUpdate
from ...core.database import fetch, fetchrow, execute

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/workspace")
async def get_workspace_settings(request: Request):
    workspace_id = request.state.workspace_id
    ws = await get_workspace(workspace_id)
    if not ws:
        return {"id": "", "brand_name": "", "timezone": "Asia/Kolkata", "currency": "INR"}
    return WorkspaceResponse(
        id=ws["id"],
        brand_name=ws["brand_name"],
        timezone=ws["timezone"],
        currency=ws["currency"],
    )


@router.patch("/workspace")
async def update_workspace_settings(request: Request, body: WorkspaceUpdate):
    workspace_id = request.state.workspace_id
    kwargs = body.model_dump(exclude_none=True)
    if not kwargs:
        return await get_workspace_settings(request)
    ws = await update_workspace(workspace_id, **kwargs)
    if not ws:
        return {"id": "", "brand_name": "", "timezone": "Asia/Kolkata", "currency": "INR"}
    return WorkspaceResponse(
        id=ws["id"],
        brand_name=ws["brand_name"],
        timezone=ws["timezone"],
        currency=ws["currency"],
    )


@router.get("/team")
async def list_team_members(request: Request):
    workspace_id = request.state.workspace_id
    members = await fetch(
        """
        SELECT id, workspace_id, user_id, email, role, status,
               invited_by, joined_at, created_at, updated_at
        FROM team_members
        WHERE workspace_id = $1
        ORDER BY created_at ASC
        """,
        workspace_id,
    )
    return {"members": members}


class TeamInvite(BaseModel):
    email: str
    role: str = "viewer"


@router.post("/team/invite")
async def invite_team_member(request: Request, body: TeamInvite):
    workspace_id = request.state.workspace_id
    user_id = request.state.user_id if hasattr(request.state, "user_id") else None

    valid_roles = {"owner", "admin", "member", "viewer"}
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from {valid_roles}")

    existing = await fetchrow(
        "SELECT id FROM team_members WHERE workspace_id = $1 AND email = $2",
        workspace_id, body.email,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Member with this email already exists")

    invite_token = secrets.token_urlsafe(32)
    invite_expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    member = await fetchrow(
        """
        INSERT INTO team_members
            (workspace_id, email, role, status, invited_by, invite_token, invite_expires_at)
        VALUES ($1, $2, $3, 'invited', $4, $5, $6)
        RETURNING id, workspace_id, email, role, status, invited_by,
                  invite_token, invite_expires_at, created_at, updated_at
        """,
        workspace_id, body.email, body.role, user_id, invite_token, invite_expires_at,
    )
    logger.info(f"Invited {body.email} as {body.role} to workspace {workspace_id}")
    return member


@router.delete("/team/{member_id}")
async def remove_team_member(request: Request, member_id: str):
    workspace_id = request.state.workspace_id
    member = await fetchrow(
        "SELECT id, role FROM team_members WHERE workspace_id = $1 AND id = $2",
        workspace_id, member_id,
    )
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    if member["role"] == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove workspace owner")

    await execute(
        "DELETE FROM team_members WHERE workspace_id = $1 AND id = $2",
        workspace_id, member_id,
    )
    logger.info(f"Removed team member {member_id} from workspace {workspace_id}")
    return {"message": "Team member removed successfully"}
