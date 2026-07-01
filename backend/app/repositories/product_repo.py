from ..core.database import fetch, fetchrow, execute


async def get_products(
    workspace_id: str,
    sort_by: str = "total_revenue",
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    valid_sorts = {"total_revenue", "total_sold", "refund_rate", "title"}
    sort_col = sort_by if sort_by in valid_sorts else "total_revenue"
    return await fetch(
        f"""
        SELECT id, workspace_id, shopify_product_id, title, vendor, product_type,
               status, tags, total_sold, total_revenue, total_refunds, refund_rate,
               created_at, updated_at
        FROM shopify_products
        WHERE workspace_id = $1
        ORDER BY {sort_col} DESC
        LIMIT $2 OFFSET $3
        """,
        workspace_id, limit, offset,
    )


async def get_product(workspace_id: str, product_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, shopify_product_id, title, vendor, product_type,
               status, tags, total_sold, total_revenue, total_refunds, refund_rate,
               created_at, updated_at
        FROM shopify_products
        WHERE workspace_id = $1 AND id = $2
        """,
        workspace_id, product_id,
    )


async def get_product_sales_history(workspace_id: str, product_id: str) -> list[dict]:
    product = await fetchrow(
        "SELECT shopify_product_id FROM shopify_products WHERE workspace_id = $1 AND id = $2",
        workspace_id, product_id,
    )
    if not product:
        return []
    return await fetch(
        """
        SELECT DATE(o.order_created_at) AS sale_date,
               COUNT(*) AS order_count,
               SUM(oi.quantity) AS units_sold,
               SUM(oi.total_price) AS revenue
        FROM shopify_order_items oi
        JOIN shopify_orders o ON o.id = oi.order_id
        WHERE oi.workspace_id = $1 AND oi.shopify_product_id = $2
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 90
        """,
        workspace_id, product["shopify_product_id"],
    )


async def update_product_cost(workspace_id: str, product_id: str, cost_per_item: float) -> None:
    await execute(
        """
        UPDATE shopify_order_items
        SET cost_per_item = $3
        WHERE workspace_id = $1 AND shopify_product_id = (
            SELECT shopify_product_id FROM shopify_products WHERE workspace_id = $1 AND id = $2
        )
        """,
        workspace_id, product_id, cost_per_item,
    )


async def upsert_product(
    workspace_id: str,
    shopify_product_id: str,
    title: str,
    vendor: str | None,
    product_type: str | None,
    status: str,
    tags: list[str] | None,
) -> dict | None:
    return await fetchrow(
        """
        INSERT INTO shopify_products
            (workspace_id, shopify_product_id, title, vendor, product_type, status, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (workspace_id, shopify_product_id)
        DO UPDATE SET
            title = EXCLUDED.title,
            vendor = EXCLUDED.vendor,
            product_type = EXCLUDED.product_type,
            status = EXCLUDED.status,
            tags = EXCLUDED.tags,
            updated_at = now()
        RETURNING id
        """,
        workspace_id, shopify_product_id, title, vendor, product_type, status, tags,
    )
