"""
tenant.py — Enterprise tenant context resolution.

Resolves the full hierarchy (org → workspace → business_unit → commerce_account)
for every authenticated request. The middleware injects workspace_id and user_id
into request.state; this module builds the full TenantContext on demand.

Usage:
    from app.core.tenant import TenantContext, get_tenant

    @router.get("/something")
    async def handler(tenant: TenantContext = Depends(get_tenant)):
        tenant.workspace_id   # always set (required)
        tenant.org_id         # may be None (pre-enterprise workspaces)
        tenant.bu_id          # None unless ?bu_id= query param passed
        tenant.commerce_account_id  # None unless ?account_id= query param passed
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import Depends, HTTPException, Query, Request

from .auth import get_current_user, get_current_workspace
from .database import fetchrow, fetchval, DB_AVAILABLE


@dataclass
class TenantContext:
    """Fully resolved tenant context for a single request."""
    user_id: str
    workspace_id: str
    org_id: Optional[str] = None
    bu_id: Optional[str] = None
    commerce_account_id: Optional[str] = None
    channel_id: Optional[str] = None
    # Denormalised role — set from workspace_members
    workspace_role: str = "member"

    def require_role(self, *roles: str) -> "TenantContext":
        """Raise 403 if user's workspace role is not in the allowed set."""
        if self.workspace_role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires role: {', '.join(roles)}. Your role: {self.workspace_role}",
            )
        return self

    def require_admin(self) -> "TenantContext":
        return self.require_role("owner", "super_admin", "admin")

    def require_owner(self) -> "TenantContext":
        return self.require_role("owner", "super_admin")


async def get_tenant(
    request: Request,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
    # Optional hierarchy selectors — passed as query params
    bu_id: Optional[str] = Query(None, alias="bu_id"),
    account_id: Optional[str] = Query(None, alias="account_id"),
    channel_id: Optional[str] = Query(None, alias="channel_id"),
) -> TenantContext:
    """
    FastAPI dependency that returns a fully resolved TenantContext.
    Falls back gracefully when DB is unavailable (demo mode).
    """
    ctx = TenantContext(user_id=user_id, workspace_id=workspace_id)

    if not DB_AVAILABLE:
        return ctx

    try:
        # Resolve workspace role + org_id in one query
        row = await fetchrow(
            """
            SELECT wm.role, w.org_id
            FROM workspace_members wm
            JOIN workspaces w ON w.id = wm.workspace_id
            WHERE wm.user_id = $1
              AND wm.workspace_id = $2
            LIMIT 1
            """,
            user_id,
            workspace_id,
        )
        if row:
            ctx.workspace_role = row["role"] or "member"
            ctx.org_id = str(row["org_id"]) if row["org_id"] else None

        # Validate + attach optional selectors
        if bu_id:
            valid = await fetchval(
                """
                SELECT id FROM business_units
                WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
                """,
                bu_id,
                workspace_id,
            )
            if not valid:
                raise HTTPException(status_code=404, detail="Business unit not found or access denied")
            ctx.bu_id = bu_id

        if account_id:
            valid = await fetchval(
                """
                SELECT ca.id FROM commerce_accounts ca
                JOIN business_units bu ON bu.id = ca.bu_id
                WHERE ca.id = $1
                  AND bu.workspace_id = $2
                  AND ca.deleted_at IS NULL
                """,
                account_id,
                workspace_id,
            )
            if not valid:
                raise HTTPException(status_code=404, detail="Commerce account not found or access denied")
            ctx.commerce_account_id = account_id

        if channel_id:
            valid = await fetchval(
                """
                SELECT ch.id FROM channels ch
                JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
                JOIN business_units bu ON bu.id = ca.bu_id
                WHERE ch.id = $1
                  AND bu.workspace_id = $2
                  AND ch.deleted_at IS NULL
                """,
                channel_id,
                workspace_id,
            )
            if not valid:
                raise HTTPException(status_code=404, detail="Channel not found or access denied")
            ctx.channel_id = channel_id

    except HTTPException:
        raise
    except Exception:
        # Non-critical — return partial context rather than fail the request
        pass

    return ctx
