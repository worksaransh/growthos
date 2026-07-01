from fastapi import APIRouter, Depends
from typing import List, Optional
from ...core.auth import get_current_workspace

router = APIRouter(prefix="/reports/schedule", tags=["scheduled_reports"])

@router.get("/")
async def list_schedules(workspace=Depends(get_current_workspace)):
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM scheduled_reports WHERE workspace_id = $1 ORDER BY created_at DESC", workspace_id)
    return [dict(r) for r in rows]

@router.post("/")
async def create_schedule(
    report_type: str,
    frequency: str,
    recipients: List[str],
    format: str = "pdf",
    workspace=Depends(get_current_workspace)
):
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    cron_map = {"daily": "0 8 * * *", "weekly": "0 8 * * 1", "monthly": "0 8 1 * *"}
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO scheduled_reports (workspace_id, report_type, frequency, cron_expression, recipients, format)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        """, workspace_id, report_type, frequency, cron_map.get(frequency), recipients, format)
    return dict(row)

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str, workspace=Depends(get_current_workspace)):
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM scheduled_reports WHERE id = $1 AND workspace_id = $2", schedule_id, workspace_id)
    return {"message": "Schedule deleted"}
