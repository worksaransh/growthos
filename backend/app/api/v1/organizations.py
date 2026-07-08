"""
organizations.py — CRUD for Organizations + Organization Members.

Endpoints:
    POST   /organizations                  create org (auto-joins creator as owner)
    GET    /organizations                  list orgs for current user
    GET    /organizations/{org_id}         get one org
    PATCH  /organizations/{org_id}         update org settings
    POST   /organizations/{org_id}/members invite / add member
    GET    /organizations/{org_id}/members list members
    DELETE /organizations/{org_id}/members/{user_id}  remove member
"""

import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from ...core.auth import get_current_user, get_current_workspace
from ...core.database import execute, fetch, fetchrow, fetchval, DB_AVAILABLE

router = APIRouter(prefix="/organizations", tags=["organizations"])

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]$")


# ── Pydantic models ───────────────────────────────────────────────────────────

class CreateOrgRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=120)
    slug: str = Field(..., min_length=3, max_length=63)
    country_code: str = Field("IN", max_length=2)
    currency: str = Field("INR", max_length=3)
    timezone: str = "Asia/Kolkata"
    industry: Optional[str] = None
    website: Optional[str] = None


class UpdateOrgRequest(BaseModel):
    display_name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = None
    settings: Optional[dict] = None


class AddMemberRequest(BaseModel):
    user_id: str
    role: str = "member"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_db():
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")


async def _require_org_admin(org_id: str, user_id: str):
    role = await fetchval(
        "SELECT role FROM organization_members WHERE org_id=$1 AND user_id=$2 AND status='active'",
        org_id, user_id,
    )
    if role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Organization admin access required")
    return role


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_organization(
    body: CreateOrgRequest,
    user_id: str = Depends(get_current_user),
):
    _require_db()
    slug = body.slug.lower().strip()
    if not _SLUG_RE.match(slug):
        raise HTTPException(status_code=400, detail="Slug must be 3–63 lowercase alphanumeric chars with hyphens")

    existing = await fetchval("SELECT id FROM organizations WHERE slug=$1", slug)
    if existing:
        raise HTTPException(status_code=409, detail=f"Slug '{slug}' is already taken")

    org_id = await fetchval(
        """
        INSERT INTO organizations (slug, display_name, country_code, currency, timezone, industry, website, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id::text
        """,
        slug, body.display_name, body.country_code, body.currency,
        body.timezone, body.industry, body.website, user_id,
    )

    # Auto-join creator as owner
    await execute(
        """
        INSERT INTO organization_members (org_id, user_id, role, status, accepted_at)
        VALUES ($1, $2, 'owner', 'active', now())
        ON CONFLICT (org_id, user_id) DO NOTHING
        """,
        org_id, user_id,
    )

    return {"id": org_id, "slug": slug, "display_name": body.display_name}


@router.get("")
async def list_organizations(user_id: str = Depends(get_current_user)):
    _require_db()
    rows = await fetch(
        """
        SELECT o.id, o.slug, o.display_name, o.logo_url, o.status, o.created_at,
               om.role AS my_role
        FROM organizations o
        JOIN organization_members om ON om.org_id = o.id
        WHERE om.user_id = $1 AND om.status = 'active' AND o.deleted_at IS NULL
        ORDER BY o.created_at ASC
        """,
        user_id,
    )
    return [dict(r) for r in rows]


@router.get("/{org_id}")
async def get_organization(org_id: str, user_id: str = Depends(get_current_user)):
    _require_db()
    row = await fetchrow(
        """
        SELECT o.*, om.role AS my_role
        FROM organizations o
        JOIN organization_members om ON om.org_id = o.id
        WHERE o.id = $1 AND om.user_id = $2 AND o.deleted_at IS NULL
        """,
        org_id, user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Organization not found")
    return dict(row)


@router.patch("/{org_id}")
async def update_organization(
    org_id: str,
    body: UpdateOrgRequest,
    user_id: str = Depends(get_current_user),
):
    _require_db()
    await _require_org_admin(org_id, user_id)

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [org_id] + list(updates.values())
    await execute(
        f"UPDATE organizations SET {set_clauses}, updated_at = now() WHERE id = $1",
        *values,
    )
    return {"message": "Organization updated"}


@router.get("/{org_id}/members")
async def list_org_members(org_id: str, user_id: str = Depends(get_current_user)):
    _require_db()
    # verify membership
    member = await fetchval(
        "SELECT id FROM organization_members WHERE org_id=$1 AND user_id=$2",
        org_id, user_id,
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    rows = await fetch(
        """
        SELECT om.id, om.user_id, om.role, om.status, om.invited_at, om.accepted_at, om.created_at
        FROM organization_members om
        WHERE om.org_id = $1
        ORDER BY om.created_at ASC
        """,
        org_id,
    )
    return [dict(r) for r in rows]


@router.post("/{org_id}/members", status_code=201)
async def add_org_member(
    org_id: str,
    body: AddMemberRequest,
    user_id: str = Depends(get_current_user),
):
    _require_db()
    await _require_org_admin(org_id, user_id)

    valid_roles = ("owner", "admin", "member", "viewer", "billing_admin")
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {valid_roles}")

    await execute(
        """
        INSERT INTO organization_members (org_id, user_id, role, status, invited_by, invited_at)
        VALUES ($1, $2, $3, 'active', $4, now())
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now()
        """,
        org_id, body.user_id, body.role, user_id,
    )
    return {"message": "Member added"}


@router.delete("/{org_id}/members/{target_user_id}")
async def remove_org_member(
    org_id: str,
    target_user_id: str,
    user_id: str = Depends(get_current_user),
):
    _require_db()
    await _require_org_admin(org_id, user_id)

    # Can't remove yourself if you're the last owner
    if target_user_id == user_id:
        owners = await fetchval(
            "SELECT COUNT(*) FROM organization_members WHERE org_id=$1 AND role='owner' AND status='active'",
            org_id,
        )
        if owners <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last owner")

    await execute(
        "DELETE FROM organization_members WHERE org_id=$1 AND user_id=$2",
        org_id, target_user_id,
    )
    return {"message": "Member removed"}
