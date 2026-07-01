"""
Role-Based Access Control for GrowthOS.
Roles: owner > admin > member > viewer
"""
from fastapi import HTTPException, Request
from enum import Enum
from loguru import logger


class Role(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


ROLE_HIERARCHY = {
    Role.OWNER: 4,
    Role.ADMIN: 3,
    Role.MEMBER: 2,
    Role.VIEWER: 1,
}

# Endpoints that require elevated roles
WRITE_PROTECTED = ["/api/v1/settings", "/api/v1/oauth", "/api/v1/billing"]
ADMIN_ONLY = ["/api/v1/audit", "/api/v1/ai/specialist"]


async def check_role(request: Request, required_role: Role = Role.VIEWER):
    """Check if the authenticated user has the required role."""
    user_role = getattr(request.state, "user_role", Role.MEMBER)
    if ROLE_HIERARCHY.get(user_role, 0) < ROLE_HIERARCHY.get(required_role, 0):
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions. Required: {required_role}, Got: {user_role}"
        )
    return user_role


def require_role(role: Role):
    """Dependency factory for role-based route protection."""
    async def dependency(request: Request):
        return await check_role(request, role)
    return dependency


# Convenience dependencies
require_admin = require_role(Role.ADMIN)
require_owner = require_role(Role.OWNER)
require_member = require_role(Role.MEMBER)
