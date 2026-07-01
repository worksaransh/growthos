from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from loguru import logger
from typing import Any
from ...repositories.notification_repo import (
    get_notifications,
    create_notification,
    mark_read,
    mark_all_read,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    type: str
    category: str
    title: str
    message: str
    action_url: str | None = None
    metadata: dict[str, Any] | None = None


@router.get("")
async def list_notifications(
    request: Request,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
):
    workspace_id = request.state.workspace_id
    rows = await get_notifications(workspace_id, unread_only=unread_only, limit=limit, offset=offset)
    return {"notifications": rows, "count": len(rows)}


@router.post("/read-all")
async def read_all_notifications(request: Request):
    workspace_id = request.state.workspace_id
    await mark_all_read(workspace_id)
    logger.info(f"Marked all notifications read for workspace {workspace_id}")
    return {"message": "All notifications marked as read"}


@router.post("/{notification_id}/read")
async def read_notification(request: Request, notification_id: str):
    workspace_id = request.state.workspace_id
    await mark_read(workspace_id, notification_id)
    return {"message": "Notification marked as read"}


@router.post("")
async def create_notification_endpoint(request: Request, body: NotificationCreate):
    workspace_id = request.state.workspace_id
    if body.type not in ("alert", "info", "success", "warning"):
        raise HTTPException(status_code=400, detail="Invalid notification type")
    if body.category not in ("ads", "revenue", "orders", "sync", "system"):
        raise HTTPException(status_code=400, detail="Invalid notification category")

    row = await create_notification(
        workspace_id=workspace_id,
        type=body.type,
        category=body.category,
        title=body.title,
        message=body.message,
        action_url=body.action_url,
        metadata=body.metadata,
    )
    logger.info(f"Created notification for workspace {workspace_id}: {body.title}")
    return row
