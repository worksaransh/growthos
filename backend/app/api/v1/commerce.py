"""
commerce.py — CRUD for Business Units + Commerce Accounts.

Hierarchy: Workspace → Business Units → Commerce Accounts → Channels

Endpoints:
    Business Units:
        POST   /commerce/business-units              create BU under workspace
        GET    /commerce/business-units              list BUs in workspace
        GET    /commerce/business-units/{bu_id}      get BU
        PATCH  /commerce/business-units/{bu_id}      update BU
        DELETE /commerce/business-units/{bu_id}      soft-delete BU

    Commerce Accounts:
        POST   /commerce/accounts                    create account under BU
        GET    /commerce/accounts                    list accounts (filter ?bu_id=)
        GET    /commerce/accounts/{account_id}       get account
        PATCH  /commerce/accounts/{account_id}       update account
        DELETE /commerce/accounts/{account_id}       soft-delete account
"""

import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ...core.auth import get_current_user, get_current_workspace
from ...core.database import execute, fetch, fetchrow, fetchval, DB_AVAILABLE

router = APIRouter(prefix="/commerce", tags=["commerce"])

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{0,61}[a-z0-9]$|^[a-z0-9]$")


def _require_db():
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")


async def _require_workspace_admin(workspace_id: str, user_id: str):
    role = await fetchval(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id,
    )
    if role not in ("owner", "super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Workspace admin access required")
    return role


# ─── Business Unit Models ─────────────────────────────────────────────────────

class CreateBURequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    slug: str = Field(..., min_length=1, max_length=63)
    description: Optional[str] = None
    country_code: str = "IN"
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    is_default: bool = False


class UpdateBURequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    country_code: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    settings: Optional[dict] = None


# ─── Commerce Account Models ──────────────────────────────────────────────────

class CreateAccountRequest(BaseModel):
    bu_id: str
    name: str = Field(..., min_length=1, max_length=120)
    slug: str = Field(..., min_length=1, max_length=63)
    description: Optional[str] = None
    country_code: str = "IN"
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    is_default: bool = False


class UpdateAccountRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    country_code: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    settings: Optional[dict] = None


# ─── Business Unit Routes ─────────────────────────────────────────────────────

@router.post("/business-units", status_code=201)
async def create_business_unit(
    body: CreateBURequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)

    slug = body.slug.lower().strip()
    if not _SLUG_RE.match(slug):
        raise HTTPException(status_code=400, detail="Invalid slug format")

    existing = await fetchval(
        "SELECT id FROM business_units WHERE workspace_id=$1 AND slug=$2 AND deleted_at IS NULL",
        workspace_id, slug,
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"BU slug '{slug}' already exists in this workspace")

    # If is_default, unset others first
    if body.is_default:
        await execute(
            "UPDATE business_units SET is_default=FALSE WHERE workspace_id=$1", workspace_id
        )

    bu_id = await fetchval(
        """
        INSERT INTO business_units
            (workspace_id, name, slug, description, country_code, currency, timezone, is_default, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id::text
        """,
        workspace_id, body.name, slug, body.description,
        body.country_code, body.currency, body.timezone, body.is_default, user_id,
    )
    return {"id": bu_id, "slug": slug, "name": body.name}


@router.get("/business-units")
async def list_business_units(
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    rows = await fetch(
        """
        SELECT bu.*, COUNT(ca.id)::int AS account_count
        FROM business_units bu
        LEFT JOIN commerce_accounts ca ON ca.bu_id = bu.id AND ca.deleted_at IS NULL
        WHERE bu.workspace_id = $1 AND bu.deleted_at IS NULL
        GROUP BY bu.id
        ORDER BY bu.is_default DESC, bu.created_at ASC
        """,
        workspace_id,
    )
    return [dict(r) for r in rows]


@router.get("/business-units/{bu_id}")
async def get_business_unit(
    bu_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    row = await fetchrow(
        "SELECT * FROM business_units WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL",
        bu_id, workspace_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Business unit not found")
    return dict(row)


@router.patch("/business-units/{bu_id}")
async def update_business_unit(
    bu_id: str,
    body: UpdateBURequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)

    row = await fetchrow(
        "SELECT id FROM business_units WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL",
        bu_id, workspace_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Business unit not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        return {"message": "Nothing to update"}

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [bu_id] + list(updates.values())
    await execute(
        f"UPDATE business_units SET {set_clauses}, updated_at=now() WHERE id=$1", *values
    )
    return {"message": "Business unit updated"}


@router.delete("/business-units/{bu_id}")
async def delete_business_unit(
    bu_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)

    # Can't soft-delete default BU
    row = await fetchrow(
        "SELECT is_default FROM business_units WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL",
        bu_id, workspace_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Business unit not found")
    if row["is_default"]:
        raise HTTPException(status_code=400, detail="Cannot delete the default business unit")

    await execute(
        "UPDATE business_units SET deleted_at=now() WHERE id=$1", bu_id
    )
    return {"message": "Business unit deleted"}


# ─── Commerce Account Routes ──────────────────────────────────────────────────

@router.post("/accounts", status_code=201)
async def create_commerce_account(
    body: CreateAccountRequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)

    # Verify BU belongs to this workspace
    bu = await fetchrow(
        "SELECT id FROM business_units WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL",
        body.bu_id, workspace_id,
    )
    if not bu:
        raise HTTPException(status_code=404, detail="Business unit not found")

    slug = body.slug.lower().strip()
    existing = await fetchval(
        "SELECT id FROM commerce_accounts WHERE bu_id=$1 AND slug=$2 AND deleted_at IS NULL",
        body.bu_id, slug,
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"Account slug '{slug}' already exists in this BU")

    # ── Brand limit check ─────────────────────────────────────────────────────
    # Count existing active commerce accounts in this workspace across all BUs
    org_id = await fetchval(
        "SELECT org_id::text FROM workspaces WHERE id=$1::uuid", workspace_id
    )
    if org_id:
        brand_limit = await fetchval(
            "SELECT get_org_brand_limit($1::uuid)", org_id
        )
        if brand_limit is not None and brand_limit != -1:
            current_count = await fetchval(
                """
                SELECT COUNT(*) FROM commerce_accounts ca
                JOIN business_units bu ON bu.id = ca.bu_id
                JOIN workspaces w ON w.id = bu.workspace_id
                WHERE w.org_id = $1::uuid AND ca.deleted_at IS NULL
                """,
                org_id,
            )
            if (current_count or 0) >= brand_limit:
                raise HTTPException(
                    status_code=402,
                    detail=f"Brand limit reached ({brand_limit}). Upgrade your plan to add more brands.",
                )

    if body.is_default:
        await execute(
            "UPDATE commerce_accounts SET is_default=FALSE WHERE bu_id=$1", body.bu_id
        )

    account_id = await fetchval(
        """
        INSERT INTO commerce_accounts
            (bu_id, name, slug, description, country_code, currency, timezone, is_default, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id::text
        """,
        body.bu_id, body.name, slug, body.description,
        body.country_code, body.currency, body.timezone, body.is_default, user_id,
    )
    return {"id": account_id, "slug": slug, "name": body.name}


@router.get("/accounts")
async def list_commerce_accounts(
    bu_id: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    if bu_id:
        rows = await fetch(
            """
            SELECT ca.*, COUNT(ch.id)::int AS channel_count
            FROM commerce_accounts ca
            LEFT JOIN channels ch ON ch.commerce_account_id = ca.id AND ch.deleted_at IS NULL
            WHERE ca.bu_id = $1 AND ca.deleted_at IS NULL
            GROUP BY ca.id
            ORDER BY ca.is_default DESC, ca.created_at ASC
            """,
            bu_id,
        )
    else:
        # All accounts across all BUs in this workspace
        rows = await fetch(
            """
            SELECT ca.*, bu.name AS bu_name, COUNT(ch.id)::int AS channel_count
            FROM commerce_accounts ca
            JOIN business_units bu ON bu.id = ca.bu_id
            LEFT JOIN channels ch ON ch.commerce_account_id = ca.id AND ch.deleted_at IS NULL
            WHERE bu.workspace_id = $1 AND ca.deleted_at IS NULL AND bu.deleted_at IS NULL
            GROUP BY ca.id, bu.name
            ORDER BY ca.created_at ASC
            """,
            workspace_id,
        )
    return [dict(r) for r in rows]


@router.get("/accounts/{account_id}")
async def get_commerce_account(
    account_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    row = await fetchrow(
        """
        SELECT ca.*, bu.name AS bu_name, bu.id AS bu_id
        FROM commerce_accounts ca
        JOIN business_units bu ON bu.id = ca.bu_id
        WHERE ca.id = $1 AND bu.workspace_id = $2 AND ca.deleted_at IS NULL
        """,
        account_id, workspace_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Commerce account not found")
    return dict(row)


@router.patch("/accounts/{account_id}")
async def update_commerce_account(
    account_id: str,
    body: UpdateAccountRequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)

    row = await fetchrow(
        """
        SELECT ca.id FROM commerce_accounts ca
        JOIN business_units bu ON bu.id = ca.bu_id
        WHERE ca.id = $1 AND bu.workspace_id = $2 AND ca.deleted_at IS NULL
        """,
        account_id, workspace_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Commerce account not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        return {"message": "Nothing to update"}

    cols = list(updates.keys())
    vals = list(updates.values())
    set_sql = ", ".join(f"{c} = ${i+2}" for i, c in enumerate(cols))
    await execute(
        f"UPDATE commerce_accounts SET {set_sql}, updated_at=now() WHERE id=$1",
        account_id, *vals,
    )
    return {"message": "Commerce account updated"}


@router.delete("/accounts/{account_id}")
async def delete_commerce_account(
    account_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)
    row = await fetchrow(
        "SELECT id, is_default FROM commerce_accounts WHERE id=$1 AND deleted_at IS NULL",
        account_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Commerce account not found")
    if row["is_default"]:
        raise HTTPException(status_code=400, detail="Cannot delete the default commerce account")
    await execute("UPDATE commerce_accounts SET deleted_at=now() WHERE id=$1", account_id)
    return {"message": "Commerce account deleted"}
