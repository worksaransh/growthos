from ..core.database import fetch, fetchrow, execute


async def get_profit_config(workspace_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, cogs_pct, shipping_cost_per_order, packaging_cost_per_order,
               payment_gateway_pct, return_processing_cost, tax_pct, additional_opex_monthly,
               created_at, updated_at
        FROM profit_config
        WHERE workspace_id = $1
        """,
        workspace_id,
    )


async def upsert_profit_config(
    workspace_id: str,
    cogs_pct: float,
    shipping_cost_per_order: float,
    packaging_cost_per_order: float,
    payment_gateway_pct: float,
    return_processing_cost: float,
    tax_pct: float,
    additional_opex_monthly: float,
) -> dict | None:
    return await fetchrow(
        """
        INSERT INTO profit_config
            (workspace_id, cogs_pct, shipping_cost_per_order, packaging_cost_per_order,
             payment_gateway_pct, return_processing_cost, tax_pct, additional_opex_monthly)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (workspace_id)
        DO UPDATE SET
            cogs_pct = EXCLUDED.cogs_pct,
            shipping_cost_per_order = EXCLUDED.shipping_cost_per_order,
            packaging_cost_per_order = EXCLUDED.packaging_cost_per_order,
            payment_gateway_pct = EXCLUDED.payment_gateway_pct,
            return_processing_cost = EXCLUDED.return_processing_cost,
            tax_pct = EXCLUDED.tax_pct,
            additional_opex_monthly = EXCLUDED.additional_opex_monthly,
            updated_at = now()
        RETURNING id, workspace_id, cogs_pct, shipping_cost_per_order, packaging_cost_per_order,
                  payment_gateway_pct, return_processing_cost, tax_pct, additional_opex_monthly,
                  created_at, updated_at
        """,
        workspace_id, cogs_pct, shipping_cost_per_order, packaging_cost_per_order,
        payment_gateway_pct, return_processing_cost, tax_pct, additional_opex_monthly,
    )


async def get_profit_by_product(workspace_id: str, start_date: str, end_date: str) -> list[dict]:
    return await fetch(
        """
        SELECT oi.shopify_product_id, sp.title AS product_name,
               SUM(oi.quantity) AS units_sold,
               SUM(oi.total_price) AS gross_revenue,
               SUM(oi.cost_per_item * oi.quantity) AS total_cogs,
               SUM(oi.total_price) - SUM(oi.cost_per_item * oi.quantity) AS gross_profit
        FROM shopify_order_items oi
        LEFT JOIN shopify_products sp
            ON sp.workspace_id = oi.workspace_id
           AND sp.shopify_product_id = oi.shopify_product_id
        JOIN shopify_orders o ON o.id = oi.order_id
        WHERE oi.workspace_id = $1
          AND DATE(o.order_created_at) BETWEEN $2 AND $3
        GROUP BY oi.shopify_product_id, sp.title
        ORDER BY gross_profit DESC
        LIMIT 50
        """,
        workspace_id, start_date, end_date,
    )


async def get_profit_by_channel(workspace_id: str, start_date: str, end_date: str) -> list[dict]:
    return await fetch(
        """
        SELECT COALESCE(source_channel, 'unknown') AS channel,
               COUNT(*) AS orders,
               SUM(net_revenue) AS revenue,
               SUM(shipping_cost) AS shipping_cost
        FROM shopify_orders
        WHERE workspace_id = $1
          AND DATE(order_created_at) BETWEEN $2 AND $3
        GROUP BY 1
        ORDER BY revenue DESC
        """,
        workspace_id, start_date, end_date,
    )
