from pydantic import BaseModel
from typing import Optional
from datetime import date


class MetricsRow(BaseModel):
    metric_date: date
    gross_revenue: float
    net_revenue: float
    total_orders: int
    aov: Optional[float] = None
    meta_spend: float
    google_spend: float
    total_ad_spend: float
    blended_roas: Optional[float] = None
    cac: Optional[float] = None
    gross_profit: Optional[float] = None
    mer: Optional[float] = None
    is_complete: bool = False
