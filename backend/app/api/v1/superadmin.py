"""
Super Admin API  —  /api/v1/superadmin/*
Only reachable by users who exist in platform_admins table.
Used by the GrowthOS SaaS company to manage all tenants.
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/superadmin", tags=["super-admin"])


# ── Guard ──────────────────────────────────────────────────────────────────────

async def _require_platform_admin(request: Request):
    """Raise 403 if the authenticated user is not a platform admin."""
    db = request.app.state.db
    user_id = request.state.user_id
    row = await db.fetchrow(
        "SELECT role FROM platform_admins WHERE user_id=$1::uuid",
        user_id,
    )
    if not row:
        raise HTTPException(status_code=403, detail="Platform admin access required")
    return row["role"]


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_overview(request: Request):
    """Platform-level stats for the super admin dashboard."""
    await _require_platform_admin(request)
    db = request.app.state.db

    row = await db.fetchrow("""
        SELECT
            (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL)          AS total_orgs,
            (SELECT COUNT(*) FROM workspaces   WHERE deleted_at IS NULL)          AS total_workspaces,
            (SELECT COUNT(DISTINCT user_id) FROM workspace_members)               AS total_users,
            (SELECT COUNT(*) FROM commerce_accounts WHERE deleted_at IS NULL)     AS total_brands,
            (SELECT COUNT(*) FROM channels WHERE status = 'active')               AS active_channels,
            (SELECT COUNT(*) FROM org_subscriptions WHERE status = 'active')      AS active_subscriptions
    """)
    return dict(row)


# ── Organizations ─────────────────────────────────────────────────────────────

@router.get("/organizations")
async def list_all_orgs(request: Request, limit: int = 50, offset: int = 0):
    await _require_platform_admin(request)
    db = request.app.state.db

    rows = await db.fetch("""
        SELECT
            o.id, o.slug, o.display_name, o.status, o.country_code,
            o.created_at,
            bp.name   AS plan_name,
            bp.tier   AS plan_tier,
            bp.max_brands,
            COALESCE(oba.max_brands, bp.max_brands, 1)  AS effective_brand_limit,
            (SELECT COUNT(*) FROM organization_members om WHERE om.org_id = o.id AND om.status = 'active') AS member_count,
            (SELECT COUNT(*) FROM workspaces w WHERE w.org_id = o.id AND w.deleted_at IS NULL)             AS workspace_count,
            (SELECT COUNT(*) FROM commerce_accounts ca
             JOIN business_units bu ON bu.id = ca.bu_id
             JOIN workspaces w ON w.id = bu.workspace_id
             WHERE w.org_id = o.id AND ca.deleted_at IS NULL)                                              AS brand_count
        FROM organizations o
        LEFT JOIN org_subscriptions os  ON os.org_id = o.id AND os.status IN ('active','trialing')
        LEFT JOIN billing_plans bp      ON bp.id = os.plan_id
        LEFT JOIN org_brand_allocations oba ON oba.org_id = o.id
        WHERE o.deleted_at IS NULL
        ORDER BY o.created_at DESC
        LIMIT $1 OFFSET $2
    """, limit, offset)

    return [dict(r) for r in rows]


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_all_users(request: Request, limit: int = 50, offset: int = 0, search: Optional[str] = None):
    await _require_platform_admin(request)
    db = request.app.state.db

    where = "WHERE 1=1"
    args: list = [limit, offset]
    if search:
        where += " AND (u.email ILIKE $3 OR u.raw_user_meta_data->>'full_name' ILIKE $3)"
        args.append(f"%{search}%")

    rows = await db.fetch(f"""
        SELECT
            u.id,
            u.email,
            u.raw_user_meta_data->>'full_name'  AS full_name,
            u.created_at,
            u.last_sign_in_at,
            u.email_confirmed_at IS NOT NULL     AS email_verified,
            EXISTS (SELECT 1 FROM platform_admins pa WHERE pa.user_id = u.id) AS is_platform_admin,
            (SELECT COUNT(*) FROM workspace_members wm WHERE wm.user_id = u.id AND wm.status = 'active') AS workspace_count,
            (SELECT COUNT(*) FROM organization_members om WHERE om.user_id = u.id AND om.status = 'active') AS org_count
        FROM auth.users u
        {where}
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
    """, *args)

    return [dict(r) for r in rows]


# ── Brand allocation ──────────────────────────────────────────────────────────

class BrandAllocationRequest(BaseModel):
    org_id: str
    max_brands: int
    notes: Optional[str] = None


@router.post("/brand-allocation")
async def set_brand_allocation(request: Request, body: BrandAllocationRequest):
    """Set or update the brand limit override for an organisation."""
    admin_role = await _require_platform_admin(request)
    if admin_role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Only super_admin or admin can allocate brands")

    db = request.app.state.db
    user_id = request.state.user_id

    if body.max_brands < -1 or body.max_brands == 0:
        raise HTTPException(status_code=400, detail="max_brands must be -1 (unlimited) or a positive integer")

    await db.execute("""
        INSERT INTO org_brand_allocations (org_id, max_brands, allocated_by, notes)
        VALUES ($1::uuid, $2, $3::uuid, $4)
        ON CONFLICT (org_id) DO UPDATE
            SET max_brands   = EXCLUDED.max_brands,
                allocated_by = EXCLUDED.allocated_by,
                notes        = EXCLUDED.notes,
                updated_at   = now()
    """, body.org_id, body.max_brands, user_id, body.notes)

    return {"ok": True, "org_id": body.org_id, "max_brands": body.max_brands}


@router.get("/brand-allocation/{org_id}")
async def get_brand_allocation(request: Request, org_id: str):
    await _require_platform_admin(request)
    db = request.app.state.db

    limit = await db.fetchval(
        "SELECT get_org_brand_limit($1::uuid)", org_id
    )
    override = await db.fetchrow(
        "SELECT max_brands, notes, allocated_by, updated_at FROM org_brand_allocations WHERE org_id=$1::uuid",
        org_id,
    )
    return {
        "org_id": org_id,
        "effective_limit": limit,
        "override": dict(override) if override else None,
    }


# ── Plan upgrade (super admin grants enterprise plan to an org) ───────────────

class GrantPlanRequest(BaseModel):
    org_id: str
    plan_name: str   # e.g. "Enterprise", "Scale"
    notes: Optional[str] = None


@router.post("/grant-plan")
async def grant_plan(request: Request, body: GrantPlanRequest):
    """Grant or upgrade an org's billing plan. Super admin only."""
    admin_role = await _require_platform_admin(request)
    if admin_role not in ("super_admin",):
        raise HTTPException(status_code=403, detail="Only super_admin can grant plans")

    db = request.app.state.db
    user_id = request.state.user_id

    plan = await db.fetchrow(
        "SELECT id, tier, max_brands FROM billing_plans WHERE LOWER(name)=LOWER($1) AND is_active=TRUE LIMIT 1",
        body.plan_name,
    )
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{body.plan_name}' not found")

    # Upsert subscription
    await db.execute("""
        INSERT INTO org_subscriptions (org_id, plan_id, status, billing_cycle)
        VALUES ($1::uuid, $2::uuid, 'active', 'monthly')
        ON CONFLICT (org_id) DO UPDATE
            SET plan_id = EXCLUDED.plan_id, status = 'active', updated_at = now()
    """, body.org_id, str(plan["id"]))

    # Also set brand allocation
    await db.execute("""
        INSERT INTO org_brand_allocations (org_id, max_brands, allocated_by, notes)
        VALUES ($1::uuid, $2, $3::uuid, $4)
        ON CONFLICT (org_id) DO UPDATE
            SET max_brands = EXCLUDED.max_brands, allocated_by = EXCLUDED.allocated_by,
                notes = EXCLUDED.notes, updated_at = now()
    """, body.org_id, plan["max_brands"], user_id, body.notes or f"Granted {body.plan_name} plan by admin")

    return {"ok": True, "org_id": body.org_id, "plan": body.plan_name, "max_brands": plan["max_brands"]}


# ── Platform admin management ─────────────────────────────────────────────────

class AddAdminRequest(BaseModel):
    user_email: str
    role: str = "admin"
    notes: Optional[str] = None


@router.post("/admins")
async def add_platform_admin(request: Request, body: AddAdminRequest):
    admin_role = await _require_platform_admin(request)
    if admin_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can add platform admins")

    db = request.app.state.db
    granter_id = request.state.user_id

    target = await db.fetchrow(
        "SELECT id FROM auth.users WHERE email = $1 LIMIT 1", body.user_email
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role not in ("super_admin", "admin", "support", "billing"):
        raise HTTPException(status_code=400, detail="Invalid role")

    await db.execute("""
        INSERT INTO platform_admins (user_id, role, granted_by, notes)
        VALUES ($1::uuid, $2, $3::uuid, $4)
        ON CONFLICT (user_id) DO UPDATE SET role=$2, notes=$4, updated_at=now()
    """, str(target["id"]), body.role, granter_id, body.notes)

    return {"ok": True, "user_email": body.user_email, "role": body.role}


@router.get("/admins")
async def list_platform_admins(request: Request):
    await _require_platform_admin(request)
    db = request.app.state.db

    rows = await db.fetch("""
        SELECT pa.id, pa.role, pa.notes, pa.created_at,
               u.email, u.raw_user_meta_data->>'full_name' AS full_name
        FROM platform_admins pa
        JOIN auth.users u ON u.id = pa.user_id
        ORDER BY pa.created_at DESC
    """)
    return [dict(r) for r in rows]
