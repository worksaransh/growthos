from ..core.database import fetch, fetchrow, execute, fetchval


async def get_customers(
    workspace_id: str,
    segment: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    if segment:
        return await fetch(
            """
            SELECT id, workspace_id, shopify_customer_id, email, name, phone,
                   city, state, country, total_orders, total_spent,
                   avg_order_value, first_order_at, last_order_at, ltv, segment, tags,
                   created_at, updated_at
            FROM customers
            WHERE workspace_id = $1 AND segment = $2
            ORDER BY total_spent DESC
            LIMIT $3 OFFSET $4
            """,
            workspace_id, segment, limit, offset,
        )
    return await fetch(
        """
        SELECT id, workspace_id, shopify_customer_id, email, name, phone,
               city, state, country, total_orders, total_spent,
               avg_order_value, first_order_at, last_order_at, ltv, segment, tags,
               created_at, updated_at
        FROM customers
        WHERE workspace_id = $1
        ORDER BY total_spent DESC
        LIMIT $2 OFFSET $3
        """,
        workspace_id, limit, offset,
    )


async def get_customer(workspace_id: str, customer_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, shopify_customer_id, email, name, phone,
               city, state, country, total_orders, total_spent,
               avg_order_value, first_order_at, last_order_at, ltv, segment, tags,
               created_at, updated_at
        FROM customers
        WHERE workspace_id = $1 AND id = $2
        """,
        workspace_id, customer_id,
    )


async def get_customer_segments(workspace_id: str) -> list[dict]:
    return await fetch(
        """
        SELECT segment, COUNT(*) AS count,
               COALESCE(SUM(total_spent), 0) AS total_revenue
        FROM customers
        WHERE workspace_id = $1
        GROUP BY segment
        ORDER BY segment
        """,
        workspace_id,
    )


async def get_customer_ltv_distribution(workspace_id: str) -> list[dict]:
    return await fetch(
        """
        SELECT
            CASE
                WHEN ltv = 0 THEN '0'
                WHEN ltv < 1000 THEN '1-999'
                WHEN ltv < 5000 THEN '1000-4999'
                WHEN ltv < 10000 THEN '5000-9999'
                ELSE '10000+'
            END AS ltv_bucket,
            COUNT(*) AS customer_count,
            COALESCE(AVG(ltv), 0) AS avg_ltv
        FROM customers
        WHERE workspace_id = $1
        GROUP BY 1
        ORDER BY 1
        """,
        workspace_id,
    )


async def upsert_customer(
    workspace_id: str,
    shopify_customer_id: str,
    email: str | None,
    name: str | None,
    phone: str | None,
    city: str | None,
    state: str | None,
    country: str | None,
    total_orders: int,
    total_spent: float,
    avg_order_value: float | None,
    first_order_at: str | None,
    last_order_at: str | None,
    ltv: float,
    segment: str,
    tags: list[str] | None,
) -> dict | None:
    return await fetchrow(
        """
        INSERT INTO customers
            (workspace_id, shopify_customer_id, email, name, phone,
             city, state, country, total_orders, total_spent,
             avg_order_value, first_order_at, last_order_at, ltv, segment, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (workspace_id, shopify_customer_id)
        DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            country = EXCLUDED.country,
            total_orders = EXCLUDED.total_orders,
            total_spent = EXCLUDED.total_spent,
            avg_order_value = EXCLUDED.avg_order_value,
            first_order_at = EXCLUDED.first_order_at,
            last_order_at = EXCLUDED.last_order_at,
            ltv = EXCLUDED.ltv,
            segment = EXCLUDED.segment,
            tags = EXCLUDED.tags,
            updated_at = now()
        RETURNING id
        """,
        workspace_id, shopify_customer_id, email, name, phone,
        city, state, country, total_orders, total_spent,
        avg_order_value, first_order_at, last_order_at, ltv, segment, tags,
    )


async def get_customer_orders(workspace_id: str, customer_id: str) -> list[dict]:
    customer = await fetchrow(
        "SELECT shopify_customer_id FROM customers WHERE workspace_id = $1 AND id = $2",
        workspace_id, customer_id,
    )
    if not customer:
        return []
    return await fetch(
        """
        SELECT id, shopify_order_id, shopify_order_number, order_status, financial_status,
               gross_revenue, net_revenue, order_created_at
        FROM shopify_orders
        WHERE workspace_id = $1 AND customer_id = $2
        ORDER BY order_created_at DESC
        LIMIT 50
        """,
        workspace_id, customer["shopify_customer_id"],
    )
