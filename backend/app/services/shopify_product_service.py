import httpx
from loguru import logger
from typing import Optional
from ..repositories.product_repo import upsert_product


async def sync_shopify_products(
    access_token: str,
    store_url: str,
    workspace_id: str,
) -> dict:
    base_url = f"https://{store_url}/admin/api/2024-01"
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json",
    }

    records_fetched = 0
    records_upserted = 0

    async with httpx.AsyncClient() as client:
        url = f"{base_url}/products.json"
        params = {"limit": 250, "status": "any"}

        while url:
            try:
                resp = await client.get(url, headers=headers, params=params if "?" not in url else None)
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Shopify Products API error: {e.response.status_code} - {e.response.text}")
                raise

            products = data.get("products", [])
            records_fetched += len(products)

            for product in products:
                shopify_product_id = str(product["id"])
                title = product.get("title", "")
                vendor = product.get("vendor")
                product_type = product.get("product_type")
                status = product.get("status", "active")
                tags_str = product.get("tags", "")
                tags = [t.strip() for t in tags_str.split(",") if t.strip()] if tags_str else []

                result = await upsert_product(
                    workspace_id=workspace_id,
                    shopify_product_id=shopify_product_id,
                    title=title,
                    vendor=vendor,
                    product_type=product_type,
                    status=status,
                    tags=tags or None,
                )
                if result:
                    records_upserted += 1

            # Pagination via Link header
            link_header = resp.headers.get("Link", "")
            url = None
            if 'rel="next"' in link_header:
                for part in link_header.split(","):
                    if 'rel="next"' in part:
                        url = part.split(";")[0].strip().strip("<>")
                        params = None
                        break

    logger.info(
        f"Shopify products sync complete for {store_url}: "
        f"{records_fetched} fetched, {records_upserted} upserted"
    )

    return {
        "records_fetched": records_fetched,
        "records_upserted": records_upserted,
    }
