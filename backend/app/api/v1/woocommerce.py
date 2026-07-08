"""
WooCommerce Integration — Connect, Sync Orders, Status, Disconnect
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
import httpx, os

from ...core.database import fetchrow, execute, fetch

router = APIRouter(prefix="/woocommerce", tags=["woocommerce"])

WC_API_VERSION = "wc/v3"


class WooConnectRequest(BaseModel):
    site_url: str
    consumer_key: str
    consumer_secret: str


def _wc_auth(consumer_key: str, consumer_secret: str):
    """Return httpx BasicAuth tuple for WooCommerce REST API."""
    return (consumer_key, consumer_secret)


def _build_wc_base(site_url: str) -> str:
    site_url = site_url.rstrip("/")
    return f"{site_url}/wp-json/{WC_API_VERSION}"


# ---------------------------------------------------------------------------
# POST /woocommerce/connect
# ---------------------------------------------------------------------------
@router.post("/connect")
async def woocommerce_connect(request: Request, body: WooConnectRequest):
    """Save WooCommerce credentials to api_credentials table (upsert)."""
    workspace_id = request.state.workspace_id

    # Validate credentials by hitting the WC API before saving
    base_url = _build_wc_base(body.site_url)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{base_url}/system_status",
                auth=_wc_auth(body.consumer_key, body.consumer_secret),
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid WooCommerce consumer key/secret")
            if r.status_code not in (200, 201):
                logger.warning(f"WooCommerce connect pre-check returned {r.status_code} for workspace {workspace_id}")
    except httpx.RequestError as e:
        logger.error(f"WooCommerce connect request error: {e}")
        raise HTTPException(status_code=502, detail=f"Could not reach WooCommerce site: {e}")

    try:
        await execute(
            """
            INSERT INTO api_credentials (workspace_id, woo_site_url, woo_consumer_key, woo_consumer_secret, is_active, updated_at)
            VALUES ($1, $2, $3, $4, TRUE, NOW())
            ON CONFLICT (workspace_id)
            DO UPDATE SET
                woo_site_url = EXCLUDED.woo_site_url,
                woo_consumer_key = EXCLUDED.woo_consumer_key,
                woo_consumer_secret = EXCLUDED.woo_consumer_secret,
                is_active = TRUE,
                updated_at = NOW()
            """,
            workspace_id,
            body.site_url.rstrip("/"),
            body.consumer_key,
            body.consumer_secret,
        )
        logger.info(f"WooCommerce credentials saved for workspace {workspace_id}: site={body.site_url}")
    except Exception as e:
        logger.error(f"Failed to save WooCommerce credentials for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save credentials")

    return {"status": "connected", "site_url": body.site_url}


# ---------------------------------------------------------------------------
# GET /woocommerce/sync
# ---------------------------------------------------------------------------
@router.get("/sync")
async def woocommerce_sync(request: Request):
    """Pull the last 50 orders from WooCommerce and return a summary."""
    workspace_id = request.state.workspace_id

    row = await fetchrow(
        "SELECT woo_site_url, woo_consumer_key, woo_consumer_secret FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )

    if not row or not row.get("woo_site_url"):
        return {"status": "not_configured", "message": "WooCommerce not connected for this workspace"}

    site_url = row["woo_site_url"]
    consumer_key = row.get("woo_consumer_key") or ""
    consumer_secret = row.get("woo_consumer_secret") or ""

    if not (consumer_key and consumer_secret):
        return {"status": "not_configured", "message": "WooCommerce consumer key/secret not set"}

    base_url = _build_wc_base(site_url)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(
                f"{base_url}/orders",
                auth=_wc_auth(consumer_key, consumer_secret),
                params={"per_page": 50, "orderby": "date", "order": "desc"},
            )
            if r.status_code != 200:
                logger.error(f"WooCommerce sync error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="WooCommerce API error")

            orders = r.json()
            total_orders = len(orders)
            total_revenue = sum(float(o.get("total", 0)) for o in orders)
            statuses: dict = {}
            for o in orders:
                s = o.get("status", "unknown")
                statuses[s] = statuses.get(s, 0) + 1

            logger.info(
                f"WooCommerce sync complete for workspace {workspace_id}: "
                f"{total_orders} orders, revenue={total_revenue}"
            )

            return {
                "status": "ok",
                "total_orders_fetched": total_orders,
                "total_revenue": round(total_revenue, 2),
                "order_statuses": statuses,
                "currency": orders[0].get("currency") if orders else None,
                "orders": [
                    {
                        "id": o.get("id"),
                        "number": o.get("number"),
                        "status": o.get("status"),
                        "total": o.get("total"),
                        "currency": o.get("currency"),
                        "date_created": o.get("date_created"),
                        "billing_email": (o.get("billing") or {}).get("email"),
                    }
                    for o in orders
                ],
            }
    except httpx.RequestError as e:
        logger.error(f"WooCommerce sync request error: {e}")
        raise HTTPException(status_code=502, detail=f"WooCommerce API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /woocommerce/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def woocommerce_status(request: Request):
    """Return WooCommerce connection status for the workspace."""
    workspace_id = request.state.workspace_id

    row = await fetchrow(
        "SELECT woo_site_url, woo_consumer_key, woo_consumer_secret, is_active FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )

    connected = bool(
        row
        and row.get("woo_site_url")
        and row.get("woo_consumer_key")
        and row.get("is_active")
    )

    logger.info(f"WooCommerce status check for workspace {workspace_id}: connected={connected}")

    return {
        "connected": connected,
        "site_url": (row or {}).get("woo_site_url"),
        "is_active": (row or {}).get("is_active", False),
    }


# ---------------------------------------------------------------------------
# DELETE /woocommerce/disconnect
# ---------------------------------------------------------------------------
@router.delete("/disconnect")
async def woocommerce_disconnect(request: Request):
    """Mark WooCommerce integration as inactive for the workspace."""
    workspace_id = request.state.workspace_id

    try:
        await execute(
            """
            UPDATE api_credentials
            SET is_active = FALSE, updated_at = NOW()
            WHERE workspace_id = $1
            """,
            workspace_id,
        )
        logger.info(f"WooCommerce disconnected for workspace {workspace_id}")
    except Exception as e:
        logger.error(f"WooCommerce disconnect error for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to disconnect WooCommerce")

    return {"status": "disconnected"}
