from ..core.database import fetch, fetchrow, execute


async def get_campaigns(
    workspace_id: str,
    platform: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    conditions = ["workspace_id = $1"]
    args = [workspace_id]
    idx = 2

    if platform:
        conditions.append(f"platform = ${idx}")
        args.append(platform)
        idx += 1
    if start_date:
        conditions.append(f"spend_date >= ${idx}")
        args.append(start_date)
        idx += 1
    if end_date:
        conditions.append(f"spend_date <= ${idx}")
        args.append(end_date)
        idx += 1

    where = " AND ".join(conditions)
    args.extend([limit, offset])

    return await fetch(
        f"""
        SELECT id, workspace_id, platform, platform_account_id,
               campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
               status, objective, spend_date, spend, impressions, clicks, conversions,
               cpc, ctr, cpm, frequency, reach, created_at, updated_at
        FROM ad_campaigns
        WHERE {where}
        ORDER BY spend_date DESC, spend DESC
        LIMIT ${idx} OFFSET ${idx + 1}
        """,
        *args,
    )


async def get_campaigns_summary(
    workspace_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    conditions = ["workspace_id = $1"]
    args = [workspace_id]
    idx = 2

    if start_date:
        conditions.append(f"spend_date >= ${idx}")
        args.append(start_date)
        idx += 1
    if end_date:
        conditions.append(f"spend_date <= ${idx}")
        args.append(end_date)
        idx += 1

    where = " AND ".join(conditions)

    return await fetch(
        f"""
        SELECT platform, campaign_id, campaign_name,
               SUM(spend) AS total_spend,
               SUM(impressions) AS total_impressions,
               SUM(clicks) AS total_clicks,
               SUM(conversions) AS total_conversions,
               CASE WHEN SUM(clicks) = 0 THEN NULL
                    ELSE SUM(spend) / SUM(clicks) END AS avg_cpc,
               CASE WHEN SUM(impressions) = 0 THEN NULL
                    ELSE SUM(clicks)::NUMERIC / SUM(impressions) END AS avg_ctr
        FROM ad_campaigns
        WHERE {where}
        GROUP BY platform, campaign_id, campaign_name
        ORDER BY total_spend DESC
        """,
        *args,
    )


async def get_campaign(workspace_id: str, campaign_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, platform, platform_account_id,
               campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
               status, objective, spend_date, spend, impressions, clicks, conversions,
               cpc, ctr, cpm, frequency, reach, created_at, updated_at
        FROM ad_campaigns
        WHERE workspace_id = $1 AND id = $2
        """,
        workspace_id, campaign_id,
    )


async def upsert_campaign(
    workspace_id: str,
    platform: str,
    platform_account_id: str,
    campaign_id: str,
    campaign_name: str | None,
    adset_id: str | None,
    adset_name: str | None,
    ad_id: str | None,
    ad_name: str | None,
    status: str,
    objective: str | None,
    spend_date: str,
    spend: float,
    impressions: int,
    clicks: int,
    conversions: int,
    cpc: float | None,
    ctr: float | None,
    cpm: float | None,
    frequency: float | None,
    reach: int,
) -> None:
    await execute(
        """
        INSERT INTO ad_campaigns
            (workspace_id, platform, platform_account_id,
             campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
             status, objective, spend_date, spend, impressions, clicks, conversions,
             cpc, ctr, cpm, frequency, reach)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21)
        ON CONFLICT (workspace_id, platform, campaign_id, adset_id, ad_id, spend_date)
        DO UPDATE SET
            campaign_name = EXCLUDED.campaign_name,
            adset_name = EXCLUDED.adset_name,
            ad_name = EXCLUDED.ad_name,
            status = EXCLUDED.status,
            spend = EXCLUDED.spend,
            impressions = EXCLUDED.impressions,
            clicks = EXCLUDED.clicks,
            conversions = EXCLUDED.conversions,
            cpc = EXCLUDED.cpc,
            ctr = EXCLUDED.ctr,
            cpm = EXCLUDED.cpm,
            frequency = EXCLUDED.frequency,
            reach = EXCLUDED.reach,
            updated_at = now()
        """,
        workspace_id, platform, platform_account_id,
        campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
        status, objective, spend_date, spend, impressions, clicks, conversions,
        cpc, ctr, cpm, frequency, reach,
    )
