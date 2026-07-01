import httpx
from loguru import logger
from datetime import datetime, timedelta, timezone
from typing import Optional
from ..core.database import execute


GOOGLE_OAUTH_URL = "https://oauth2.googleapis.com/token"
GOOGLE_ADS_URL = "https://googleads.googleapis.com/v16"


async def refresh_google_token(refresh_token: str, client_id: str, client_secret: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_OAUTH_URL,
            data={
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def sync_google_ads(
    access_token: str,
    refresh_token: str,
    customer_id: str,
    client_id: str,
    client_secret: str,
    developer_token: str,
    workspace_id: str,
    last_synced_at: Optional[datetime] = None,
    days_back: int = 2,
) -> dict:
    try:
        token = access_token
        if not token:
            token = await refresh_google_token(refresh_token, client_id, client_secret)
    except Exception as e:
        logger.error(f"Google Ads token refresh failed: {e}")
        raise

    headers = {
        "Authorization": f"Bearer {token}",
        "developer-token": developer_token,
        "login-customer-id": customer_id,
    }

    since = last_synced_at or (datetime.now(timezone.utc) - timedelta(days=days_back))
    until = datetime.now(timezone.utc)

    gaql = f"""
        SELECT
            segments.date,
            metrics.cost_micros,
            metrics.impressions,
            metrics.clicks
        FROM campaign
        WHERE segments.date BETWEEN '{since.strftime("%Y-%m-%d")}'
          AND '{until.strftime("%Y-%m-%d")}'
    """

    url = f"{GOOGLE_ADS_URL}/customers/{customer_id}/googleAds:search"
    records_fetched = 0

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json={"query": gaql})
        resp.raise_for_status()
        data = resp.json()

        for row in data.get("results", []):
            seg = row.get("segments", {}).get("date", {})
            date_str = seg.get("value") if isinstance(seg, dict) and "value" in seg else seg
            if isinstance(date_str, dict):
                continue

            metrics = row.get("metrics", {})
            cost_micros = int(metrics.get("costMicros", 0)) if isinstance(metrics.get("costMicros"), (int, float)) else 0
            impressions = int(metrics.get("impressions", 0)) if isinstance(metrics.get("impressions"), (int, float)) else 0
            clicks = int(metrics.get("clicks", 0)) if isinstance(metrics.get("clicks"), (int, float)) else 0
            spend = cost_micros / 1_000_000

            await execute(
                """
                INSERT INTO ad_spend_daily
                    (workspace_id, platform, spend_date, spend, impressions, clicks,
                     platform_account_id)
                VALUES ($1, 'google', $2, $3, $4, $5, $6)
                ON CONFLICT (workspace_id, platform, spend_date)
                DO UPDATE SET
                    spend = EXCLUDED.spend,
                    impressions = EXCLUDED.impressions,
                    clicks = EXCLUDED.clicks,
                    updated_at = now()
                """,
                workspace_id,
                date_str,
                spend,
                impressions,
                clicks,
                customer_id,
            )
            records_fetched += 1

        # Handle pagination
        while "nextPageToken" in data:
            resp = await client.post(
                url,
                headers=headers,
                json={"query": gaql, "pageToken": data["nextPageToken"]},
            )
            resp.raise_for_status()
            data = resp.json()
            for row in data.get("results", []):
                metrics = row.get("metrics", {})
                date_str = row.get("segments", {}).get("date", "")
                cost_micros = int(metrics.get("costMicros", 0))
                impressions = int(metrics.get("impressions", 0))
                clicks = int(metrics.get("clicks", 0))
                spend = cost_micros / 1_000_000

                if isinstance(date_str, str) and date_str:
                    await execute(
                        """
                        INSERT INTO ad_spend_daily
                            (workspace_id, platform, spend_date, spend, impressions, clicks,
                             platform_account_id)
                        VALUES ($1, 'google', $2, $3, $4, $5, $6)
                        ON CONFLICT (workspace_id, platform, spend_date)
                        DO UPDATE SET
                            spend = EXCLUDED.spend,
                            impressions = EXCLUDED.impressions,
                            clicks = EXCLUDED.clicks,
                            updated_at = now()
                        """,
                        workspace_id,
                        date_str,
                        spend,
                        impressions,
                        clicks,
                        customer_id,
                    )
                    records_fetched += 1

    logger.info(f"Google Ads sync complete: {records_fetched} records")
    return {
        "records_fetched": records_fetched,
        "records_inserted": records_fetched,
        "records_updated": 0,
    }
