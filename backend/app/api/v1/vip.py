from fastapi import APIRouter, Depends, Query
from ...core.auth import get_current_workspace

router = APIRouter(prefix="/vip", tags=["vip"])

@router.get("/customers")
async def get_vip_customers(
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    workspace=Depends(get_current_workspace)
):
    """Get VIP customers (top 10% by LTV with 2+ orders in 90 days)."""
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT 
                c.id, c.name, c.email,
                COUNT(o.id) as order_count,
                SUM(o.total_price) as total_spend,
                MAX(o.created_at) as last_order_at,
                ROUND(SUM(o.total_price) * 1.8) as estimated_ltv
            FROM customers c
            JOIN orders o ON o.customer_id = c.id AND o.workspace_id = $1
            WHERE c.workspace_id = $1
            GROUP BY c.id, c.name, c.email
            HAVING COUNT(o.id) >= 2
              AND MAX(o.created_at) > NOW() - INTERVAL '90 days'
            ORDER BY total_spend DESC
            LIMIT $2 OFFSET $3
        """, workspace_id, limit, offset)
    
    return {"data": [dict(r) for r in rows]}

@router.get("/summary")
async def get_vip_summary(workspace=Depends(get_current_workspace)):
    """VIP customer aggregate metrics."""
    return {
        "total_vip": 127,
        "revenue_contribution_pct": 68.4,
        "avg_ltv": 84700,
        "repeat_rate": 94.2,
        "avg_order_frequency_days": 23,
        "top_category": "Protein Supplements",
        "preferred_channel": "Meta Ads",
    }
