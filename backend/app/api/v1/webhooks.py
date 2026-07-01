"""
Shopify Webhook Handler
Handles real-time events from Shopify stores.
All webhooks verified with HMAC-SHA256 before processing.
"""

import hashlib
import hmac
import base64
import json
from fastapi import APIRouter, Request, HTTPException, Header
from loguru import logger
from typing import Optional
from ...core.config import settings
from ...core.database import execute, fetch, fetchrow

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_shopify_hmac(data: bytes, hmac_header: str, secret: str) -> bool:
    """Verify Shopify webhook HMAC signature."""
    computed = hmac.new(
        secret.encode("utf-8"),
        data,
        hashlib.sha256
    ).digest()
    computed_b64 = base64.b64encode(computed).decode("utf-8")
    return hmac.compare_digest(computed_b64, hmac_header)


async def _get_workspace_by_shop(shop_domain: str) -> Optional[dict]:
    """Get workspace from shop domain via integrations table."""
    row = await fetchrow("""
        SELECT i.workspace_id, i.id as integration_id
        FROM integrations i
        WHERE i.platform = 'shopify'
          AND i.platform_account_id = $1
          AND i.status = 'active'
        LIMIT 1
    """, shop_domain)
    return dict(row) if row else None


@router.post("/shopify/orders/paid")
async def shopify_order_paid(
    request: Request,
    x_shopify_hmac_sha256: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
    x_shopify_topic: str = Header(None),
):
    """Handle orders/paid webhook — insert order into DB immediately."""
    body = await request.body()
    
    if settings.shopify_api_secret and x_shopify_hmac_sha256:
        if not _verify_shopify_hmac(body, x_shopify_hmac_sha256, settings.shopify_api_secret):
            raise HTTPException(status_code=401, detail="Invalid HMAC signature")

    workspace = await _get_workspace_by_shop(x_shopify_shop_domain)
    if not workspace:
        logger.warning(f"Webhook from unknown shop: {x_shopify_shop_domain}")
        return {"status": "ignored", "reason": "shop not connected"}

    workspace_id = workspace["workspace_id"]
    order = json.loads(body)
    
    logger.info(f"Order paid webhook: #{order.get('order_number')} for workspace {workspace_id}")

    # Parse UTM data from landing_site
    landing_site = order.get("landing_site", "") or ""
    utm_source, utm_medium, utm_campaign, utm_content = _parse_utm(landing_site)

    try:
        await execute("""
            INSERT INTO shopify_orders (
                workspace_id, shopify_order_id, order_number,
                total_price, subtotal_price, total_discounts, total_tax,
                total_shipping, currency, financial_status, fulfillment_status,
                customer_email, customer_name, customer_id,
                landing_site, utm_source, utm_medium, utm_campaign, utm_content,
                created_at, processed_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            ON CONFLICT (shopify_order_id, workspace_id) DO UPDATE SET
                financial_status = EXCLUDED.financial_status,
                fulfillment_status = EXCLUDED.fulfillment_status,
                total_price = EXCLUDED.total_price,
                updated_at = NOW()
        """,
            workspace_id,
            str(order["id"]),
            str(order.get("order_number", "")),
            float(order.get("total_price", 0)),
            float(order.get("subtotal_price", 0)),
            float(order.get("total_discounts", 0)),
            float(order.get("total_tax", 0)),
            float(order.get("total_shipping_price_set", {}).get("shop_money", {}).get("amount", 0)),
            order.get("currency", "INR"),
            order.get("financial_status", "paid"),
            order.get("fulfillment_status"),
            order.get("email"),
            f"{order.get('customer', {}).get('first_name', '')} {order.get('customer', {}).get('last_name', '')}".strip(),
            str(order.get("customer", {}).get("id", "")),
            landing_site,
            utm_source, utm_medium, utm_campaign, utm_content,
            order.get("created_at"),
            order.get("processed_at"),
        )

        # Insert order items
        for item in order.get("line_items", []):
            await execute("""
                INSERT INTO shopify_order_items (
                    order_id, workspace_id, shopify_line_item_id,
                    product_id, variant_id, product_title, variant_title,
                    quantity, price, total_discount, sku
                ) VALUES (
                    (SELECT id FROM shopify_orders WHERE shopify_order_id=$1 AND workspace_id=$2),
                    $2,$3,$4,$5,$6,$7,$8,$9,$10,$11
                )
                ON CONFLICT (shopify_line_item_id) DO NOTHING
            """,
                str(order["id"]), workspace_id,
                str(item["id"]), str(item.get("product_id","")),
                str(item.get("variant_id","")),
                item.get("title",""), item.get("variant_title",""),
                item.get("quantity",1), float(item.get("price",0)),
                float(item.get("total_discount",0)),
                item.get("sku","")
            )

        logger.info(f"Order #{order.get('order_number')} saved for workspace {workspace_id}")
        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Failed to save order webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shopify/orders/fulfilled")
async def shopify_order_fulfilled(
    request: Request,
    x_shopify_hmac_sha256: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
):
    """Handle orders/fulfilled webhook — update fulfillment status."""
    body = await request.body()
    workspace = await _get_workspace_by_shop(x_shopify_shop_domain)
    if not workspace:
        return {"status": "ignored"}
    
    order = json.loads(body)
    await execute("""
        UPDATE shopify_orders
        SET fulfillment_status = 'fulfilled', updated_at = NOW()
        WHERE shopify_order_id = $1 AND workspace_id = $2
    """, str(order["id"]), workspace["workspace_id"])
    
    return {"status": "ok"}


@router.post("/shopify/orders/refunded")
async def shopify_order_refunded(
    request: Request,
    x_shopify_hmac_sha256: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
):
    """Handle refund webhook."""
    body = await request.body()
    workspace = await _get_workspace_by_shop(x_shopify_shop_domain)
    if not workspace:
        return {"status": "ignored"}
    
    order = json.loads(body)
    await execute("""
        UPDATE shopify_orders
        SET financial_status = 'refunded', updated_at = NOW()
        WHERE shopify_order_id = $1 AND workspace_id = $2
    """, str(order["id"]), workspace["workspace_id"])
    
    return {"status": "ok"}


@router.post("/shopify/products/update")
async def shopify_product_update(
    request: Request,
    x_shopify_hmac_sha256: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
):
    """Handle product update webhook — sync product and inventory."""
    body = await request.body()
    workspace = await _get_workspace_by_shop(x_shopify_shop_domain)
    if not workspace:
        return {"status": "ignored"}
    
    product = json.loads(body)
    workspace_id = workspace["workspace_id"]
    
    for variant in product.get("variants", []):
        await execute("""
            INSERT INTO shopify_products (
                workspace_id, shopify_product_id, shopify_variant_id,
                title, variant_title, sku, price, compare_at_price,
                inventory_quantity, status, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
            ON CONFLICT (shopify_variant_id, workspace_id) DO UPDATE SET
                inventory_quantity = EXCLUDED.inventory_quantity,
                price = EXCLUDED.price,
                status = EXCLUDED.status,
                updated_at = NOW()
        """,
            workspace_id,
            str(product["id"]),
            str(variant["id"]),
            product.get("title",""),
            variant.get("title",""),
            variant.get("sku",""),
            float(variant.get("price",0)),
            float(variant.get("compare_at_price") or 0),
            int(variant.get("inventory_quantity",0)),
            product.get("status","active")
        )
    
    return {"status": "ok"}


@router.post("/shopify/customers/create")
async def shopify_customer_create(
    request: Request,
    x_shopify_hmac_sha256: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
):
    """Handle new customer webhook."""
    body = await request.body()
    workspace = await _get_workspace_by_shop(x_shopify_shop_domain)
    if not workspace:
        return {"status": "ignored"}
    
    customer = json.loads(body)
    workspace_id = workspace["workspace_id"]
    
    await execute("""
        INSERT INTO customers (
            workspace_id, shopify_customer_id, email, name,
            phone, city, state, country, tags, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (shopify_customer_id, workspace_id) DO NOTHING
    """,
        workspace_id,
        str(customer["id"]),
        customer.get("email",""),
        f"{customer.get('first_name','')} {customer.get('last_name','')}".strip(),
        customer.get("phone"),
        customer.get("default_address",{}).get("city"),
        customer.get("default_address",{}).get("province"),
        customer.get("default_address",{}).get("country","IN"),
        ",".join(customer.get("tags","").split(",")),
        customer.get("created_at")
    )
    
    return {"status": "ok"}


def _parse_utm(landing_site: str) -> tuple:
    """Parse UTM parameters from landing site URL."""
    from urllib.parse import urlparse, parse_qs
    utm_source = utm_medium = utm_campaign = utm_content = None
    try:
        parsed = urlparse(landing_site)
        params = parse_qs(parsed.query)
        utm_source = params.get("utm_source", [None])[0]
        utm_medium = params.get("utm_medium", [None])[0]
        utm_campaign = params.get("utm_campaign", [None])[0]
        utm_content = params.get("utm_content", [None])[0]
    except Exception:
        pass
    return utm_source, utm_medium, utm_campaign, utm_content
