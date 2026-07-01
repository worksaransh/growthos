from fastapi import APIRouter, Depends, Query
from ...core.auth import get_current_workspace

router = APIRouter(prefix="/attribution", tags=["attribution"])

@router.get("/summary")
async def get_attribution_summary(
    model: str = Query(default="last_touch", regex="^(first_touch|last_touch|linear|data_driven)$"),
    start_date: str = "2026-06-01",
    end_date: str = "2026-06-30",
    workspace=Depends(get_current_workspace)
):
    """Get attribution summary by channel."""
    return {
        "model": model,
        "total_attributed_revenue": 48200000,
        "channels": [
            {"channel": "Meta Ads", "revenue": 23136000, "pct": 48.0, "conversions": 512, "cpa": 45187},
            {"channel": "Google Ads", "revenue": 14460000, "pct": 30.0, "conversions": 321, "cpa": 45046},
            {"channel": "Organic", "revenue": 5784000, "pct": 12.0, "conversions": 128, "cpa": 0},
            {"channel": "Direct", "revenue": 2892000, "pct": 6.0, "conversions": 64, "cpa": 0},
            {"channel": "Email", "revenue": 1446000, "pct": 3.0, "conversions": 32, "cpa": 0},
            {"channel": "WhatsApp", "revenue": 482000, "pct": 1.0, "conversions": 11, "cpa": 0},
        ]
    }

@router.get("/paths")
async def get_conversion_paths(workspace=Depends(get_current_workspace)):
    """Get top conversion paths."""
    return [
        {"path": ["Meta Ad", "Product Page", "Purchase"], "customers": 342, "aov": 420000, "cvr": 3.2},
        {"path": ["Google Search", "Product Page", "Purchase"], "customers": 198, "aov": 380000, "cvr": 4.1},
        {"path": ["Meta Ad", "Retargeting", "Purchase"], "customers": 156, "aov": 520000, "cvr": 6.8},
        {"path": ["Organic", "Product Page", "Purchase"], "customers": 128, "aov": 290000, "cvr": 2.1},
        {"path": ["Email", "Product Page", "Purchase"], "customers": 87, "aov": 450000, "cvr": 8.4},
    ]
