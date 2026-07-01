from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IntegrationStatus(BaseModel):
    id: str
    platform: str
    status: str
    account_name: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    sync_cursor: Optional[str] = None


class OAuthCallback(BaseModel):
    code: str
    state: str
    shop: Optional[str] = None  # Shopify


class ShopifyConnectRequest(BaseModel):
    store_url: str


class SyncTriggerResponse(BaseModel):
    message: str
    job_id: str


class SyncStatus(BaseModel):
    platform: str
    status: str
    last_synced_at: Optional[datetime] = None
    records_synced: int = 0
