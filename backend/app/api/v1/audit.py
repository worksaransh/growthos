from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from ...core.auth import get_current_workspace

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/logs")
async def get_audit_logs(
    action: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    workspace=Depends(get_current_workspace)
):
    """Get audit logs for the workspace."""
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    
    conditions = ["workspace_id = $1"]
    params = [workspace_id]
    idx = 2
    
    if action:
        conditions.append(f"action = ${idx}")
        params.append(action)
        idx += 1
    if status:
        conditions.append(f"status = ${idx}")
        params.append(status)
        idx += 1
    
    where = " AND ".join(conditions)
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(f"""
            SELECT id, user_id, action, resource, metadata, ip_address, user_agent, status, created_at
            FROM audit_logs WHERE {where}
            ORDER BY created_at DESC LIMIT ${idx} OFFSET ${idx+1}
        """, *params, limit, offset)
        
        total = await conn.fetchval(f"SELECT COUNT(*) FROM audit_logs WHERE {where}", *params)
    
    return {
        "data": [dict(r) for r in rows],
        "meta": {"total": total, "limit": limit, "offset": offset}
    }

@router.post("/logs")
async def create_audit_log(
    action: str,
    resource: Optional[str] = None,
    metadata: Optional[dict] = None,
    status: str = "success",
    workspace=Depends(get_current_workspace)
):
    """Create an audit log entry."""
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO audit_logs (workspace_id, action, resource, metadata, status)
            VALUES ($1, $2, $3, $4, $5)
        """, workspace_id, action, resource, metadata or {}, status)
    
    return {"message": "Audit log created"}
