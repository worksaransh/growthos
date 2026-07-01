from fastapi import APIRouter, Depends
from ...core.auth import get_current_workspace

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/subscription")
async def get_subscription(workspace=Depends(get_current_workspace)):
    """Get current subscription details."""
    workspace_id = workspace["id"]
    pool = workspace["pool"]
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM billing_subscriptions WHERE workspace_id = $1
        """, workspace_id)
    
    if not row:
        return {
            "plan": "growth",
            "status": "active",
            "amount": 1299900,
            "currency": "INR",
            "billing_period": "monthly",
            "current_period_end": None,
            "usage": {
                "gmv_tracked": 48200000,
                "gmv_limit": 100000000,
                "api_calls": 24847,
                "api_calls_limit": 100000,
                "team_members": 3,
                "team_members_limit": 10,
                "ai_credits_used_pct": 68
            }
        }
    
    return dict(row)

@router.get("/invoices")
async def get_invoices(workspace=Depends(get_current_workspace)):
    """Get invoice history (mock for now)."""
    return [
        {"id": "INV-2026-06", "date": "2026-06-01", "amount": 1299900, "status": "paid", "currency": "INR"},
        {"id": "INV-2026-05", "date": "2026-05-01", "amount": 1299900, "status": "paid", "currency": "INR"},
        {"id": "INV-2026-04", "date": "2026-04-01", "amount": 1299900, "status": "paid", "currency": "INR"},
        {"id": "INV-2026-03", "date": "2026-03-01", "amount": 1299900, "status": "paid", "currency": "INR"},
        {"id": "INV-2026-02", "date": "2026-02-01", "amount": 499900, "status": "paid", "currency": "INR"},
        {"id": "INV-2026-01", "date": "2026-01-01", "amount": 499900, "status": "paid", "currency": "INR"},
    ]

@router.get("/plans")
async def get_plans():
    """Get available plans."""
    return [
        {"id": "starter", "name": "Starter", "amount": 499900, "currency": "INR", "gmv_limit": 10000000, "features": ["Core analytics", "3 integrations", "7-day history", "Email support"]},
        {"id": "growth", "name": "Growth", "amount": 1299900, "currency": "INR", "gmv_limit": 100000000, "features": ["All analytics", "All integrations", "365-day history", "AI modules", "Priority support"], "popular": True},
        {"id": "enterprise", "name": "Enterprise", "amount": 0, "currency": "INR", "gmv_limit": -1, "features": ["Unlimited GMV", "White label", "Custom integrations", "Dedicated CSM", "SLA guarantee"]},
    ]
