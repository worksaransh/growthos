from ..core.database import fetch, fetchrow


async def get_metrics(
    workspace_id: str,
    start_date: str,
    end_date: str,
) -> list[dict]:
    return await fetch(
        """
        SELECT metric_date, gross_revenue, net_revenue, total_orders, aov,
               meta_spend, google_spend, total_ad_spend,
               blended_roas, cac, gross_profit, mer, is_complete
        FROM metrics_cache
        WHERE workspace_id = $1
          AND metric_date BETWEEN $2 AND $3
        ORDER BY metric_date ASC
        """,
        workspace_id,
        start_date,
        end_date,
    )


async def get_metrics_summary(
    workspace_id: str,
    start_date: str,
    end_date: str,
) -> dict | None:
    return await fetchrow(
        """
        SELECT
            COALESCE(SUM(gross_revenue), 0) AS gross_revenue,
            COALESCE(SUM(net_revenue), 0) AS net_revenue,
            COALESCE(SUM(total_orders), 0)::INTEGER AS total_orders,
            CASE
                WHEN SUM(total_orders) = 0 THEN NULL
                ELSE SUM(net_revenue) / SUM(total_orders)
            END AS aov,
            COALESCE(SUM(meta_spend), 0) AS meta_spend,
            COALESCE(SUM(google_spend), 0) AS google_spend,
            COALESCE(SUM(total_ad_spend), 0) AS total_ad_spend,
            CASE
                WHEN SUM(total_ad_spend) = 0 THEN NULL
                ELSE SUM(net_revenue) / SUM(total_ad_spend)
            END AS blended_roas,
            CASE
                WHEN SUM(total_orders) = 0 THEN NULL
                ELSE SUM(total_ad_spend) / SUM(total_orders)
            END AS cac,
            SUM(net_revenue) - SUM(total_ad_spend) AS gross_profit,
            CASE
                WHEN SUM(total_ad_spend) = 0 THEN NULL
                ELSE (SUM(net_revenue) - SUM(total_ad_spend)) / SUM(total_ad_spend)
            END AS mer
        FROM metrics_cache
        WHERE workspace_id = $1
          AND metric_date BETWEEN $2 AND $3
        """,
        workspace_id,
        start_date,
        end_date,
    )
