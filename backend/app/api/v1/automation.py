from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from loguru import logger
from typing import Any
from ...repositories.automation_repo import (
    get_automation_rules,
    get_automation_rule,
    create_automation_rule,
    update_automation_rule,
    delete_automation_rule,
    toggle_automation_rule,
)

router = APIRouter(prefix="/automation", tags=["automation"])


class AutomationRuleCreate(BaseModel):
    name: str
    description: str | None = None
    trigger_type: str
    trigger_config: dict[str, Any]
    action_type: str
    action_config: dict[str, Any]


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    trigger_type: str | None = None
    trigger_config: dict[str, Any] | None = None
    action_type: str | None = None
    action_config: dict[str, Any] | None = None


VALID_TRIGGER_TYPES = {
    "roas_below", "roas_above", "spend_above", "cac_above",
    "revenue_below", "schedule",
}
VALID_ACTION_TYPES = {
    "pause_campaign", "increase_budget", "decrease_budget",
    "send_notification", "send_email",
}


@router.get("/rules")
async def list_rules(request: Request):
    workspace_id = request.state.workspace_id
    rules = await get_automation_rules(workspace_id)
    return {"rules": rules}


@router.post("/rules")
async def create_rule(request: Request, body: AutomationRuleCreate):
    workspace_id = request.state.workspace_id
    if body.trigger_type not in VALID_TRIGGER_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid trigger_type. Choose from {VALID_TRIGGER_TYPES}")
    if body.action_type not in VALID_ACTION_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid action_type. Choose from {VALID_ACTION_TYPES}")

    rule = await create_automation_rule(
        workspace_id=workspace_id,
        name=body.name,
        description=body.description,
        trigger_type=body.trigger_type,
        trigger_config=body.trigger_config,
        action_type=body.action_type,
        action_config=body.action_config,
    )
    logger.info(f"Created automation rule '{body.name}' for workspace {workspace_id}")
    return rule


@router.patch("/rules/{rule_id}")
async def update_rule(request: Request, rule_id: str, body: AutomationRuleUpdate):
    workspace_id = request.state.workspace_id
    rule = await get_automation_rule(workspace_id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    updates = body.model_dump(exclude_none=True)
    if "trigger_type" in updates and updates["trigger_type"] not in VALID_TRIGGER_TYPES:
        raise HTTPException(status_code=400, detail="Invalid trigger_type")
    if "action_type" in updates and updates["action_type"] not in VALID_ACTION_TYPES:
        raise HTTPException(status_code=400, detail="Invalid action_type")

    updated = await update_automation_rule(workspace_id, rule_id, **updates)
    return updated


@router.delete("/rules/{rule_id}")
async def delete_rule(request: Request, rule_id: str):
    workspace_id = request.state.workspace_id
    rule = await get_automation_rule(workspace_id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    await delete_automation_rule(workspace_id, rule_id)
    logger.info(f"Deleted automation rule {rule_id} for workspace {workspace_id}")
    return {"message": "Rule deleted successfully"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(request: Request, rule_id: str):
    workspace_id = request.state.workspace_id
    rule = await get_automation_rule(workspace_id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    updated = await toggle_automation_rule(workspace_id, rule_id)
    return {"id": updated["id"], "is_active": updated["is_active"]}
