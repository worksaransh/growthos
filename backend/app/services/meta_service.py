import json
import httpx
from loguru import logger
from datetime import datetime, timedelta, timezone
from typing import Optional
from ..core.database import execute


META_API_VERSION = "v19.0"
META_BASE_URL = f"https://graph.facebook.com/{META_API_VERSION}"


async def sync_meta_ads(
    access_token: str,
    ad_account_id: str,
    workspace_id: str,
    last_synced_at: Optional[datetime] = None,
    days_back: int = 2,
) -> dict:
    since = last_synced_at or (datetime.now(timezone.utc) - timedelta(days=days_back))
    until = datetime.now(timezone.utc)

    url = f"{META_BASE_URL}/act_{ad_account_id}/insights"
    params = {
        "fields": "spend,impressions,clicks,cpc,ctr",
        "level": "account",
        "time_range": json.dumps({
            "since": since.strftime("%Y-%m-%d"),
            "until": until.strftime("%Y-%m-%d"),
        }),
        "time_increment": 1,
        "access_token": access_token,
    }

    records_fetched = 0

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        for row in data.get("data", []):
            date_str = row.get("date_start")
            if not date_str:
                continue

            spend = float(row.get("spend", 0))
            impressions = int(row.get("impressions", 0))
            clicks = int(row.get("clicks", 0))
            cpc = float(row.get("cpc", 0)) if row.get("cpc") else None
            ctr = float(row.get("ctr", 0)) / 100 if row.get("ctr") else None

            await execute(
                """
                INSERT INTO ad_spend_daily
                    (workspace_id, platform, spend_date, spend, impressions, clicks,
                     cpc, ctr, platform_account_id)
                VALUES ($1, 'meta', $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (workspace_id, platform, spend_date)
                DO UPDATE SET
                    spend = EXCLUDED.spend,
                    impressions = EXCLUDED.impressions,
                    clicks = EXCLUDED.clicks,
                    cpc = EXCLUDED.cpc,
                    ctr = EXCLUDED.ctr,
                    updated_at = now()
                """,
                workspace_id,
                date_str,
                spend,
                impressions,
                clicks,
                cpc,
                ctr,
                ad_account_id,
            )

            records_fetched += 1

        # Handle pagination
        while "paging" in data and "next" in data["paging"]:
            resp = await client.get(data["paging"]["next"])
            resp.raise_for_status()
            data = resp.json()

            for row in data.get("data", []):
                date_str = row.get("date_start")
                if not date_str:
                    continue
                await _upsert_ad_spend_row(workspace_id, ad_account_id, row)
                records_fetched += 1

    logger.info(
        f"Meta Ads sync complete: {records_fetched} records synced"
    )

    return {
        "records_fetched": records_fetched,
        "records_inserted": records_fetched,
        "records_updated": 0,
    }


async def _upsert_ad_spend_row(
    workspace_id: str,
    ad_account_id: str,
    row: dict,
) -> None:
    spend = float(row.get("spend", 0))
    impressions = int(row.get("impressions", 0))
    clicks = int(row.get("clicks", 0))
    cpc = float(row.get("cpc", 0)) if row.get("cpc") else None
    ctr = float(row.get("ctr", 0)) / 100 if row.get("ctr") else None

    await execute(
        """
        INSERT INTO ad_spend_daily
            (workspace_id, platform, spend_date, spend, impressions, clicks,
             cpc, ctr, platform_account_id)
        VALUES ($1, 'meta', $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (workspace_id, platform, spend_date)
        DO UPDATE SET
            spend = EXCLUDED.spend,
            impressions = EXCLUDED.impressions,
            clicks = EXCLUDED.clicks,
            cpc = EXCLUDED.cpc,
            ctr = EXCLUDED.ctr,
            updated_at = now()
        """,
        workspace_id,
        row["date_start"],
        spend,
        impressions,
        clicks,
        cpc,
        ctr,
        ad_account_id,
    )
