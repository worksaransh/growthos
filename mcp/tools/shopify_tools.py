"""
Shopify Tools
Connects to the Shopify Admin REST API (2024-01).
"""

import os
import json
import httpx
from typing import Optional
from mcp.app import mcp  # shared FastMCP singleton  # noqa: F401


def _shopify_headers(access_token: str) -> dict:
    return {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json",
    }


def _shopify_url(shop_domain: str, path: str) -> str:
    """Build Shopify Admin API URL. shop_domain can be 'mystore' or 'mystore.myshopify.com'."""
    if not shop_domain.endswith(".myshopify.com"):
        shop_domain = f"{shop_domain}.myshopify.com"
    return f"https://{shop_domain}/admin/api/2024-01/{path}"


# ── Orders ──────────────────────────────────────────────────────────────────

@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_get_orders(
    shop_domain: str,
    access_token: str,
    status: str = "any",
    limit: int = 50,
    since_id: Optional[str] = None,
    created_at_min: Optional[str] = None,
    created_at_max: Optional[str] = None,
    financial_status: Optional[str] = None,
    fulfillment_status: Optional[str] = None,
) -> str:
    """
    Fetch Shopify orders with filtering options.

    Args:
        shop_domain: Shopify store domain (e.g., 'mystore' or 'mystore.myshopify.com').
        access_token: Shopify Admin API access token.
        status: 'open', 'closed', 'cancelled', or 'any' (default).
        limit: Max orders to return (max 250).
        since_id: Return only orders after this ID (pagination).
        created_at_min: ISO 8601 datetime — filter orders created after this time.
        created_at_max: ISO 8601 datetime — filter orders created before this time.
        financial_status: 'paid', 'pending', 'refunded', 'partially_refunded', etc.
        fulfillment_status: 'shipped', 'unshipped', 'partial', 'fulfilled'.

    Returns:
        JSON array of order objects with line items, customer, pricing, shipping.
    """
    params: dict = {"status": status, "limit": min(limit, 250)}
    if since_id:
        params["since_id"] = since_id
    if created_at_min:
        params["created_at_min"] = created_at_min
    if created_at_max:
        params["created_at_max"] = created_at_max
    if financial_status:
        params["financial_status"] = financial_status
    if fulfillment_status:
        params["fulfillment_status"] = fulfillment_status

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            _shopify_url(shop_domain, "orders.json"),
            params=params,
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_get_order(
    shop_domain: str,
    access_token: str,
    order_id: str,
) -> str:
    """
    Get a single Shopify order by ID.

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.
        order_id: Shopify order ID (numeric).

    Returns:
        JSON of full order object.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            _shopify_url(shop_domain, f"orders/{order_id}.json"),
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_get_products(
    shop_domain: str,
    access_token: str,
    limit: int = 50,
    vendor: Optional[str] = None,
    product_type: Optional[str] = None,
    status: str = "active",
) -> str:
    """
    List Shopify products.

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.
        limit: Max products (max 250).
        vendor: Filter by vendor name.
        product_type: Filter by product type.
        status: 'active', 'archived', 'draft', or 'any'.

    Returns:
        JSON array of product objects with variants, pricing, inventory.
    """
    params: dict = {"limit": min(limit, 250), "status": status}
    if vendor:
        params["vendor"] = vendor
    if product_type:
        params["product_type"] = product_type

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            _shopify_url(shop_domain, "products.json"),
            params=params,
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_get_customers(
    shop_domain: str,
    access_token: str,
    limit: int = 50,
    query: Optional[str] = None,
    created_at_min: Optional[str] = None,
) -> str:
    """
    List Shopify customers with order history.

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.
        limit: Max customers (max 250).
        query: Search query (searches name, email, phone).
        created_at_min: Filter customers created after this ISO 8601 datetime.

    Returns:
        JSON array of customer objects with orders_count, total_spent, email, tags.
    """
    params: dict = {"limit": min(limit, 250)}
    if query:
        params["query"] = query
    if created_at_min:
        params["created_at_min"] = created_at_min

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            _shopify_url(shop_domain, "customers.json"),
            params=params,
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_get_inventory_levels(
    shop_domain: str,
    access_token: str,
    location_id: Optional[str] = None,
    limit: int = 50,
) -> str:
    """
    Get inventory levels for products across locations.

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.
        location_id: Filter to specific location ID, or None for all locations.
        limit: Max records.

    Returns:
        JSON array of inventory level objects with inventory_item_id, available, location_id.
    """
    params: dict = {"limit": min(limit, 250)}
    if location_id:
        params["location_ids"] = location_id

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            _shopify_url(shop_domain, "inventory_levels.json"),
            params=params,
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_get_analytics(
    shop_domain: str,
    access_token: str,
) -> str:
    """
    Get Shopify store analytics summary (reports overview).

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.

    Returns:
        JSON with available analytics reports.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            _shopify_url(shop_domain, "reports.json"),
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def shopify_count_orders(
    shop_domain: str,
    access_token: str,
    status: str = "any",
    financial_status: Optional[str] = None,
    created_at_min: Optional[str] = None,
    created_at_max: Optional[str] = None,
) -> str:
    """
    Count Shopify orders matching given filters (fast, no pagination needed).

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.
        status: Order status filter.
        financial_status: Financial status filter.
        created_at_min: Start of date range (ISO 8601).
        created_at_max: End of date range (ISO 8601).

    Returns:
        JSON with {"count": N}.
    """
    params: dict = {"status": status}
    if financial_status:
        params["financial_status"] = financial_status
    if created_at_min:
        params["created_at_min"] = created_at_min
    if created_at_max:
        params["created_at_max"] = created_at_max

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            _shopify_url(shop_domain, "orders/count.json"),
            params=params,
            headers=_shopify_headers(access_token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def shopify_create_discount(
    shop_domain: str,
    access_token: str,
    title: str,
    value_type: str,
    value: float,
    customer_selection: str = "all",
    usage_limit: Optional[int] = None,
    starts_at: Optional[str] = None,
    ends_at: Optional[str] = None,
) -> str:
    """
    Create a Shopify price rule (discount).

    Args:
        shop_domain: Shopify store domain.
        access_token: Shopify Admin API access token.
        title: Internal name for the price rule.
        value_type: 'percentage' or 'fixed_amount'.
        value: Discount value (e.g., -10 for 10% off or -100 for ₹100 off — must be negative).
        customer_selection: 'all' or 'prerequisite'.
        usage_limit: Max total uses across all customers.
        starts_at: ISO 8601 datetime when rule becomes active.
        ends_at: ISO 8601 datetime when rule expires.

    Returns:
        JSON of the created price rule object.
    """
    payload: dict = {
        "price_rule": {
            "title": title,
            "value_type": value_type,
            "value": str(value if value < 0 else -value),
            "customer_selection": customer_selection,
            "target_type": "line_item",
            "target_selection": "all",
            "allocation_method": "across",
        }
    }
    if usage_limit:
        payload["price_rule"]["usage_limit"] = usage_limit
    if starts_at:
        payload["price_rule"]["starts_at"] = starts_at
    if ends_at:
        payload["price_rule"]["ends_at"] = ends_at

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            _shopify_url(shop_domain, "price_rules.json"),
            json=payload,
            headers=_shopify_headers(access_token),
        )
    return r.text
