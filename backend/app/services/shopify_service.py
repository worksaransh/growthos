import httpx
from loguru import logger
from datetime import datetime, timedelta, timezone
from typing import Optional
from ..core.database import execute, fetchrow


async def sync_shopify_orders(
    access_token: str,
    store_url: str,
    workspace_id: str,
    last_synced_at: Optional[datetime] = None,
    initial_days: int = 90,
) -> dict:
    base_url = f"https://{store_url}/admin/api/2024-01"
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json",
    }

    sync_window = last_synced_at or (datetime.now(timezone.utc) - timedelta(days=initial_days))
    created_at_min = sync_window.isoformat()

    records_fetched = 0
    records_inserted = 0
    records_updated = 0

    async with httpx.AsyncClient() as client:
        url = f"{base_url}/orders.json"
        params = {
            "status": "any",
            "created_at_min": created_at_min,
            "limit": 250,
        }

        while url:
            try:
                resp = await client.get(url, headers=headers, params=params if "?" not in url else None)
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Shopify API error: {e.response.status_code} - {e.response.text}")
                raise

            orders = data.get("orders", [])
            records_fetched += len(orders)

            for order in orders:
                shopify_id = str(order["id"])
                gross_revenue = float(order.get("total_price", 0))
                discount_amount = sum(
                    float(d["amount"]) for d in order.get("discount_applications", [])
                )
                refund_amount = sum(
                    float(t["amount"])
                    for t in order.get("transactions", [])
                    if t.get("kind") == "refund"
                )
                net_revenue = gross_revenue - discount_amount - refund_amount
                financial_status = order.get("financial_status", "pending")

                customer = order.get("customer") or {}
                customer_name = (
                    f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
                    or "Guest"
                )
                customer_email = customer.get("email")

                row = await fetchrow(
                    """
                    INSERT INTO shopify_orders
                        (workspace_id, shopify_order_id, shopify_order_number,
                         order_status, financial_status, fulfillment_status,
                         gross_revenue, discount_amount, refund_amount, net_revenue,
                         customer_id, customer_name, customer_email,
                         tags, order_created_at, order_updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    ON CONFLICT (workspace_id, shopify_order_id)
                    DO UPDATE SET
                        order_status = EXCLUDED.order_status,
                        financial_status = EXCLUDED.financial_status,
                        net_revenue = EXCLUDED.net_revenue,
                        refund_amount = EXCLUDED.refund_amount,
                        customer_name = EXCLUDED.customer_name,
                        customer_email = EXCLUDED.customer_email,
                        order_updated_at = EXCLUDED.order_updated_at,
                        updated_at = now()
                    RETURNING
                        CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END AS action
                    """,
                    workspace_id,
                    shopify_id,
                    str(order.get("order_number", "")),
                    order.get("financial_status", "pending"),
                    financial_status,
                    order.get("fulfillment_status"),
                    gross_revenue,
                    discount_amount,
                    refund_amount,
                    net_revenue,
                    str(customer.get("id", "")) if customer.get("id") else None,
                    customer_name,
                    customer_email,
                    [t for t in order.get("tags", "").split(",") if t],
                    order.get("created_at"),
                    order.get("updated_at"),
                )

                if row:
                    if row["action"] == "inserted":
                        records_inserted += 1
                    else:
                        records_updated += 1

            # Pagination via Link header
            link_header = resp.headers.get("Link", "")
            url = None
            if 'rel="next"' in link_header:
                for part in link_header.split(","):
                    if 'rel="next"' in part:
                        url = part.split(";")[0].strip().strip("<>")
                        params = None
                        break
            else:
                url = None

    logger.info(
        f"Shopify sync complete for {store_url}: "
        f"{records_fetched} fetched, {records_inserted} inserted, {records_updated} updated"
    )

    return {
        "records_fetched": records_fetched,
        "records_inserted": records_inserted,
        "records_updated": records_updated,
    }
