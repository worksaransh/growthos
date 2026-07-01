"""
CRM & Automation Tools
Read and write GrowthOS CRM leads, automation rules, and notifications.
"""

import os
import json
import httpx
from typing import Optional
from mcp.app import mcp  # shared FastMCP singleton  # noqa: F401

BACKEND = os.getenv("BACKEND_URL", "http://localhost:8000")


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ── CRM Leads ───────────────────────────────────────────────────────────────

@mcp.tool(annotations={"readOnlyHint": True})
async def crm_list_leads(
    token: str,
    status: Optional[str] = None,
    pipeline_stage: Optional[str] = None,
    limit: int = 50,
) -> str:
    """
    List CRM leads / opportunities in GrowthOS.

    Args:
        token: Supabase JWT access token.
        status: Filter by status — 'new', 'contacted', 'qualified', 'won', 'lost'.
        pipeline_stage: Filter by pipeline stage — 'lead', 'proposal', 'negotiation', 'won', 'lost'.
        limit: Max results.

    Returns:
        JSON array of CRM lead objects with name, email, company, deal_value, notes.
    """
    params: dict = {"limit": limit}
    if status:
        params["status"] = status
    if pipeline_stage:
        params["pipeline_stage"] = pipeline_stage

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BACKEND}/api/v1/crm/leads", params=params, headers=_auth(token))
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def crm_create_lead(
    token: str,
    name: str,
    email: str,
    company: Optional[str] = None,
    phone: Optional[str] = None,
    source: str = "manual",
    deal_value: Optional[int] = None,
    notes: Optional[str] = None,
) -> str:
    """
    Create a new CRM lead in GrowthOS.

    Args:
        token: Supabase JWT access token.
        name: Lead's full name.
        email: Lead's email address.
        company: Company name.
        phone: Phone number.
        source: Lead source — 'ads', 'referral', 'website', 'organic', 'manual'.
        deal_value: Estimated deal value in INR.
        notes: Free-text notes.

    Returns:
        JSON of the created lead object.
    """
    payload = {
        "name": name,
        "email": email,
        "company": company,
        "phone": phone,
        "source": source,
        "deal_value": deal_value,
        "notes": notes,
        "status": "new",
        "pipeline_stage": "lead",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(f"{BACKEND}/api/v1/crm/leads", json=payload, headers=_auth(token))
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def crm_update_lead_status(
    token: str,
    lead_id: str,
    status: str,
    pipeline_stage: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """
    Update a CRM lead's status or pipeline stage.

    Args:
        token: Supabase JWT access token.
        lead_id: UUID of the lead.
        status: New status — 'new', 'contacted', 'qualified', 'won', 'lost'.
        pipeline_stage: New pipeline stage — 'lead', 'proposal', 'negotiation', 'won', 'lost'.
        notes: Additional notes to append.

    Returns:
        JSON of the updated lead.
    """
    payload: dict = {"status": status}
    if pipeline_stage:
        payload["pipeline_stage"] = pipeline_stage
    if notes:
        payload["notes"] = notes

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.patch(
            f"{BACKEND}/api/v1/crm/leads/{lead_id}",
            json=payload,
            headers=_auth(token),
        )
    return r.text


# ── Automation Rules ────────────────────────────────────────────────────────

@mcp.tool(annotations={"readOnlyHint": True})
async def automation_list_rules(token: str) -> str:
    """
    List all automation rules configured in GrowthOS.

    Args:
        token: Supabase JWT access token.

    Returns:
        JSON array of automation rule objects with trigger, action, active status,
        trigger_count (how many times the rule has fired).
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BACKEND}/api/v1/automation/rules", headers=_auth(token))
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def automation_toggle_rule(
    token: str,
    rule_id: str,
    is_active: bool,
) -> str:
    """
    Enable or disable an automation rule.

    Args:
        token: Supabase JWT access token.
        rule_id: UUID of the automation rule.
        is_active: True to enable, False to disable.

    Returns:
        JSON of the updated rule.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.patch(
            f"{BACKEND}/api/v1/automation/rules/{rule_id}",
            json={"is_active": is_active},
            headers=_auth(token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def automation_create_rule(
    token: str,
    name: str,
    description: str,
    trigger_type: str,
    trigger_threshold: float,
    trigger_platform: str,
    action_type: str,
    action_message: str,
) -> str:
    """
    Create a new automation rule in GrowthOS.

    Args:
        token: Supabase JWT access token.
        name: Rule name (e.g., "Pause Low ROAS").
        description: Human-readable description.
        trigger_type: 'roas_below', 'roas_above', 'spend_above', 'cac_above', 'revenue_below'.
        trigger_threshold: Numeric threshold (e.g., 2.0 for ROAS below 2x).
        trigger_platform: 'meta', 'google', 'all'.
        action_type: 'send_notification', 'pause_campaigns', 'scale_budget'.
        action_message: Message to send or action details.

    Returns:
        JSON of the created rule.
    """
    payload = {
        "name": name,
        "description": description,
        "is_active": True,
        "trigger_type": trigger_type,
        "trigger_config": {"threshold": trigger_threshold, "platform": trigger_platform},
        "action_type": action_type,
        "action_config": {"message": action_message},
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{BACKEND}/api/v1/automation/rules",
            json=payload,
            headers=_auth(token),
        )
    return r.text


# ── Notifications ────────────────────────────────────────────────────────────

@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def notifications_mark_read(
    token: str,
    notification_id: Optional[str] = None,
    mark_all: bool = False,
) -> str:
    """
    Mark one or all notifications as read.

    Args:
        token: Supabase JWT access token.
        notification_id: UUID of a specific notification to mark read.
        mark_all: If True, marks all unread notifications as read.

    Returns:
        JSON confirmation.
    """
    if mark_all:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{BACKEND}/api/v1/notifications/mark-all-read",
                headers=_auth(token),
            )
        return r.text

    if not notification_id:
        return json.dumps({"error": "Provide notification_id or set mark_all=True"})

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.patch(
            f"{BACKEND}/api/v1/notifications/{notification_id}",
            json={"is_read": True},
            headers=_auth(token),
        )
    return r.text
