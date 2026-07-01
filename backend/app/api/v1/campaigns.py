from fastapi import APIRouter, Request, HTTPException
from loguru import logger
from ...repositories.campaign_repo import get_campaigns, get_campaigns_summary, get_campaign

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/summary")
async def campaigns_summary(
    request: Request,
    start_date: str | None = None,
    end_date: str | None = None,
):
    workspace_id = request.state.workspace_id
    logger.info(f"Getting campaigns summary for workspace {workspace_id}")
    summary = await get_campaigns_summary(workspace_id, start_date=start_date, end_date=end_date)
    return {"summary": summary}


@router.get("")
async def list_campaigns(
    request: Request,
    platform: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
    offset: int = 0,
):
    workspace_id = request.state.workspace_id
    rows = await get_campaigns(
        workspace_id, platform=platform,
        start_date=start_date, end_date=end_date,
        limit=limit, offset=offset,
    )
    return {"campaigns": rows, "count": len(rows)}


@router.get("/{campaign_id}")
async def get_campaign_detail(request: Request, campaign_id: str):
    workspace_id = request.state.workspace_id
    campaign = await get_campaign(workspace_id, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign
