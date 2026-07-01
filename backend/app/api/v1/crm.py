from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from loguru import logger
from typing import Any
from ...repositories.crm_repo import (
    get_leads,
    get_lead,
    create_lead,
    update_lead,
    delete_lead,
    get_pipeline_summary,
)

router = APIRouter(prefix="/crm", tags=["crm"])


class LeadCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    source: str | None = None
    status: str = "new"
    pipeline_stage: str = "lead"
    deal_value: float = 0
    assigned_to: str | None = None
    notes: str | None = None
    tags: list[str] | None = None


class LeadUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    source: str | None = None
    status: str | None = None
    pipeline_stage: str | None = None
    deal_value: float | None = None
    assigned_to: str | None = None
    notes: str | None = None
    tags: list[str] | None = None


@router.get("/pipeline")
async def pipeline_summary(request: Request):
    workspace_id = request.state.workspace_id
    summary = await get_pipeline_summary(workspace_id)
    return {"pipeline": summary}


@router.get("/leads")
async def list_leads(
    request: Request,
    status: str | None = None,
    pipeline_stage: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    workspace_id = request.state.workspace_id
    rows = await get_leads(
        workspace_id, status=status, pipeline_stage=pipeline_stage,
        limit=limit, offset=offset,
    )
    return {"leads": rows, "count": len(rows)}


@router.post("/leads")
async def create_lead_endpoint(request: Request, body: LeadCreate):
    workspace_id = request.state.workspace_id
    lead = await create_lead(
        workspace_id=workspace_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        company=body.company,
        source=body.source,
        status=body.status,
        pipeline_stage=body.pipeline_stage,
        deal_value=body.deal_value,
        assigned_to=body.assigned_to,
        notes=body.notes,
        tags=body.tags,
    )
    logger.info(f"Created CRM lead '{body.name}' for workspace {workspace_id}")
    return lead


@router.patch("/leads/{lead_id}")
async def update_lead_endpoint(request: Request, lead_id: str, body: LeadUpdate):
    workspace_id = request.state.workspace_id
    lead = await get_lead(workspace_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    updates = body.model_dump(exclude_none=True)
    updated = await update_lead(workspace_id, lead_id, **updates)
    return updated


@router.delete("/leads/{lead_id}")
async def delete_lead_endpoint(request: Request, lead_id: str):
    workspace_id = request.state.workspace_id
    lead = await get_lead(workspace_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    await delete_lead(workspace_id, lead_id)
    logger.info(f"Deleted CRM lead {lead_id} for workspace {workspace_id}")
    return {"message": "Lead deleted successfully"}
