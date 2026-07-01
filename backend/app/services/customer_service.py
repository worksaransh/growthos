from loguru import logger
from datetime import datetime, timedelta, timezone
from ..core.database import fetch
from ..repositories.customer_repo import upsert_customer


def _compute_segment(total_orders: int, total_spent: float, last_order_at: datetime | None) -> str:
    now = datetime.now(timezone.utc)
    days_since_last = None
    if last_order_at:
        if last_order_at.tzinfo is None:
            last_order_at = last_order_at.replace(tzinfo=timezone.utc)
        days_since_last = (now - last_order_at).days

    if total_orders >= 5 and total_spent >= 10000:
        return "vip"
    if total_orders >= 3:
        if days_since_last is not None and days_since_last >= 60 and total_orders > 1:
            return "at_risk"
        return "loyal"
    if total_orders == 1:
        if days_since_last is not None and days_since_last >= 90:
            return "dormant"
        return "one_time"
    if days_since_last is not None and days_since_last >= 90 and total_orders > 1:
        return "dormant"
    if days_since_last is not None and days_since_last >= 60 and total_orders > 1:
        return "at_risk"
    return "one_time"


async def compute_customer_segments(workspace_id: str) -> dict:
    logger.info(f"Computing customer segments for workspace {workspace_id}")

    rows = await fetch(
        """
        SELECT
            customer_id,
            customer_name,
            customer_email,
            COUNT(*) AS total_orders,
            SUM(net_revenue) AS total_spent,
            MIN(order_created_at) AS first_order_at,
            MAX(order_created_at) AS last_order_at,
            CASE WHEN COUNT(*) = 0 THEN NULL
                 ELSE SUM(net_revenue) / COUNT(*) END AS avg_order_value
        FROM shopify_orders
        WHERE workspace_id = $1
          AND customer_id IS NOT NULL
          AND customer_id != ''
          AND financial_status IN ('paid', 'partially_paid', 'pending')
        GROUP BY customer_id, customer_name, customer_email
        """,
        workspace_id,
    )

    upserted = 0
    for row in rows:
        total_orders = int(row["total_orders"] or 0)
        total_spent = float(row["total_spent"] or 0)
        last_order_at = row["last_order_at"]
        segment = _compute_segment(total_orders, total_spent, last_order_at)

        await upsert_customer(
            workspace_id=workspace_id,
            shopify_customer_id=row["customer_id"],
            email=row.get("customer_email"),
            name=row.get("customer_name"),
            phone=None,
            city=None,
            state=None,
            country=None,
            total_orders=total_orders,
            total_spent=total_spent,
            avg_order_value=float(row["avg_order_value"]) if row["avg_order_value"] else None,
            first_order_at=row["first_order_at"].isoformat() if row["first_order_at"] else None,
            last_order_at=last_order_at.isoformat() if last_order_at else None,
            ltv=total_spent,
            segment=segment,
            tags=None,
        )
        upserted += 1

    logger.info(f"Customer segment computation complete: {upserted} customers updated")
    return {"customers_processed": upserted}
